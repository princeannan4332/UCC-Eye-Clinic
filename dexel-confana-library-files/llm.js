export class LLMClient {
  constructor(root) {
    this._root = root;
  }

  async chat(message, options = {}) {
    const {
      model = "gemini-2.5-flash",
      system_prompt = null,
      history = null,
      temperature = 0.7,
      max_tokens = 1024,
    } = options;

    const messages = this._buildMessages(message, system_prompt, history);
    const payload = {
      messages,
      model,
      temperature,
      max_tokens,
    };

    const data = await this._root._engine_post("/llm/chat", payload);
    const reply = data.reply || "";

    if (history) {
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: reply });
    }

    return reply;
  }

  async *stream(message, options = {}) {
    const {
      model = "gemini-2.5-flash",
      system_prompt = null,
      history = null,
      temperature = 0.7,
      max_tokens = 1024,
    } = options;

    const messages = this._buildMessages(message, system_prompt, history);
    const payload = {
      messages,
      model,
      temperature,
      max_tokens,
      stream: true,
    };

    const url = `${this._root.engine_url}/llm/stream`;
    const resp = await fetch(url, {
      method: "POST",
      headers: this._root._headers,
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status} - ${await resp.text()}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullReply = "";

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
          if (line) {
            fullReply += line;
            yield line;
          }
        }
        if (done) {
          if (buffer) {
            fullReply += buffer;
            yield buffer;
          }
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (history) {
      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: fullReply });
    }
  }

  _buildMessages(message, system_prompt, history) {
    const messages = [];
    if (system_prompt) {
      messages.push({ role: "system", content: system_prompt });
    }
    if (history) {
      messages.push(...history);
    }
    messages.push({ role: "user", content: message });
    return messages;
  }
}
