import { confanaClient } from '../config/confana.js';

/**
 * 1. Language Translation from speech -> text
 * Accepts uploaded audio file ("audio") or text body.
 * Transcribes audio via Confana ASR.
 */
export const translateTextOrAudio = async (req, res) => {
  try {
    const { sourceLang = "en", targetLang = "es", text } = req.body || {};

    let originalText = text || "";

    if (req.file) {
      console.log(`Transcribing input speech in language: ${sourceLang}`);
      originalText = await confanaClient.asr.transcribeBytes(req.file.buffer, {
        language: sourceLang,
      });

      if (!originalText) {
        return res.status(400).json({ error: "Could not transcribe audio. Speech might be too quiet or unclear." });
      }

      console.log(`Transcription: "${originalText}"`);
    } else if (!originalText) {
      return res.status(400).json({ error: "No audio file or text prompt provided" });
    }

    res.json({ originalText });
  } catch (error) {
    console.error("Translation transcription error:", error);
    res.status(500).json({ error: error.message || "Failed to process translation request" });
  }
};

/**
 * 2. SSE endpoint for Gemini streaming translation
 */
export const streamTranslation = async (req, res) => {
  const { text, sourceLang = "en", targetLang = "es" } = req.query;
  if (!text || !targetLang) {
    return res.status(400).json({ error: "Missing text or targetLang parameters" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const langNames = {
      ak: "Akan (Twi/Fante)",
      ee: "Ewe",
      ga: "Ga",
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      zh: "Chinese",
      ja: "Japanese"
    };

    const sourceLangName = langNames[sourceLang] || sourceLang || "English";
    const targetLangName = langNames[targetLang] || targetLang || "Akan (Twi/Fante)";

    const prompt = `You are a world-class expert medical interpreter and multilingual translator specializing in clinical consultations between eye clinic doctors and patients.

Task: Translate the following clinical spoken utterance accurately from ${sourceLangName} into fluent, natural ${targetLangName}.

Guidelines:
1. Interpret the precise intended clinical meaning of the spoken sentence, correcting minor speech-to-text transcript slips or informal spoken idioms.
2. For African languages such as Akan (Twi/Fante), Ewe, or Ga, use natural, authentic, everyday spoken dialogue that native speakers use for medical eye symptoms (e.g., eye itching, blurred vision, eye pain, optical checkup, eye drops).
3. Do NOT include any intro, commentary, metadata, notes, quotation marks, or explanations.
4. Output strictly the direct, fluent translated text in ${targetLangName}.

Utterance to translate:
"${text}"`;

    console.log(`Streaming Gemini translation [${sourceLangName} -> ${targetLangName}] for: "${text}"`);

    for await (const chunk of confanaClient.llm.stream(prompt, {
      model: "gemini-2.5-flash",
      temperature: 0.2,
    })) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Gemini streaming error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message || "Streaming failed" })}\n\n`);
    res.end();
  }
};


/**
 * 3. Voice Clone / Standard TTS endpoint
 * Accepts text and optional reference audio file ("refAudio") for voice cloning.
 */
export const synthesizeSpeech = async (req, res) => {
  try {
    const { text, language = "en", speaker = "Adwoa", voiceCloneRefText = "", numStep = 32 } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: "Missing text to synthesize" });
    }

    const steps = numStep ? parseInt(numStep, 10) : 32;
    const activeSpeaker = speaker || "Adwoa";

    console.log(`Generating TTS: "${text}" [lang=${language}] [speaker=${activeSpeaker}] [num_step=${steps}]`);
    const options = { language, num_step: steps, speaker: activeSpeaker };

    if (req.file) {
      console.log("Using reference audio file for voice cloning");
      options.voice_clone_audio = req.file.buffer;
      options.voice_clone_ref_text = voiceCloneRefText || "Reference speech text";
    }

    const audioBuffer = await confanaClient.tts.speak(text, options);

    res.setHeader("Content-Type", "audio/wav");
    return res.send(audioBuffer);
  } catch (error) {
    console.error("TTS synthesis error:", error);
    return res.status(500).json({ error: error.message || "TTS synthesis failed" });
  }
};



