import WebSocket from "ws";
import { SessionError } from "./exceptions.js";

export class VoiceWebSocket {
  constructor(root, session_id) {
    this._root = root;
    this.session_id = session_id;
    this._ws = null;
    this.queue = [];
    this.resolveNext = null;
    this.isDone = false;
    this.error = null;
  }

  connect() {
    const wsUrl =
      this._root.engine_url
        .replace("https://", "wss://")
        .replace("http://", "ws://") + `/voice/ws/${this.session_id}`;

    this._ws = new WebSocket(wsUrl);

    this._ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        this.queue.push(msg);
        if (this.resolveNext) {
          this.resolveNext();
          this.resolveNext = null;
        }
      } catch (err) {
        // Handle non-JSON messages if any
        this.queue.push({ type: "raw", data: data.toString() });
        if (this.resolveNext) {
          this.resolveNext();
          this.resolveNext = null;
        }
      }
    });

    this._ws.on("close", () => {
      this.isDone = true;
      if (this.resolveNext) {
        this.resolveNext();
        this.resolveNext = null;
      }
    });

    this._ws.on("error", (err) => {
      this.error = err;
      if (this.resolveNext) {
        this.resolveNext();
        this.resolveNext = null;
      }
    });

    return new Promise((resolve, reject) => {
      this._ws.once("open", () => resolve(this));
      this._ws.once("error", (err) => reject(err));
    });
  }

  send_audio(pcm_bytes) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      const b64 = Buffer.isBuffer(pcm_bytes)
        ? pcm_bytes.toString("base64")
        : Buffer.from(pcm_bytes).toString("base64");
      this._ws.send(
        JSON.stringify({
          type: "audio_chunk",
          data: b64,
        })
      );
    }
  }

  signal_end_of_speech() {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify({ type: "end_of_speech" }));
    }
  }

  ping() {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify({ type: "ping" }));
    }
  }

  disconnect() {
    if (this._ws) {
      this._ws.close();
    }
  }

  async *events() {
    while (!this.isDone || this.queue.length > 0) {
      if (this.error) {
        throw this.error;
      }
      if (this.queue.length > 0) {
        yield this.queue.shift();
      } else {
        await new Promise((resolve) => {
          this.resolveNext = resolve;
        });
      }
    }
  }
}

export class AgentSession {
  constructor(root, session_id, agent_id) {
    this._root = root;
    this.session_id = session_id;
    this.agent_id = agent_id;
  }

  async *stream(message) {
    const url = `${this._root.engine_url}/chat/${this.session_id}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: this._root._headers,
      body: JSON.stringify({ message }),
    });

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status} - ${await resp.text()}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done && !buffer) break;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
        }
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              const event = data.event;
              if (event === "token" || event === "chunk") {
                yield data.text || "";
              } else if (event === "done") {
                return;
              } else if (event === "error") {
                throw new Error(data.message || "Unknown session error");
              }
            } catch (e) {
              yield line;
            }
          }
        }
        if (done) {
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer);
              if (data.event === "token" || data.event === "chunk") {
                yield data.text || "";
              }
            } catch (e) {
              yield buffer;
            }
          }
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async chat(message) {
    let fullReply = "";
    for await (const token of this.stream(message)) {
      fullReply += token;
    }
    return fullReply.trim();
  }

  async history() {
    const data = await this._root._engine_get(`/chat/${this.session_id}/history`);
    return data.history || [];
  }

  async reset() {
    await this._root._engine_post(`/agent/reset/${this.session_id}`);
  }

  async state() {
    return this._root._engine_get(`/agent/state/${this.session_id}`);
  }

  async end() {
    const url = `${this._root.engine_url}/chat/${this.session_id}`;
    await fetch(url, {
      method: "DELETE",
      headers: this._root._headers,
    });
  }

  voice_ws() {
    return new VoiceWebSocket(this._root, this.session_id);
  }
}

export class AgentClient {
  constructor(root) {
    this._root = root;
  }

  async session(agent_id, options = {}) {
    const {
      language = "en",
      tts_engine = "omnivoice",
      llm_model = null,
      session_id = null,
    } = options;

    try {
      // Fetch the agent's full config from the backend
      // Route: GET /api/dashboard/agents/:id/resolve (public, no auth required)
      // Returns: { success: true, config: { graph, system_prompt, first_message, tools, ... } }
      const response = await this._root._get(`/api/dashboard/agents/${agent_id}/resolve`);
      const config = response.config || {};

      const payload = {
        agent_id,
        graph: config.graph || { nodes: [], edges: [] },
        system_prompt: config.system_prompt || "",
        first_message: config.first_message || "",
        language: language || config.language || "en",
        tts_engine: tts_engine || config.tts_engine || "omnivoice",
        rag_enabled: config.rag_enabled || false,
        pinecone_index_name: config.pinecone_index_name,
        tools: config.tools || [],
        knowledge_base: config.knowledge_base || {},
        interrupt_first_message: config.interrupt_first_message !== false,
        first_message_audio: config.first_message_audio || [],
        llm_provider: config.llm_provider || "openai",
        llm_model: llm_model || config.llm_model || "gpt-4o-mini",
        voiceCloneRefText: config.voiceCloneRefText || "",
        voiceCloneAudioS3Key: config.voiceCloneAudioS3Key,
        speaker: config.speaker,
        history: [],
        pointer: null,
        session_id,
      };

      const data = await this._root._engine_post("/agent/load", payload);
      const sid = data.session_id;
      if (!sid) {
        throw new SessionError("Engine returned no session_id");
      }

      return new AgentSession(this._root, sid, agent_id);
    } catch (exc) {
      if (exc instanceof SessionError) throw exc;
      throw new SessionError(`Could not create agent session: ${exc.message}`);
    }
  }

  async from_graph(graph, options = {}) {
    const {
      system_prompt = "",
      first_message = "",
      language = "en",
      llm_provider = null,
      llm_model = "gpt-4o-mini",
      tools = null,
      knowledge_base = null,
    } = options;

    try {
      const payload = {
        graph,
        system_prompt,
        first_message,
        language,
        tts_engine: "omnivoice",
        llm_provider,
        llm_model,
        tools: tools || [],
        knowledge_base: knowledge_base || {},
        history: [],
        pointer: null,
      };
      const data = await this._root._engine_post("/agent/load", payload);
      const sid = data.session_id;
      if (!sid) {
        throw new SessionError("Engine returned no session_id");
      }
      return new AgentSession(this._root, sid, "custom");
    } catch (exc) {
      throw new SessionError(`Could not create agent session: ${exc.message}`);
    }
  }
}
