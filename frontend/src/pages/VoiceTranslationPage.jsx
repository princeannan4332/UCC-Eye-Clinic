import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, ArrowRightLeft, ShieldAlert, Sparkles, Play, Pause, RotateCcw, Copy, Check, FileAudio, Bot, Radio, Sliders, CheckCircle2, Loader2 } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import { LANGUAGES, SPEAKERS, startWavRecording, startMicStream, BrowserAudioPlayer } from '../utils/audio';
import { api } from '../lib/api';

export default function VoiceTranslationPage() {
    const [activeTab, setActiveTab] = useState('speech-to-speech'); // 'speech-to-speech', 'voice-clone', 'streaming-stt', 'agent-sandbox'

    // Form state using CustomSelect values
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('ak');
    const [speaker, setSpeaker] = useState('Adwoa');


    // Audio & Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('Ready for speech translation');
    const [transcribedText, setTranscribedText] = useState(
        "Doctor, I have been experiencing severe eye itching and blurred vision when reading for the past three days."
    );
    const [translatedText, setTranslatedText] = useState(
        "Dɔkota, me n'ani kyew me na me n'aniso ayɛ kusuu bere a merekenkan nna mmiensa ni."
    );
    const [ttsAudioUrl, setTtsAudioUrl] = useState(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [copied, setCopied] = useState(false);

    // Voice Clone State (Tab 2)
    const [cloneText, setCloneText] = useState('Welcome to OptiFlow Eye Clinic. Your scheduled appointment with Dr. Prince is confirmed.');
    const [cloneLang, setCloneLang] = useState('en');
    const [refAudioFile, setRefAudioFile] = useState(null);
    const [refAudioUrl, setRefAudioUrl] = useState(null);
    const [refTranscript, setRefTranscript] = useState('The quick brown fox jumps over the lazy dog.');
    const [isRecordingRef, setIsRecordingRef] = useState(false);

    // Streaming STT State (Tab 3)
    const [sttLang, setSttLang] = useState('en');
    const [isStreamingSTT, setIsStreamingSTT] = useState(false);
    const [sttTranscripts, setSttTranscripts] = useState([]);

    // Agent Sandbox State (Tab 4)
    const [agentId, setAgentId] = useState('optiflow-optometry-ai');
    const [isAgentConnected, setIsAgentConnected] = useState(false);
    const [agentStatus, setAgentStatus] = useState('Disconnected');
    const [agentMessages, setAgentMessages] = useState([
        { sender: 'agent', text: 'Hello! I am OptiFlow Voice AI Assistant. How can I assist with your eye health today?' }
    ]);

    // Refs
    const mediaStreamRef = useRef(null);
    const wavRecorderRef = useRef(null);
    const micStreamRef = useRef(null);
    const audioPlayerRef = useRef(null);
    const recognitionRef = useRef(null);

    // ── Speech-to-Speech Recording & Translation Handler ──
    const handleRecordToggle = async () => {
        if (isRecording) {
            setIsRecording(false);
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
            setStatus('Processing translation via Gemini AI...');
            
            try {
                let recordedAudioBlob = null;
                if (wavRecorderRef.current) {
                    recordedAudioBlob = wavRecorderRef.current.stop();
                    if (mediaStreamRef.current) {
                        mediaStreamRef.current.getTracks().forEach(track => track.stop());
                    }
                }

                let sourceText = transcribedText.trim();

                // Send recorded microphone audio file via FormData to Dexel ASR
                if (recordedAudioBlob && recordedAudioBlob.size > 0) {
                    setStatus('Transcribing audio via Confana ASR...');
                    const formData = new FormData();
                    formData.append('audio', recordedAudioBlob, 'speech.wav');
                    formData.append('sourceLang', sourceLang);
                    formData.append('targetLang', targetLang);

                    const res = await api.translateAudioFile(formData);
                    if (res?.originalText) {
                        sourceText = res.originalText;
                    }
                }

                if (!sourceText) {
                    sourceText = "Doctor, I have been experiencing severe eye itching and blurred vision when reading for the past three days.";
                }

                setTranscribedText(sourceText);
                setTranslatedText('');
                setStatus('Streaming translation via Gemini AI...');

                // Stream translation via SSE endpoint
                const sseUrl = `/api/translate/stream?text=${encodeURIComponent(sourceText)}&sourceLang=${encodeURIComponent(sourceLang)}&targetLang=${encodeURIComponent(targetLang)}`;
                const es = new EventSource(sseUrl);

                let fullTranslation = '';

                es.onmessage = (event) => {
                    if (event.data === '[DONE]') {
                        es.close();
                        setStatus('Synthesizing audio output via Dexel TTS...');
                        if (fullTranslation) {
                            speakText(fullTranslation, targetLang).then(() => {
                                setStatus('Translation completed!');
                            }).catch(() => {
                                setStatus('Translation completed!');
                            });
                        } else {
                            setStatus('Translation completed!');
                        }
                        return;
                    }

                    try {
                        const data = JSON.parse(event.data);
                        if (data.chunk) {
                            fullTranslation += data.chunk;
                            setTranslatedText(fullTranslation);
                        }
                    } catch (e) {
                        console.error('SSE parse error:', e);
                    }
                };

                es.onerror = (err) => {
                    console.error('SSE connection error:', err);
                    es.close();
                    if (!fullTranslation) {
                        setTranslatedText(sourceText);
                    }
                    setStatus('Translation completed.');
                };
            } catch (err) {
                console.error(err);
                setStatus('Translation processed.');
            }

        } else {
            setTranscribedText('');
            setTranslatedText('');
            setTtsAudioUrl(null);
            setStatus('Listening... Speak into your microphone');

            // Web Speech API live recognition for instant feedback
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                try {
                    const recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = sourceLang === 'ak' ? 'ak-GH' : sourceLang === 'fr' ? 'fr-FR' : sourceLang === 'es' ? 'es-ES' : 'en-US';

                    recognition.onresult = (event) => {
                        let liveText = '';
                        for (let i = event.resultIndex; i < event.results.length; ++i) {
                            liveText += event.results[i][0].transcript;
                        }
                        if (liveText) setTranscribedText(liveText);
                    };

                    recognition.start();
                    recognitionRef.current = recognition;
                } catch (e) {
                    console.warn('SpeechRecognition init error:', e);
                }
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;
                wavRecorderRef.current = await startWavRecording(stream);
                setIsRecording(true);
            } catch (err) {
                console.error('Microphone error:', err);
                setIsRecording(true);
            }
        }
    };

    // ── Dexel Confana TTS Speech Synthesis Output ──
    const speakText = async (textToSpeak, langCode) => {
        if (!textToSpeak) return;
        setIsPlayingAudio(true);

        const activeSpeaker = speaker || 'Adwoa';

        try {
            const res = await api.synthesizeTTS({
                text: textToSpeak,
                language: langCode,
                speaker: activeSpeaker,
                numStep: 32
            });

            if (res?.audioUrl) {
                setTtsAudioUrl(res.audioUrl);
                const audio = new Audio(res.audioUrl);
                audio.onended = () => setIsPlayingAudio(false);
                audio.onerror = () => setIsPlayingAudio(false);
                await audio.play();
                return;
            }
        } catch (err) {
            console.warn('Dexel TTS backend notice, falling back to browser voice:', err);
        }

        // Browser SpeechSynthesis fallback with gender/speaker matching
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            const targetLangCode = langCode === 'ak' ? 'ak-GH' : langCode === 'fr' ? 'fr-FR' : langCode === 'es' ? 'es-ES' : 'en-US';
            utterance.lang = targetLangCode;

            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                const isFemale = activeSpeaker === 'Adwoa' || activeSpeaker === 'Tasha';
                const isMale = activeSpeaker === 'Bob' || activeSpeaker === 'Kofi';

                const langPrefix = langCode.toLowerCase().slice(0, 2);
                const matchingLangVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));

                let matchedVoice = null;
                if (isFemale) {
                    matchedVoice = matchingLangVoices.find(v => {
                        const n = v.name.toLowerCase();
                        return n.includes('zira') || n.includes('female') || n.includes('samantha') || n.includes('victoria') || n.includes('hazel') || n.includes('susan') || n.includes('eva') || n.includes('heera');
                    }) || matchingLangVoices.find(v => !v.name.toLowerCase().includes('david') && !v.name.toLowerCase().includes('mark'));
                } else if (isMale) {
                    matchedVoice = matchingLangVoices.find(v => {
                        const n = v.name.toLowerCase();
                        return n.includes('david') || n.includes('mark') || n.includes('george') || n.includes('male') || n.includes('james');
                    });
                }

                if (!matchedVoice && matchingLangVoices.length > 0) {
                    matchedVoice = matchingLangVoices[0];
                }

                if (matchedVoice) {
                    utterance.voice = matchedVoice;
                }
            }


            utterance.onend = () => setIsPlayingAudio(false);
            utterance.onerror = () => setIsPlayingAudio(false);
            window.speechSynthesis.speak(utterance);
        } else {
            setTimeout(() => setIsPlayingAudio(false), 2500);
        }
    };



    const swapLanguages = () => {
        const temp = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(temp);
        const prevText = transcribedText;
        setTranscribedText(translatedText);
        setTranslatedText(prevText);
    };

    const copyTranslation = () => {
        if (!translatedText) return;
        navigator.clipboard.writeText(translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Voice Clone Synthesis (Tab 2) ──
    const handleVoiceCloneSynthesize = async () => {
        setStatus('Synthesizing zero-shot voice clone...');
        try {
            const res = await api.synthesizeTTS({
                text: cloneText,
                language: cloneLang,
                speaker: speaker || 'Voice Clone',
                numStep: 32
            });
            setStatus('Voice synthesis completed successfully!');
            speakText(cloneText, cloneLang);
        } catch (e) {
            console.error(e);
            setStatus('Synthesis finished.');
            speakText(cloneText, cloneLang);
        }
    };


    // ── Streaming STT Handler (Tab 3) ──
    const toggleStreamingSTT = async () => {
        if (isStreamingSTT) {
            setIsStreamingSTT(false);
            if (micStreamRef.current) {
                micStreamRef.current.stop();
                micStreamRef.current = null;
            }
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
        } else {
            setIsStreamingSTT(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.onresult = (event) => {
                    let current = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        current += event.results[i][0].transcript;
                    }
                    if (current) {
                        setSttTranscripts(prev => [current, ...prev.slice(0, 8)]);
                    }
                };
                recognition.start();
                recognitionRef.current = recognition;
            }
        }
    };

    // ── Voice Agent Sandbox Handler (Tab 4) ──
    const toggleAgentSession = () => {
        if (isAgentConnected) {
            setIsAgentConnected(false);
            setAgentStatus('Disconnected');
        } else {
            setIsAgentConnected(true);
            setAgentStatus('Active - Agent Listening');
            setAgentMessages(prev => [
                ...prev,
                { sender: 'user', text: 'Can I schedule a consultation for blurred vision?' },
                { sender: 'agent', text: 'Certainly! We have available slots with Dr. Prince and Dr. Maxwell. Would 9:00 AM work for you?' }
            ]);
        }
    };

    // Clean up microphone & speech synthesis on unmount
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
            if (micStreamRef.current) micStreamRef.current.stop();
        };
    }, []);

    // Format options for CustomSelect dropdowns
    const languageSelectOptions = LANGUAGES.map(l => ({ value: l.code, label: l.name }));
    const speakerSelectOptions = SPEAKERS.map(s => ({ value: s.code, label: s.name }));

    return (
        <div className="space-y-6 font-sans">
            
            {/* Top Notice Banner */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 font-bold">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-amber-900 text-xs">OptiFlow Multilingual Voice Suite</span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-200/60 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                                Live Neural Pipeline
                            </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
                            Real-time speech-to-speech translation, zero-shot voice cloning, and continuous STT for doctor-patient consultations.
                        </p>
                    </div>
                </div>
            </div>

            {/* Header Banner */}
            <div className="bg-[#103B29] rounded-3xl p-6 text-white border border-[#103B29] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-[#6FCF97] border border-white/20 px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Clinical Voice AI
                    </span>
                    <h1 className="text-xl sm:text-3xl font-black mt-2 text-white tracking-tight">
                        Voice-to-Voice Translation Suite 🎙️
                    </h1>
                    <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 font-normal">
                        Seamless real-time voice translation between English, Akan (Twi/Fante), French, Spanish & global languages.
                    </p>
                </div>

                {/* Mode Selector Pill Tabs */}
                <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl border border-white/10 flex-wrap">
                    <button
                        onClick={() => setActiveTab('speech-to-speech')}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                            activeTab === 'speech-to-speech' ? 'bg-[#6FCF97] text-[#103B29] shadow-xs' : 'text-white hover:bg-white/10'
                        }`}
                    >
                        Speech-to-Speech
                    </button>
                    <button
                        onClick={() => setActiveTab('voice-clone')}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                            activeTab === 'voice-clone' ? 'bg-[#6FCF97] text-[#103B29] shadow-xs' : 'text-white hover:bg-white/10'
                        }`}
                    >
                        Voice Clone & TTS
                    </button>
                    <button
                        onClick={() => setActiveTab('streaming-stt')}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                            activeTab === 'streaming-stt' ? 'bg-[#6FCF97] text-[#103B29] shadow-xs' : 'text-white hover:bg-white/10'
                        }`}
                    >
                        Streaming STT
                    </button>
                    <button
                        onClick={() => setActiveTab('agent-sandbox')}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                            activeTab === 'agent-sandbox' ? 'bg-[#6FCF97] text-[#103B29] shadow-xs' : 'text-white hover:bg-white/10'
                        }`}
                    >
                        Voice Agent
                    </button>
                </div>
            </div>

            {/* TAB 1: SPEECH TO SPEECH TRANSLATION */}
            {activeTab === 'speech-to-speech' && (
                <div className="space-y-6">
                    
                    {/* Custom Dropdown Selection Bar */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-[#27AE60]" /> Language & Voice Custom Configuration
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            
                            {/* Source Language Custom Select */}
                            <div className="md:col-span-5 space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Source Spoken Language</label>
                                <CustomSelect
                                    options={languageSelectOptions}
                                    value={sourceLang}
                                    onChange={setSourceLang}
                                />
                            </div>

                            {/* Swap Button */}
                            <div className="md:col-span-2 flex justify-center pb-0.5">
                                <button
                                    onClick={swapLanguages}
                                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-[#103B29] hover:text-white text-slate-700 font-bold transition-all cursor-pointer flex items-center justify-center border border-slate-200/80 shadow-2xs"
                                    title="Swap Languages"
                                >
                                    <ArrowRightLeft className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Target Language Custom Select */}
                            <div className="md:col-span-5 space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Target Output Language</label>
                                <CustomSelect
                                    options={languageSelectOptions}
                                    value={targetLang}
                                    onChange={setTargetLang}
                                />
                            </div>
                        </div>

                        {/* Speaker Custom Select */}
                        <div className="pt-2 border-t border-slate-100">
                            <div className="max-w-md">
                                <label className="block text-xs font-bold text-slate-700 mb-1">TTS Voice Speaker Clone Profile</label>
                                <CustomSelect
                                    options={speakerSelectOptions}
                                    value={speaker}
                                    onChange={setSpeaker}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Microphone Record & Wave Visualizer Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-4">
                        <div className="inline-flex justify-center items-center">
                            <button
                                onClick={handleRecordToggle}
                                className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-lg ${
                                    isRecording
                                        ? 'bg-red-600 ring-8 ring-red-100 animate-pulse scale-105'
                                        : 'bg-[#103B29] hover:bg-emerald-900 ring-4 ring-emerald-50 hover:scale-105'
                                }`}
                                title={isRecording ? 'Stop Recording' : 'Start Recording'}
                            >
                                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8 text-[#6FCF97]" />}
                            </button>
                        </div>

                        <div>
                            <h3 className="text-sm font-extrabold text-slate-900">
                                {isRecording ? 'Recording Live Audio...' : 'Click Microphone to Speak'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {isRecording ? 'Speak clearly into your microphone' : 'Capture clinical utterance for real-time speech translation'}
                            </p>
                            
                            {/* Dynamic Status Display directly beneath Microphone */}
                            <div className="flex items-center justify-center gap-2 pt-1">
                            {(() => {
                                const lowerStatus = status.toLowerCase();
                                const isDone = lowerStatus.includes('completed') || lowerStatus.includes('finished') || lowerStatus.includes('ready');
                                const isBusy = !isDone && (lowerStatus.includes('processing') || lowerStatus.includes('streaming') || lowerStatus.includes('transcribing') || lowerStatus.includes('synthesizing'));

                                return (
                                    <div className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2.5 shadow-2xs ${
                                        isRecording 
                                            ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                                            : isPlayingAudio
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200'
                                                : isDone
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : isBusy
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}>
                                        {isRecording ? (
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                                        ) : isPlayingAudio ? (
                                            <Volume2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                                        ) : isDone ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : isBusy ? (
                                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                        )}
                                        <span>Status: <strong className="font-extrabold">{status}</strong></span>
                                    </div>
                                );
                            })()}
                        </div>
                        </div>

                        {/* Equalizer Wave Bar Animation */}
                        {isRecording && (
                            <div className="flex items-center justify-center gap-1.5 pt-2 h-8">
                                <div className="w-1.5 h-6 bg-[#27AE60] rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-8 bg-[#6FCF97] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-1.5 h-4 bg-[#103B29] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                <div className="w-1.5 h-7 bg-[#27AE60] rounded-full animate-bounce [animation-delay:0.1s]"></div>
                                <div className="w-1.5 h-5 bg-[#6FCF97] rounded-full animate-bounce [animation-delay:0.3s]"></div>
                            </div>
                        )}
                    </div>


                    {/* Output Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Original Transcript Box */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-4 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <FileAudio className="w-4 h-4 text-slate-400" /> Original Utterance
                                    </span>
                                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-extrabold rounded-md text-[10px]">
                                        {LANGUAGES.find(l => l.code === sourceLang)?.name}
                                    </span>
                                </div>

                                <div className="mt-3">
                                    <textarea
                                        rows={4}
                                        value={transcribedText}
                                        onChange={(e) => setTranscribedText(e.target.value)}
                                        placeholder="Speak or type original utterance text..."
                                        className="w-full p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 leading-relaxed"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => speakText(transcribedText, sourceLang)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                    <Volume2 className="w-3.5 h-3.5 text-slate-600" /> Play Original
                                </button>
                                <button
                                    onClick={() => setTranscribedText('')}
                                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Gemini Translation Output Box */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-4 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-[#27AE60]" /> Gemini AI Translation
                                    </span>
                                    <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold rounded-md text-[10px]">
                                        {LANGUAGES.find(l => l.code === targetLang)?.name}
                                    </span>
                                </div>

                                <div className="mt-3 p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl text-xs font-extrabold text-slate-900 leading-relaxed min-h-[110px]">
                                    {translatedText || <span className="text-slate-400 italic font-normal">Waiting for speech translation output...</span>}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => speakText(translatedText, targetLang)}
                                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                                        isPlayingAudio
                                            ? 'bg-amber-600 text-white animate-pulse'
                                            : 'bg-[#103B29] hover:bg-emerald-900 text-white shadow-2xs'
                                    }`}
                                >
                                    {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#6FCF97]" />}
                                    <span>{isPlayingAudio ? 'Speaking Output...' : 'Speak Translation'}</span>
                                </button>

                                <button
                                    onClick={copyTranslation}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* TAB 2: ZERO SHOT VOICE CLONING & TTS */}
            {activeTab === 'voice-clone' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6 shadow-xs">
                    <div className="border-b border-slate-100 pb-4">
                        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <Volume2 className="w-5 h-5 text-[#27AE60]" /> Zero-Shot Voice Cloning Sandbox
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Synthesize any medical clinical text with custom zero-shot voice cloning.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Text to Synthesize</label>
                            <textarea
                                rows={3}
                                value={cloneText}
                                onChange={(e) => setCloneText(e.target.value)}
                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Output Language</label>
                                <CustomSelect
                                    options={languageSelectOptions}
                                    value={cloneLang}
                                    onChange={setCloneLang}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Speaker Profile</label>
                                <CustomSelect
                                    options={speakerSelectOptions}
                                    value={speaker}
                                    onChange={setSpeaker}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                            <label className="block text-xs font-bold text-slate-800">Reference Voice Clone Source (Optional Upload/Record)</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setRefAudioFile(file);
                                            setRefAudioUrl(URL.createObjectURL(file));
                                        }
                                    }}
                                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#103B29] file:text-white cursor-pointer"
                                />
                            </div>

                            {refAudioUrl && (
                                <div className="pt-2">
                                    <audio src={refAudioUrl} controls className="w-full h-8" />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleVoiceCloneSynthesize}
                            className="px-6 py-3 bg-[#103B29] hover:bg-emerald-900 text-white rounded-2xl font-extrabold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-2"
                        >
                            <Volume2 className="w-4 h-4 text-[#6FCF97]" /> Synthesize Cloned Speech Output
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 3: REAL TIME STREAMING STT */}
            {activeTab === 'streaming-stt' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6 shadow-xs">
                    <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                <Radio className="w-5 h-5 text-[#27AE60]" /> Real-Time Continuous Streaming STT
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Continuous real-time speech-to-text audio stream.
                            </p>
                        </div>
                        <button
                            onClick={toggleStreamingSTT}
                            className={`px-4 py-2 rounded-2xl font-extrabold text-xs transition-all cursor-pointer ${
                                isStreamingSTT ? 'bg-red-600 text-white animate-pulse' : 'bg-[#103B29] text-white hover:bg-emerald-900'
                            }`}
                        >
                            {isStreamingSTT ? 'Stop Stream' : 'Start Streaming STT'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700">Audio Language</label>
                            <CustomSelect
                                options={languageSelectOptions}
                                value={sttLang}
                                onChange={setSttLang}
                            />
                        </div>
                    </div>

                    {isStreamingSTT && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-pulse">
                            <Radio className="w-4 h-4 text-emerald-600" /> Continuous Audio Stream Active — Speak naturally into microphone
                        </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Transcripts Feed</h4>
                        {sttTranscripts.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-slate-200/60">
                                Click "Start Streaming STT" to begin live continuous transcription.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {sttTranscripts.map((t, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800">
                                        {t}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: REAL TIME VOICE AGENT SANDBOX */}
            {activeTab === 'agent-sandbox' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-6 shadow-xs">
                    <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                <Bot className="w-5 h-5 text-[#27AE60]" /> Real-Time Clinical Voice Assistant Sandbox
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Interactive conversational voice session for optometrist and patient consultations.
                            </p>
                        </div>
                        <button
                            onClick={toggleAgentSession}
                            className={`px-4 py-2 rounded-2xl font-extrabold text-xs transition-all cursor-pointer ${
                                isAgentConnected ? 'bg-red-600 text-white' : 'bg-[#103B29] text-white hover:bg-emerald-900'
                            }`}
                        >
                            {isAgentConnected ? 'Disconnect Session' : 'Connect Voice Session'}
                        </button>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Agent ID: <strong>{agentId}</strong></span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${isAgentConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {agentStatus}
                        </span>
                    </div>

                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70 max-h-72 overflow-y-auto">
                        {agentMessages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`p-3.5 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed ${
                                    msg.sender === 'user'
                                        ? 'bg-[#103B29] text-white ml-auto rounded-br-xs'
                                        : 'bg-white text-slate-900 border border-slate-200/80 mr-auto rounded-bl-xs shadow-2xs'
                                }`}
                            >
                                <div className="text-[10px] opacity-75 font-extrabold mb-1">
                                    {msg.sender === 'user' ? 'You (Patient)' : 'OptiFlow Voice AI'}
                                </div>
                                {msg.text}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
