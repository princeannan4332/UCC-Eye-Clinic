// ── Inline WAV Recorder Utility ──
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export async function startWavRecording(stream) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    
    const leftChannel = [];
    let recordingLength = 0;
    
    processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        leftChannel.push(new Float32Array(input));
        recordingLength += input.length;
    };
    
    source.connect(processor);
    processor.connect(audioCtx.destination);
    
    return {
        stop: () => {
            source.disconnect();
            processor.disconnect();
            audioCtx.close();
            
            const result = new Float32Array(recordingLength);
            let offset = 0;
            for (let i = 0; i < leftChannel.length; i++) {
                result.set(leftChannel[i], offset);
                offset += leftChannel[i].length;
            }
            
            const buffer = new ArrayBuffer(44 + result.length * 2);
            const view = new DataView(buffer);
            
            writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + result.length * 2, true);
            writeString(view, 8, 'WAVE');
            writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true); // PCM
            view.setUint16(22, 1, true); // Mono
            view.setUint32(24, 16000, true); // 16kHz
            view.setUint32(28, 16000 * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeString(view, 36, 'data');
            view.setUint32(40, result.length * 2, true);
            
            let index = 44;
            for (let i = 0; i < result.length; i++) {
                let s = Math.max(-1, Math.min(1, result[i]));
                view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                index += 2;
            }
            
            return new Blob([view], { type: 'audio/wav' });
        }
    };
}

// ── Raw 16kHz PCM Live Streamer Utility ──
export async function startMicStream(onAudioChunk) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioCtx.createMediaStreamSource(stream);
    const processor = audioCtx.createScriptProcessor(2048, 1, 1);
    
    processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const buffer = new ArrayBuffer(input.length * 2);
        const view = new DataView(buffer);
        let index = 0;
        for (let i = 0; i < input.length; i++) {
            let s = Math.max(-1, Math.min(1, input[i]));
            view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            index += 2;
        }
        onAudioChunk(buffer);
    };
    
    source.connect(processor);
    processor.connect(audioCtx.destination);
    
    return {
        stop: () => {
            source.disconnect();
            processor.disconnect();
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            audioCtx.close();
        }
    };
}

// ── Browser Audio Queue Player Utility ──
export class BrowserAudioPlayer {
    constructor(sampleRate = 24000) {
        this.sampleRate = sampleRate;
        this.audioCtx = null;
        this.nextPlayTime = 0;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this.sampleRate });
            this.nextPlayTime = this.audioCtx.currentTime;
        }
    }

    playChunk(base64Data) {
        this.init();
        const binary = atob(base64Data);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        const numSamples = len / 2;
        const samples = new Float32Array(numSamples);
        const view = new DataView(bytes.buffer);
        for (let i = 0; i < numSamples; i++) {
            const val = view.getInt16(i * 2, true);
            samples[i] = val / 32768;
        }
        
        const audioBuffer = this.audioCtx.createBuffer(1, numSamples, this.sampleRate);
        audioBuffer.getChannelData(0).set(samples);
        
        const source = this.audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioCtx.destination);
        
        const now = this.audioCtx.currentTime;
        if (this.nextPlayTime < now) {
            this.nextPlayTime = now;
        }
        source.start(this.nextPlayTime);
        this.nextPlayTime += audioBuffer.duration;
    }

    stop() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
        this.nextPlayTime = 0;
    }
}

// ── Shared Language Constants ──
export const LANGUAGES = [
    { code: 'en', name: 'English 🇬🇧' },
    { code: 'ak', name: 'Akan (Twi/Fante) 🇬🇭' },
    { code: 'es', name: 'Spanish 🇪🇸' },
    { code: 'fr', name: 'French 🇫🇷' },
    { code: 'de', name: 'German 🇩🇪' },
    { code: 'it', name: 'Italian 🇮🇹' },
    { code: 'zh', name: 'Chinese 🇨🇳' },
    { code: 'ja', name: 'Japanese 🇯🇵' }
];

export const SPEAKERS = [
    { code: '', name: 'Default Natural Voice' },
    { code: 'Bob', name: 'Dr. Bob (English Male)' },
    { code: 'Tasha', name: 'Dr. Tasha (English Female)' },
    { code: 'Kofi', name: 'Kofi (Akan Male)' },
    { code: 'Adwoa', name: 'Adwoa (Akan Female)' }
];
