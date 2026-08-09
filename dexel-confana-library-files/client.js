import { TTSClient } from "./tts.js";
import { ASRClient } from "./asr.js";
import { LLMClient } from "./llm.js";
import { AgentClient } from "./agent.js";
import { PhoneClient } from "./phone.js";

export class ConfanaClient {
  static DEFAULT_BASE_URL = "https://api.confana.ai";
  static DEFAULT_ENGINE_URL = "https://engine.confana.ai";

  constructor({ api_key, base_url, engine_url }) {
    if (!api_key) {
      throw new Error("api_key is required");
    }
    this.api_key = api_key;
    this.base_url = (base_url || ConfanaClient.DEFAULT_BASE_URL).replace(/\/$/, "");
    this.engine_url = (engine_url || ConfanaClient.DEFAULT_ENGINE_URL).replace(/\/$/, "");

    this._headers = {
      "Authorization": `Bearer ${api_key}`,
      "Content-Type": "application/json",
    };

    this.tts = new TTSClient(this);
    this.asr = new ASRClient(this);
    this.llm = new LLMClient(this);
    this.agent = new AgentClient(this);
    this.phone = new PhoneClient(this);
  }

  async _get(path, options = {}) {
    const url = `${this.base_url}${path}`;
    const resp = await fetch(url, {
      method: "GET",
      headers: { ...this._headers, ...options.headers },
    });
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status} - ${await resp.text()}`);
    }
    return resp.json();
  }

  async _post(path, body, options = {}) {
    const url = `${this.base_url}${path}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...this._headers, ...options.headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status} - ${await resp.text()}`);
    }
    return resp.json();
  }

  async _engine_post(path, body, options = {}) {
    const url = `${this.engine_url}${path}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...this._headers, ...options.headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status} - ${await resp.text()}`);
    }
    return resp.json();
  }

  async _engine_get(path, options = {}) {
    const url = `${this.engine_url}${path}`;
    const resp = await fetch(url, {
      method: "GET",
      headers: { ...this._headers, ...options.headers },
    });
    if (!resp.ok) {
      throw new Error(`HTTP error! status: ${resp.status} - ${await resp.text()}`);
    }
    return resp.json();
  }
}
