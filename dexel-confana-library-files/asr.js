import fs from "fs/promises";
import WebSocket from "ws";
import { ASRError } from "./exceptions.js";

export class ASRClient {
  constructor(root) {
    this._root = root;
  }

  async transcribe(filePath, options = {}) {
    const audioBytes = await fs.readFile(filePath);
    return this.transcribeBytes(audioBytes, options);
  }

  async transcribeBytes(audioBytes, options = {}) {
    const {
      language = "auto",
      beam_size = 5,
      temperature = 0.0,
    } = options;
    try {
      const resolvedLang = language === "auto" ? "en" : language;

      // Node 18+ native fetch requires FormData + Blob for multipart uploads.
      // The npm `form-data` package produces a Readable stream that native fetch
      // cannot serialize as multipart — so we always use the native globals here.
      const buf = Buffer.isBuffer(audioBytes) ? audioBytes : Buffer.from(audioBytes);
      const blob = new Blob([buf], { type: "audio/wav" });

      const form = new FormData();
      form.append("audio", blob, "audio.wav");
      form.append("language_code", resolvedLang);
      form.append("beam_size", String(beam_size));
      form.append("temperature", String(temperature));

      const url = `${this._root.engine_url}/voice/test-stt`;
      // Do NOT set Content-Type manually — native fetch sets it with the
      // correct multipart boundary when the body is a FormData instance.
      const headers = {
        Authorization: `Bearer ${this._root.api_key}`,
      };

      const resp = await fetch(url, { method: "POST", body: form, headers });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      const data = await resp.json();
      return data.text || "";
    } catch (exc) {
      throw new ASRError(`ASR transcription failed: ${exc.message}`);
    }
  }

  async *streamMicrophone(options = {}) {
    const { language = "auto", silence_ms = 1200, sample_rate = 16000 } = options;

    const { spawn } = await import("child_process");
    const os = await import("os");

    // On Windows: `rec` alias is unavailable — call `sox` with `-d` (default audio device).
    // On Linux/macOS: `rec` is a SoX alias that captures from the default device directly.
    const isWindows = os.platform() === "win32";
    const cmd = isWindows ? "sox" : "rec";
    const args = isWindows
      ? ["-q", "-V0", "-d", "-r", String(sample_rate), "-c", "1", "-b", "16", "-t", "raw", "-"]
      : ["-q", "-V0", "-r", String(sample_rate), "-c", "1", "-b", "16", "-t", "raw", "-"];

    const recProcess = spawn(cmd, args);

    // Surface spawn errors (e.g. SoX not installed) as readable ASRErrors
    recProcess.on("error", (err) => {
      if (err.code === "ENOENT") {
        throw new ASRError(
          `Microphone capture requires SoX to be installed.\n` +
          `  Windows: https://sourceforge.net/projects/sox/files/sox/\n` +
          `  macOS:   brew install sox\n` +
          `  Linux:   sudo apt install sox`
        );
      }
      throw new ASRError(`Failed to start audio capture: ${err.message}`);
    });

    try {
      yield* this.streamAudio(recProcess.stdout, { language, silence_ms, sample_rate });
    } finally {
      try { recProcess.kill(); } catch (_) {}
    }
  }

  async *streamAudio(audioStream, options = {}) {
    const { language = "auto", sample_rate = 16000 } = options;
    const wsUrl =
      this._root.engine_url
        .replace("https://", "wss://")
        .replace("http://", "ws://") + "/asr/stream";

    const ws = new WebSocket(wsUrl);
    const queue = [];
    let resolveNext = null;
    let isDone = false;
    let error = null;

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          type: "start",
          language: language === "auto" ? "en" : language,
          auto_detect: language === "auto",
          api_key: this._root.api_key,
        })
      );

      audioStream.on("data", (chunk) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "audio_chunk",
              data: chunk.toString("base64"),
            })
          );
        }
      });

      audioStream.on("end", () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
    });

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === "transcript" && msg.text) {
        queue.push(msg.text);
        if (resolveNext) {
          resolveNext();
          resolveNext = null;
        }
      } else if (msg.type === "error") {
        error = new ASRError(msg.message || "ASR streaming error");
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
      error = new ASRError(err.message);
      ws.close();
    });

    try {
      while (!isDone || queue.length > 0) {
        if (error) throw error;
        if (queue.length > 0) {
          yield queue.shift();
        } else {
          await new Promise((resolve) => {
            resolveNext = resolve;
          });
        }
      }
    } finally {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
  }
}
