import { PhoneError } from "./exceptions.js";

export class PhoneClient {
  constructor(root) {
    this._root = root;
  }

  async call(agent_id, to, options = {}) {
    const { from_number = null, language = "en", tts_engine = "omnivoice" } = options;
    try {
      const payload = {
        agent_id,
        to,
        from_number,
        language,
        tts_engine,
      };
      return await this._root._engine_post("/twilio/voice/outbound", payload);
    } catch (exc) {
      throw new PhoneError(`Could not place outbound call: ${exc.message}`);
    }
  }

  async callStatus(call_sid) {
    try {
      return await this._root._engine_get(`/twilio/voice/status/${call_sid}`);
    } catch (exc) {
      throw new PhoneError(`Could not get call status: ${exc.message}`);
    }
  }

  async listCalls(agent_id, options = {}) {
    const { limit = 20 } = options;
    try {
      const data = await this._root._engine_get(`/twilio/voice/calls/${agent_id}`);
      let calls = data.calls || [];
      if (limit) {
        calls = calls.slice(0, limit);
      }
      return calls;
    } catch (exc) {
      throw new PhoneError(`Could not list calls: ${exc.message}`);
    }
  }

  inboundWebhookUrl(agent_id) {
    return `${this._root.engine_url}/twilio/voice/inbound/${agent_id}`;
  }

  async hangup(call_sid) {
    try {
      return await this._root._engine_post(`/twilio/voice/hangup/${call_sid}`);
    } catch (exc) {
      throw new PhoneError(`Could not hang up call: ${exc.message}`);
    }
  }

  async assignNumber(phone_number, twilio_sid, twilio_auth_token, agent_id = null) {
    try {
      const payload = {
        phoneNumber: phone_number,
        twilioSid: twilio_sid,
        twilioAuthToken: twilio_auth_token,
      };
      if (agent_id) {
        payload.agentId = agent_id;
      }
      return await this._root._post("/api/dashboard/phone-numbers", payload);
    } catch (exc) {
      throw new PhoneError(`Could not assign phone number: ${exc.message}`);
    }
  }
}
