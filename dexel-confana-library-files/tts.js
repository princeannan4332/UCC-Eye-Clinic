import fs from "fs/promises";
import WebSocket from "ws";
import { TTSError } from "./exceptions.js";

const TTS_ENGINE = "omnivoice";

async function fetchUrlBytes(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch URL: ${url}`);
  }
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function chunksToWav(chunks, sampleRate = 24000) {
  const buffers = chunks.map((c) => Buffer.from(c, "base64"));
  const rawPcm = Buffer.concat(buffers);

  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write("RIFF", 0);
  // File size minus 8
  header.writeUInt32LE(36 + rawPcm.length, 4);
  // WAVE identifier
  header.write("WAVE", 8);
  // fmt subchunk identifier
  header.write("fmt ", 12);
  // Subchunk 1 size (16 for PCM)
  header.writeUInt32LE(16, 16);
  // Audio format (1 for PCM)
  header.writeUInt16LE(1, 20);
  // Number of channels (1)
  header.writeUInt16LE(1, 22);
  // Sample rate (24000)
  header.writeUInt32LE(sampleRate, 24);
  // Byte rate (sampleRate * 2)
  header.writeUInt32LE(sampleRate * 2, 28);
  // Block align (2)
  header.writeUInt16LE(2, 32);
  // Bits per sample (16)
  header.writeUInt16LE(16, 34);
  // data subchunk identifier
  header.write("data", 36);
  // Data size
  header.writeUInt32LE(rawPcm.length, 40);

  return Buffer.concat([header, rawPcm]);
}

export class TTSClient {
  constructor(root) {
    this._root = root;
  }

  async speak(text, options = {}) {
    const {
      language = "en",
      speaker = null,
      voice_clone_audio = null,
      voice_clone_url = null,
      voice_clone_ref_text = null,
      num_step = null,
      temperature = null,
    } = options;

    try {
      let cloneAudio = voice_clone_audio;
      if (voice_clone_url && !cloneAudio) {
        cloneAudio = await fetchUrlBytes(voice_clone_url);
      }

      const payload = {
        text,
        language,
        tts_engine: TTS_ENGINE,
      };

      if (speaker !== null) {
        payload.speaker = speaker;
      }
      if (cloneAudio) {
        payload.voice_clone_audio_b64 = cloneAudio.toString("base64");
      }
      if (voice_clone_ref_text) {
        payload.voice_clone_ref_text = voice_clone_ref_text;
      }
      if (num_step !== null) {
        payload.num_step = num_step;
      }
      if (temperature !== null) {
        payload.temperature = temperature;
      }

      const data = await this._root._engine_post("/agent/generate-tts", payload);
      const chunks = data.chunks || [];

      return chunksToWav(chunks, 24000);
    } catch (exc) {
      throw new TTSError(`TTS synthesis failed: ${exc.message}`);
    }
  }

  async speakToFile(text, outputPath, options = {}) {
    const audio = await this.speak(text, options);
    await fs.writeFile(outputPath, audio);
    return outputPath;
  }

  async *stream(text, options = {}) {
    const {
      language = "en",
      speaker = null,
      sample_rate = 24000,
      voice_clone_audio = null,
      voice_clone_url = null,
      voice_clone_ref_text = null,
      tts_engine = "omnivoice",
      num_step = null,
      temperature = null,
    } = options;

    let voiceCloneAudioBuffer = voice_clone_audio;
    if (voice_clone_url && !voiceCloneAudioBuffer) {
      voiceCloneAudioBuffer = await fetchUrlBytes(voice_clone_url);
    }

    const wsUrl =
      this._root.engine_url
        .replace("https://", "wss://")
        .replace("http://", "ws://") + "/voice/tts-stream";

    const ws = new WebSocket(wsUrl);

    const queue = [];
    let resolveNext = null;
    let isDone = false;
    let error = null;

    ws.on("open", () => {
      const payload = {
        type: "tts_request",
        text,
        language,
        api_key: this._root.api_key,
        tts_engine,
      };
      if (speaker !== null) {
        payload.speaker = speaker;
      }
      if (voiceCloneAudioBuffer) {
        payload.voice_clone_audio_b64 = voiceCloneAudioBuffer.toString("base64");
      }
      if (voice_clone_ref_text) {
        payload.voice_clone_ref_text = voice_clone_ref_text;
      }
      if (num_step !== null) {
        payload.num_step = num_step;
      }
      if (temperature !== null) {
        payload.temperature = temperature;
      }
      ws.send(JSON.stringify(payload));
    });

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "audio_chunk") {
        queue.push(msg.data);
        if (resolveNext) {
          resolveNext();
          resolveNext = null;
        }
      } else if (msg.type === "error") {
        error = new TTSError(msg.message || "Unknown synthesis error");
        ws.close();
      } else if (msg.type === "done") {
        ws.close();
      }
    });

    ws.on("close", () => {
      isDone = true;
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    });

    ws.on("error", (err) => {
      error = new TTSError(err.message);
      ws.close();
    });

    while (!isDone || queue.length > 0) {
      if (error) {
        throw error;
      }
      if (queue.length > 0) {
        yield queue.shift();
      } else {
        await new Promise((resolve) => {
          resolveNext = resolve;
        });
      }
    }
  }
}
