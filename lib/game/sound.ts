/**
 * SoundManager - Procedural Web Audio API sound generator for Enigma.
 * 
 * Provides sound effects and background ambient music without static assets.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;

  // Settings
  private masterVolume = 0.5;
  private sfxVolume = 0.8;
  private musicVolume = 0.15; // default to a softer, cozy background level
  private isMutedMusic = false;
  private isMutedSfx = false;

  // State
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private currentNotes: { osc: OscillatorNode; gain: GainNode }[] = [];
  private initialized = false;

  constructor() {
    // Check if window is defined (SSR safety)
    if (typeof window !== "undefined") {
      // Lazy load settings from localStorage if present
      try {
        const mv = localStorage.getItem("enigma_vol_master");
        const sv = localStorage.getItem("enigma_vol_sfx");
        const mv2 = localStorage.getItem("enigma_vol_music");
        const mm = localStorage.getItem("enigma_mute_music");
        const ms = localStorage.getItem("enigma_mute_sfx");

        if (mv !== null) this.masterVolume = parseFloat(mv);
        if (sv !== null) this.sfxVolume = parseFloat(sv);
        if (mv2 !== null) this.musicVolume = parseFloat(mv2);
        if (mm !== null) this.isMutedMusic = mm === "true";
        if (ms !== null) this.isMutedSfx = ms === "true";
      } catch (e) {
        console.warn("Could not load volume settings from localStorage", e);
      }
    }
  }

  /**
   * Initializes the AudioContext and setup routing graph.
   * Modern browsers require this to be called following a user gesture.
   */
  public init() {
    if (this.initialized || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        console.error("Web Audio API is not supported in this browser.");
        return;
      }

      this.ctx = new AudioCtx();
      
      // Node Routing:
      // SFX -> sfxGain ---\
      //                    +---> masterGain ---> Destination
      // Music -> musicGain/
      
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(this.isMutedSfx && this.isMutedMusic ? 0 : this.masterVolume, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.isMutedSfx ? 0 : this.sfxVolume, this.ctx.currentTime);
      this.musicGain.gain.setValueAtTime(this.isMutedMusic ? 0 : this.musicVolume, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Create a global feedback delay line for spatial ambience (used by music and chimes)
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayFeedback = this.ctx.createGain();
      
      this.delayNode.delayTime.setValueAtTime(0.4, this.ctx.currentTime); // 400ms delay
      this.delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime);   // 40% feedback

      // Routing for delay: sfx/music -> delay -> feedback -> delay -> master
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);

      this.initialized = true;
      console.log("[Audio Engine] Synthesizer initialized successfully.");

      // Start music if playing state allows
      if (this.musicInterval === null && !this.isMutedMusic) {
        this.startMusic();
      }
    } catch (error) {
      console.error("[Audio Engine] Initialization failed:", error);
    }
  }

  private ensureCtx() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // ============================================================
  // SOUND EFFECTS
  // ============================================================

  /** Synthesizes dice rolling sounds using high-pass filtered white noise with rapid modulation. */
  public playDiceRoll() {
    this.ensureCtx();
    if (!this.ctx || this.isMutedSfx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const duration = 0.7; // seconds

    // 1. Create a buffer of white noise
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // 2. Setup highpass filter to give the rolling sound a lighter "rattle" quality
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(3.0, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + duration);

    // 3. Amplitude envelope to simulate bouncing dice (pulsating volume)
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.01, now);
    envelope.gain.linearRampToValueAtTime(0.25, now + 0.05);

    // Add bounce modulations (simulate rolling clicks)
    const bounceTimes = [0.12, 0.25, 0.38, 0.5, 0.6, 0.68];
    bounceTimes.forEach((t) => {
      envelope.gain.setValueAtTime(0.08, now + t - 0.02);
      envelope.gain.setValueAtTime(0.2, now + t);
      envelope.gain.exponentialRampToValueAtTime(0.05, now + t + 0.05);
    });

    envelope.gain.setValueAtTime(0.05, now + duration - 0.05);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Route: Noise -> Filter -> Envelope -> SFX output
    noiseSource.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.sfxGain!);

    noiseSource.start(now);
    noiseSource.stop(now + duration);

    // Play a final solid click at the end of the roll
    this.playClick(now + duration - 0.02, 300, 0.04);
    this.playClick(now + duration, 220, 0.03);
  }

  /** Auxiliary click generator for dice stop and pawn movement */
  private playClick(time: number, freq = 300, duration = 0.05) {
    if (!this.ctx || this.isMutedSfx) return;
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq / 3, time + duration);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain!);

    osc.start(time);
    osc.stop(time + duration);
  }

  /** Short click-plop trigger on each animated step along the board grid path */
  public playMoveTick() {
    this.ensureCtx();
    if (!this.ctx || this.isMutedSfx) return;
    const now = this.ctx.currentTime;
    
    // Play a dual tap sound
    this.playClick(now, 650, 0.04);
    this.playClick(now + 0.025, 450, 0.03);
  }

  /** Plays a double-tone bell chime when entering a room */
  public playRoomEntry() {
    this.ensureCtx();
    if (!this.ctx || this.isMutedSfx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25]; // C5 and E5 (Major third chime)
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      
      // Route a bit of chime into the global delay to give it echo space
      if (this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.95);
    });
  }

  /** Plays a mysterious, suspenseful minor arpeggio when a suggestion is made */
  public playSuggestion() {
    this.ensureCtx();
    if (!this.ctx || this.isMutedSfx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // A minor triad arpeggio: A4 (440Hz), C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
    const arpeggio = [440.00, 523.25, 659.25, 783.99];

    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Triangle wave provides a warm flute-like mystery quality
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      if (this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.8);
    });
  }

  /** Victorious rising chime fanfare for solving the game */
  public playWin() {
    this.ensureCtx();
    if (!this.ctx || this.isMutedSfx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // C major pentatonic ascendant scale: C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      if (this.delayNode) {
        gain.connect(this.delayNode);
      }

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 1.3);
    });
  }

  /** Low buzzer/synth swell for incorrect accusation or elimination */
  public playLoss() {
    this.ensureCtx();
    if (!this.ctx || this.isMutedSfx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Play a harsh, descending minor second chord (dissonance)
    const baseFreqs = [120.0, 127.0]; // dissonant lower register

    baseFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.7, now + 1.5); // slide downwards

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 1.5);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + 1.6);
    });
  }

  // ============================================================
  // BACKGROUND MUSIC
  // ============================================================

  /** Start procedural ambient background music */
  public startMusic() {
    this.ensureCtx();
    if (!this.ctx || this.isMutedMusic) return;

    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
    }

    console.log("[Audio Engine] Starting background procedural soundtrack...");

    // Warm, mysterious ambient chord pads (A minor 9, F major 7, G major, E minor 7)
    // Placed in a very low, soothing frequency range
    const chords = [
      [55.00, 110.00, 164.81, 196.00, 261.63], // Am9 (C-E-G-B-E mood)
      [43.65, 87.31, 130.81, 174.61, 261.63],  // Fmaj7
      [49.00, 98.00, 146.83, 196.00, 293.66],  // G
      [41.20, 82.41, 146.83, 164.81, 246.94],  // Em7
    ];

    let chordIndex = 0;

    const triggerAmbientChord = () => {
      if (!this.ctx || this.isMutedMusic) return;

      const now = this.ctx.currentTime;
      const currentChord = chords[chordIndex];
      chordIndex = (chordIndex + 1) % chords.length;

      // Slow, deep swells
      const attack = 3.5;
      const sustain = 2.0;
      const release = 4.5;
      const duration = attack + sustain + release;

      currentChord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Sine wave offers the purest, softest tone without harsh harmonics
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        // Keep it warm and cut off any higher residual frequency noise
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(180, now);
        filter.frequency.linearRampToValueAtTime(320, now + attack);

        // Smooth breathing volume envelope to prevent clicks or popping
        const maxVol = 0.015 / currentChord.length;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(maxVol, now + attack);
        gain.gain.setValueAtTime(maxVol, now + attack + sustain);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        if (this.delayNode) {
          gain.connect(this.delayNode);
        }

        osc.start(now);
        osc.stop(now + duration);

        const nodeRecord = { osc, gain };
        this.currentNotes.push(nodeRecord);
        setTimeout(() => {
          this.currentNotes = this.currentNotes.filter((n) => n !== nodeRecord);
        }, duration * 1000 + 200);
      });
    };

    // Trigger first chord, then loop slow changes every 8 seconds
    triggerAmbientChord();
    this.musicInterval = setInterval(triggerAmbientChord, 8000);
  }

  /** Stop the music loops and cut active notes */
  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }

    // Fade out active notes immediately to avoid abrupt popping clicks
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.currentNotes.forEach(({ gain, osc }) => {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          setTimeout(() => {
            try { osc.stop(); } catch {}
          }, 400);
        } catch {}
      });
      this.currentNotes = [];
    }
    console.log("[Audio Engine] Background soundtrack stopped.");
  }

  // ============================================================
  // VOLUME SETTINGS & GETTERS
  // ============================================================

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("enigma_vol_master", String(this.masterVolume));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMutedMusic && this.isMutedSfx ? 0 : this.masterVolume, 
        this.ctx.currentTime
      );
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("enigma_vol_sfx", String(this.sfxVolume));
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(
        this.isMutedSfx ? 0 : this.sfxVolume, 
        this.ctx.currentTime
      );
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem("enigma_vol_music", String(this.musicVolume));
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(
        this.isMutedMusic ? 0 : this.musicVolume, 
        this.ctx.currentTime
      );
    }
  }

  public toggleMuteMusic(): boolean {
    this.isMutedMusic = !this.isMutedMusic;
    if (typeof window !== "undefined") {
      localStorage.setItem("enigma_mute_music", String(this.isMutedMusic));
    }

    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(
        this.isMutedMusic ? 0 : this.musicVolume, 
        this.ctx.currentTime
      );
    }

    if (this.isMutedMusic) {
      this.stopMusic();
    } else {
      this.startMusic();
    }

    this.updateMasterMuteState();
    return this.isMutedMusic;
  }

  public toggleMuteSfx(): boolean {
    this.isMutedSfx = !this.isMutedSfx;
    if (typeof window !== "undefined") {
      localStorage.setItem("enigma_mute_sfx", String(this.isMutedSfx));
    }

    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(
        this.isMutedSfx ? 0 : this.sfxVolume, 
        this.ctx.currentTime
      );
    }

    this.updateMasterMuteState();
    return this.isMutedSfx;
  }

  private updateMasterMuteState() {
    if (this.masterGain && this.ctx) {
      const fullyMuted = this.isMutedMusic && this.isMutedSfx;
      this.masterGain.gain.setValueAtTime(
        fullyMuted ? 0 : this.masterVolume,
        this.ctx.currentTime
      );
    }
  }

  // Getters
  public getMasterVolume() { return this.masterVolume; }
  public getSfxVolume() { return this.sfxVolume; }
  public getMusicVolume() { return this.musicVolume; }
  public getIsMutedMusic() { return this.isMutedMusic; }
  public getIsMutedSfx() { return this.isMutedSfx; }
}

// Export singleton instance
export const soundManager = new SoundManager();
