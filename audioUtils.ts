
import { GoogleGenAI, Modality } from "@google/genai";

export type CharacterRole = 'boatman' | 'broker' | 'passenger_male' | 'passenger_female' | 'vip' | 'system';

class AudioManager {
  private ctx: AudioContext | null = null;
  private ai: any = null;
  private isProcessingVoice = false;
  private bgmOsc: OscillatorNode | null = null;
  private bgmLfo: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;

  constructor() {
    // Initialization is deferred to init() or speak() to avoid crashing on module load.
  }

  private getAi() {
    if (!this.ai) {
      const apiKey = process.env.API_KEY;
      if (apiKey) {
        try {
          this.ai = new GoogleGenAI({ apiKey });
        } catch (e) {
          console.error("Failed to initialize GoogleGenAI:", e);
        }
      } else {
        console.warn("API_KEY is missing. Speech features will be disabled.");
      }
    }
    return this.ai;
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.setupBGM();
      } catch (e) {
        console.error("AudioContext initialization failed:", e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupBGM() {
    if (!this.ctx) return;
    
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
    
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    
    this.bgmGain.connect(this.filter);
    this.filter.connect(this.ctx.destination);

    this.bgmOsc = this.ctx.createOscillator();
    this.bgmOsc.type = 'triangle';
    this.bgmOsc.frequency.setValueAtTime(40, this.ctx.currentTime);
    
    this.bgmLfo = this.ctx.createOscillator();
    this.bgmLfo.type = 'sine';
    this.bgmLfo.frequency.setValueAtTime(0.5, this.ctx.currentTime);
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(15, this.ctx.currentTime);
    
    this.bgmLfo.connect(lfoGain);
    lfoGain.connect(this.bgmOsc.frequency);
    
    this.bgmOsc.connect(this.bgmGain);
    
    this.bgmOsc.start();
    this.bgmLfo.start();
  }

  updateBGM(fear: number, frustration: number) {
    if (!this.ctx || !this.bgmGain || !this.bgmOsc || !this.bgmLfo || !this.filter) return;
    
    const targetVolume = 0.08 + (frustration / 800);
    this.bgmGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.5);
    
    const filterFreq = 400 + (frustration * 5);
    this.filter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.5);
    
    const pulseFreq = 0.5 + (fear / 15);
    this.bgmLfo.frequency.setTargetAtTime(pulseFreq, this.ctx.currentTime, 0.5);
    
    const baseFreq = 40 - (fear / 8);
    this.bgmOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.5);
  }

  stopBGM() {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(0, this.ctx.currentTime, 1.5);
    }
  }

  startBGM() {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(0.08, this.ctx.currentTime, 1.5);
    }
  }

  playStep(isMud: boolean = false) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = isMud ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isMud ? 60 : 100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playStruggle() {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.2);
  }

  playHelpingHand() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.1);
    
    osc2.frequency.setValueAtTime(330, this.ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(660, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + 0.3);
    osc2.stop(this.ctx.currentTime + 0.3);
  }

  playClick() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playAlarm() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(330, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  async speak(text: string, role: CharacterRole = 'passenger_male') {
    const ai = this.getAi();
    if (!ai || this.isProcessingVoice || !this.ctx) return;
    
    this.isProcessingVoice = true;

    let voiceName: string = 'Puck';
    let promptContext: string = 'a passenger';

    switch (role) {
      case 'boatman':
        voiceName = 'Charon';
        promptContext = 'a rough, LOUD, gritty Bangladeshi boatman/porter shouting in the mud or rain';
        break;
      case 'broker':
        voiceName = 'Charon';
        promptContext = 'a shady, greedy, LOUD broker shouting to cut the line';
        break;
      case 'passenger_male':
        voiceName = 'Puck';
        promptContext = 'a PANICKED, LOUD, exhausted male passenger screaming for help';
        break;
      case 'passenger_female':
        voiceName = 'Kore';
        promptContext = 'a TERRIFIED, LOUD, crying female passenger in a life-threatening storm';
        break;
      case 'vip':
        voiceName = 'Fenrir';
        promptContext = 'an arrogant, LOUD, commanding person demanding a seat';
        break;
      case 'system':
        voiceName = 'Zephyr';
        promptContext = 'a clear, celebratory, and authoritative game narrator';
        break;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Act as ${promptContext} in an extremely stressful ferry journey. Speak this Bengali text LOUDLY with extreme emotion and total realism: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio && this.ctx) {
        const audioData = this.decodeBase64(base64Audio);
        const audioBuffer = await this.decodeAudioData(audioData, this.ctx, 24000, 1);
        const source = this.ctx.createBufferSource();
        source.buffer = audioBuffer;
        
        const voiceGain = this.ctx.createGain();
        voiceGain.gain.setValueAtTime(1.5, this.ctx.currentTime);
        
        source.connect(voiceGain);
        voiceGain.connect(this.ctx.destination);
        
        source.onended = () => { this.isProcessingVoice = false; };
        source.start();
      } else {
        this.isProcessingVoice = false;
      }
    } catch (e) {
      console.error("TTS Error:", e);
      this.isProcessingVoice = false;
    }
  }

  private decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const audio = new AudioManager();
