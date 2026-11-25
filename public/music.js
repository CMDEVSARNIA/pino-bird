// Pino's gramophone: a tiny synthesizer that performs public-domain compositions
// and original tunes written for Pino. No recordings, nothing to license.
// Notation: "NOTE:beats" (e.g. "C4:1", "F#5:0.5", "R:1" for a rest). Chords: "Am:4".

export const SONG_NOTES = {
  twinkle: { bpm: 100, wave: "triangle",
    melody: "C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 G4:1 G4:1 F4:1 F4:1 E4:1 E4:1 D4:2 C4:1 C4:1 G4:1 G4:1 A4:1 A4:1 G4:2 F4:1 F4:1 E4:1 E4:1 D4:1 D4:1 C4:2",
    chords: "C:2 C:2 F:2 C:2 F:2 C:2 G:2 C:2 C:2 F:2 C:2 G:2 C:2 F:2 C:2 G:2 C:2 C:2 F:2 C:2 F:2 C:2 G:2 C:2" },
  ode: { bpm: 116, wave: "triangle",
    melody: "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 E4:1.5 D4:0.5 D4:2 " +
            "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:0.5 C4:2 " +
            "D4:1 D4:1 E4:1 C4:1 D4:1 E4:0.5 F4:0.5 E4:1 C4:1 D4:1 E4:0.5 F4:0.5 E4:1 D4:1 C4:1 D4:1 G3:2 " +
            "E4:1 E4:1 F4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C4:1 C4:1 D4:1 E4:1 D4:1.5 C4:0.5 C4:2",
    chords: "C:4 G:4 C:4 G:4 C:4 G:4 C:4 G:2 C:2 G:4 C:4 G:4 C:2 G:2 C:4 G:4 C:4 G:2 C:2" },
  elise: { bpm: 150, wave: "sine",
    melody: "E5:1 D#5:1 E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 A4:2 R:1 C4:1 E4:1 A4:1 B4:2 R:1 E4:1 G#4:1 B4:1 C5:2 R:1 E4:1 " +
            "E5:1 D#5:1 E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 A4:2 R:1 C4:1 E4:1 A4:1 B4:2 R:1 E4:1 C5:1 B4:1 A4:3 R:3",
    chords: "R:8 Am:3 Am:3 E:3 Am:3 R:8 Am:3 Am:3 E:3 Am:3 R:2" },
  canon: { bpm: 72, wave: "sine",
    melody: "F#5:2 E5:2 D5:2 C#5:2 B4:2 A4:2 B4:2 C#5:2 " +
            "D5:2 C#5:2 B4:2 A4:2 G4:2 F#4:2 G4:2 E4:2 " +
            "D4:0.5 F#4:0.5 A4:0.5 F#4:0.5 C#4:0.5 E4:0.5 A4:0.5 E4:0.5 B3:0.5 D4:0.5 F#4:0.5 D4:0.5 A3:0.5 C#4:0.5 F#4:0.5 C#4:0.5 " +
            "G3:0.5 B3:0.5 D4:0.5 B3:0.5 D4:0.5 F#4:0.5 A4:0.5 F#4:0.5 G3:0.5 B3:0.5 D4:0.5 B3:0.5 A3:0.5 C#4:0.5 E4:0.5 C#4:0.5",
    chords: "D:2 A:2 Bm:2 F#m:2 G:2 D:2 G:2 A:2 D:2 A:2 Bm:2 F#m:2 G:2 D:2 G:2 A:2 D:2 A:2 Bm:2 F#m:2 G:2 D:2 G:2 A:2" },
  minuet: { bpm: 126, wave: "triangle",
    melody: "D5:1 G4:0.5 A4:0.5 B4:0.5 C5:0.5 D5:1 G4:1 G4:1 E5:1 C5:0.5 D5:0.5 E5:0.5 F#5:0.5 G5:1 G4:1 G4:1 " +
            "C5:1 D5:0.5 C5:0.5 B4:0.5 A4:0.5 B4:1 C5:0.5 B4:0.5 A4:0.5 G4:0.5 F#4:1 G4:0.5 A4:0.5 B4:0.5 G4:0.5 A4:3 " +
            "D5:1 G4:0.5 A4:0.5 B4:0.5 C5:0.5 D5:1 G4:1 G4:1 E5:1 C5:0.5 D5:0.5 E5:0.5 F#5:0.5 G5:1 G4:1 G4:1 " +
            "C5:1 D5:0.5 C5:0.5 B4:0.5 A4:0.5 B4:1 C5:0.5 B4:0.5 A4:0.5 G4:0.5 A4:1 B4:0.5 A4:0.5 G4:0.5 F#4:0.5 G4:3",
    chords: "G:3 G:3 C:3 G:3 C:3 G:3 D:3 D:3 G:3 G:3 C:3 G:3 C:3 G:3 D:3 G:3" },
  jacques: { bpm: 112, wave: "triangle",
    melody: "C4:1 D4:1 E4:1 C4:1 C4:1 D4:1 E4:1 C4:1 E4:1 F4:1 G4:2 E4:1 F4:1 G4:2 " +
            "G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4:1 C4:1 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4:1 C4:1 C4:1 G3:1 C4:2 C4:1 G3:1 C4:2",
    chords: "C:4 C:4 C:4 C:4 C:4 C:4 C:2 G:2 C:4" },
  rowboat: { bpm: 96, wave: "triangle",
    melody: "C4:1.5 C4:1.5 C4:1 D4:0.5 E4:1.5 E4:1 D4:0.5 E4:1 F4:0.5 G4:3 " +
            "C5:0.5 C5:0.5 C5:0.5 G4:0.5 G4:0.5 G4:0.5 E4:0.5 E4:0.5 E4:0.5 C4:0.5 C4:0.5 C4:0.5 G4:1 F4:0.5 E4:1 D4:0.5 C4:3",
    chords: "C:3 C:3 C:3 C:3 C:3 C:3 G:3 C:3" },
  waltz: { bpm: 132, wave: "triangle",
    melody: "F4:1 A4:1 C5:1 D5:2 C5:1 A4:1 G4:1 F4:1 G4:3 G4:1 A#4:1 D5:1 C5:2 A4:1 G4:1 F4:1 E4:1 F4:3 " +
            "A4:1 C5:1 F5:1 E5:2 D5:1 C5:1 A#4:1 A4:1 G4:3 A#4:1 A4:1 G4:1 F4:1 E4:1 D4:1 E4:1 G4:1 C5:1 F4:3",
    chords: "F:3 A#:3 F:3 C:3 Gm:3 F:3 C:3 F:3 F:3 C:3 F:3 C:3 A#:3 F:3 C:3 F:3" },
  shuffle: { bpm: 116, wave: "square",
    melody: "C4:0.5 E4:0.5 G4:1 A4:0.5 G4:0.5 E4:1 D4:0.5 E4:0.5 G4:1 E4:2 C4:0.5 E4:0.5 G4:1 A4:0.5 C5:0.5 A4:1 G4:3 R:1 " +
            "A4:0.5 C5:0.5 D5:1 C5:0.5 A4:0.5 G4:1 E4:0.5 G4:0.5 A4:1 G4:2 E4:0.5 D4:0.5 C4:1 D4:0.5 E4:0.5 G4:1 C4:3 R:1",
    chords: "C:4 Am:4 F:4 G:4 F:4 C:4 G:4 C:4" },
  // ---- records visitors can give him ----
  jingle: { bpm: 132, wave: "triangle",
    melody: "E4:1 E4:1 E4:2 E4:1 E4:1 E4:2 E4:1 G4:1 C4:1.5 D4:0.5 E4:4 F4:1 F4:1 F4:1.5 F4:0.5 F4:1 E4:1 E4:1 E4:0.5 E4:0.5 E4:1 D4:1 D4:1 E4:1 D4:2 G4:2 " +
            "E4:1 E4:1 E4:2 E4:1 E4:1 E4:2 E4:1 G4:1 C4:1.5 D4:0.5 E4:4 F4:1 F4:1 F4:1.5 F4:0.5 F4:1 E4:1 E4:1 E4:0.5 E4:0.5 G4:1 G4:1 F4:1 D4:1 C4:4",
    chords: "C:4 C:4 C:4 C:4 F:4 C:4 D:4 G:4 C:4 C:4 C:4 C:4 F:4 C:4 G:4 C:4" },
  birthday: { bpm: 104, wave: "triangle",
    melody: "G4:0.75 G4:0.25 A4:1 G4:1 C5:1 B4:2 G4:0.75 G4:0.25 A4:1 G4:1 D5:1 C5:2 G4:0.75 G4:0.25 G5:1 E5:1 C5:1 B4:1 A4:2 F5:0.75 F5:0.25 E5:1 C5:1 D5:1 C5:3",
    chords: "R:1 C:3 G:3 G:3 C:3 C:3 F:3 C:2 G:1 C:3" },
  lullaby: { bpm: 84, wave: "sine",
    melody: "E4:0.5 E4:0.5 G4:2 E4:0.5 E4:0.5 G4:2 E4:0.5 G4:0.5 C5:1 B4:1.5 A4:0.5 A4:1 G4:1 D4:0.5 E4:0.5 F4:1 D4:1 D4:0.5 E4:0.5 F4:2 D4:0.5 F4:0.5 B4:0.5 A4:0.5 G4:1 B4:1 C5:3",
    chords: "C:3 C:3 C:3 G:3 G:3 G:3 G:3 C:3" },
  greensleeves: { bpm: 120, wave: "triangle",
    melody: "A4:1 C5:2 D5:1 E5:1.5 F5:0.5 E5:1 D5:2 B4:1 G4:1.5 A4:0.5 B4:1 C5:2 A4:1 A4:1.5 G#4:0.5 A4:1 B4:2 G#4:1 E4:2 " +
            "A4:1 C5:2 D5:1 E5:1.5 F5:0.5 E5:1 D5:2 B4:1 G4:1.5 A4:0.5 B4:1 C5:1.5 B4:0.5 A4:1 G#4:1.5 F#4:0.5 G#4:1 A4:3",
    chords: "R:1 Am:3 C:3 G:3 Em:3 Am:3 F:3 E:3 E:3 Am:3 C:3 G:3 Em:3 Am:2 E:3 Am:3" },
  morning: { bpm: 96, wave: "sine",
    melody: "G5:1 E5:1 D5:1 C5:1 D5:1 E5:1 G5:1 E5:1 D5:1 C5:1 D5:0.5 E5:0.5 D5:0.5 E5:0.5 G5:1 E5:1 G5:1 A5:1 E5:1 A5:1 G5:1 E5:1 D5:1 C5:3",
    chords: "C:6 C:6 C:3 F:3 C:3 G:3 C:3" },
  polka: { bpm: 152, wave: "square",
    melody: "C5:0.5 G4:0.5 E4:0.5 G4:0.5 C5:1 C5:1 D5:0.5 B4:0.5 G4:0.5 B4:0.5 D5:1 D5:1 E5:0.5 D5:0.5 C5:0.5 B4:0.5 A4:0.5 G4:0.5 F4:0.5 E4:0.5 D4:1 G4:1 C4:2 " +
            "E5:0.5 C5:0.5 G4:0.5 C5:0.5 E5:1 E5:1 F5:0.5 D5:0.5 B4:0.5 D5:0.5 F5:1 F5:1 E5:0.5 C5:0.5 D5:0.5 B4:0.5 C5:1 G4:1 C5:2",
    chords: "C:2 C:2 G:2 G:2 C:2 G:2 G:2 C:2 C:2 C:2 G:2 G:2 C:2 G:2 C:2" },
  starlight: { bpm: 66, wave: "sine",
    melody: "E5:2 D5:1 B4:1 A4:2 G4:2 E4:2 G4:1 A4:1 B4:4 D5:2 B4:1 A4:1 G4:2 E4:2 D4:2 E4:1 G4:1 E4:4",
    chords: "C:4 Am:4 C:4 G:4 Em:4 C:4 G:4 C:4" },
  trainride: { bpm: 138, wave: "triangle",
    melody: "G4:0.5 G4:0.5 G4:0.5 G4:0.5 B4:1 D5:1 C5:0.5 C5:0.5 C5:0.5 C5:0.5 A4:1 F4:1 G4:0.5 G4:0.5 B4:0.5 D5:0.5 G5:1 F5:0.5 E5:0.5 D5:2 R:1 G5:1 " +
            "E5:0.5 E5:0.5 E5:0.5 E5:0.5 C5:1 A4:1 D5:0.5 D5:0.5 D5:0.5 D5:0.5 B4:1 G4:1 A4:0.5 B4:0.5 C5:0.5 D5:0.5 E5:1 F#5:1 G5:3 R:1",
    chords: "G:4 F:4 G:4 D:4 C:4 G:4 D:4 G:4" },
  rain: { bpm: 72, wave: "sine",
    melody: "A4:2 C5:1 E5:1 D5:3 C5:1 B4:2 G4:2 A4:4 E4:1 A4:1 C5:2 B4:1 A4:1 G4:2 F4:2 E4:1 D4:1 E4:4 " +
            "A4:2 C5:1 E5:1 G5:2 F5:1 E5:1 D5:2 B4:2 C5:4 B4:1 C5:1 D5:2 C5:1 B4:1 A4:2 G#4:2 B4:2 A4:4",
    chords: "Am:4 F:4 G:4 Am:4 Am:4 Em:4 Dm:4 E:4 Am:4 C:4 G:4 C:4 G:4 Am:4 E:4 Am:4" },
};

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = (name) => {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  return 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
};
const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

function parse(str) {
  let t = 0; const out = [];
  for (const tok of str.trim().split(/\s+/)) { const [n, d] = tok.split(":"); const beats = Number(d); if (n !== "R") out.push({ n, t, d: beats }); t += beats; }
  return { notes: out, length: t };
}
function chordNotes(name) {
  const m = /^([A-G][#b]?)(m?)$/.exec(name); if (!m) return [];
  const root = midi(m[1] + "3"); return [root - 12, root, root + (m[2] ? 3 : 4), root + 7];
}

// Build the timeline for a song: [{time (s), freqs, dur (s), kind}]
function timeline(song) {
  const spb = 60 / song.bpm;
  const mel = parse(song.melody), ch = parse(song.chords || "R:1");
  const events = [];
  for (const x of mel.notes) events.push({ t: x.t * spb, dur: x.d * spb, f: [hz(midi(x.n))], kind: "mel" });
  for (const x of ch.notes) { const ns = chordNotes(x.n); if (ns.length) events.push({ t: x.t * spb, dur: x.d * spb, f: ns.map(hz), kind: "chord" }); }
  events.sort((a, b) => a.t - b.t);
  return { events, length: Math.max(mel.length, ch.length) * spb + spb * 2 }; // a little breath between loops
}

export class Gramophone {
  constructor() { this.ctx = null; this.song = null; this.timer = null; this.enabled = false; }
  enable() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.55;
      // a soft room: gentle low-pass for that old gramophone warmth
      this.tone = this.ctx.createBiquadFilter(); this.tone.type = "lowpass"; this.tone.frequency.value = 2600;
      this.master.connect(this.tone).connect(this.ctx.destination);
    }
    this.ctx.resume(); this.enabled = true;
    if (this.pending) this.play(this.pending.id, this.pending.since);
  }
  disable() { this.enabled = false; this.stop(); if (this.ctx) this.ctx.suspend(); }
  // Play song `id` as if it started at server time `since` (so everyone hears the same moment)
  play(id, since) {
    this.pending = { id, since };
    if (!this.enabled || !SONG_NOTES[id]) return;
    if (this.song && this.song.id === id && this.song.since === since) return;
    this.stop();
    const tl = timeline(SONG_NOTES[id]);
    const wave = SONG_NOTES[id].wave;
    const pos = (((Date.now() - since) / 1000) % tl.length + tl.length) % tl.length;
    this.song = { id, since, tl, wave, loopStart: this.ctx.currentTime - pos, i: tl.events.findIndex((e) => e.t >= pos) };
    if (this.song.i < 0) { this.song.i = 0; this.song.loopStart += tl.length; }
    this.timer = setInterval(() => this.tick(), 60); this.tick();
  }
  stop() { clearInterval(this.timer); this.timer = null; this.song = null; }
  off() { this.pending = null; this.stop(); }
  tick() {
    const s = this.song; if (!s) return;
    const ahead = this.ctx.currentTime + 0.25;
    while (s.loopStart + s.tl.events[s.i].t < ahead) {
      const e = s.tl.events[s.i]; const at = s.loopStart + e.t;
      if (at > this.ctx.currentTime - 0.05) this.voice(e, Math.max(at, this.ctx.currentTime), s.wave);
      s.i++;
      if (s.i >= s.tl.events.length) { s.i = 0; s.loopStart += s.tl.length; }
    }
  }
  voice(e, at, wave) {
    const ctx = this.ctx;
    for (const f of e.f) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = e.kind === "mel" ? wave : "sine"; o.frequency.value = f;
      const peak = e.kind === "mel" ? (wave === "square" ? 0.07 : 0.2) : 0.045;
      const len = Math.max(0.12, e.dur * (e.kind === "mel" ? 0.95 : 1));
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(peak, at + (e.kind === "mel" ? 0.015 : 0.08));
      g.gain.exponentialRampToValueAtTime(peak * 0.5, at + Math.min(len, 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, at + len + 0.25);
      o.connect(g).connect(this.master); o.start(at); o.stop(at + len + 0.3);
    }
  }
}

// ---------------------------------------------------------------------------
// Ambient sounds of Pino's town, synthesized live: breeze, birds and ducks by
// day; crickets and an owl at night. Plus Pino's own "kee-wee" whistle.
// ---------------------------------------------------------------------------
function noiseBuffer(ctx, seconds = 2) {
  const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function blip(ctx, out, at, { type = "sine", from, to, dur, peak, attack = 0.01 }) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(from, at); o.frequency.exponentialRampToValueAtTime(to, at + dur);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(out); o.start(at); o.stop(at + dur + 0.02);
}

// Pino's call: kiwis whistle a shrill rising "kee-wee". happy = a little extra trill.
export function pinoChirp(ctx, out, happy = false) {
  if (!ctx) return;
  let t = ctx.currentTime + 0.02;
  blip(ctx, out, t, { from: 1700, to: 2700, dur: 0.16, peak: 0.16 });
  t += 0.2;
  blip(ctx, out, t, { from: 1900, to: 3100, dur: 0.2, peak: 0.16 });
  if (happy) { t += 0.24; for (let i = 0; i < 3; i++) blip(ctx, out, t + i * 0.07, { from: 3000, to: 3600, dur: 0.05, peak: 0.08 }); }
}

export class Ambience {
  constructor(ctx) {
    this.ctx = ctx; this.night = false; this.timer = null;
    this.out = ctx.createGain(); this.out.gain.value = 0.9; this.out.connect(ctx.destination);
  }
  start() {
    if (this.timer) return;
    const ctx = this.ctx;
    // breeze: looping noise through a soft band-pass, slowly swelling
    this.wind = ctx.createBufferSource(); this.wind.buffer = noiseBuffer(ctx, 3); this.wind.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 420; bp.Q.value = 0.6;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0.035;
    const lfo = ctx.createOscillator(), lfoAmt = ctx.createGain(); lfo.frequency.value = 0.07; lfoAmt.gain.value = 0.022;
    lfo.connect(lfoAmt).connect(this.windGain.gain);
    this.wind.connect(bp).connect(this.windGain).connect(this.out);
    this.wind.start(); lfo.start(); this.lfo = lfo;
    this.timer = setInterval(() => this.tick(), 450);
  }
  stop() {
    clearInterval(this.timer); this.timer = null;
    try { this.wind?.stop(); this.lfo?.stop(); } catch {}
  }
  setNight(n) {
    this.night = n;
    if (this.windGain) this.windGain.gain.setTargetAtTime(n ? 0.02 : 0.035, this.ctx.currentTime, 2);
  }
  tick() {
    const ctx = this.ctx, t = ctx.currentTime + 0.05, r = Math.random();
    if (!this.night) {
      if (r < 0.1) this.birdsong(t);
      else if (r < 0.112) this.quack(t);
    } else {
      if (r < 0.55) this.cricket(t);
      else if (r < 0.565) this.owl(t);
    }
  }
  birdsong(t) {
    const ctx = this.ctx, base = 2200 + Math.random() * 2200, n = 2 + Math.floor(Math.random() * 4), down = Math.random() < 0.4;
    for (let i = 0; i < n; i++) {
      const f = base * (down ? 1 - i * 0.06 : 1 + (i % 2) * 0.12);
      blip(ctx, this.out, t + i * (0.09 + Math.random() * 0.05), { from: f * 0.85, to: f * 1.15, dur: 0.07, peak: 0.035 });
    }
  }
  quack(t) {
    const ctx = this.ctx;
    for (let i = 0; i < 2; i++) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), at = t + i * 0.22;
      o.type = "sawtooth"; o.frequency.setValueAtTime(260, at); o.frequency.linearRampToValueAtTime(200, at + 0.15);
      f.type = "bandpass"; f.frequency.value = 1000; f.Q.value = 4;
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.05, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
      o.connect(f).connect(g).connect(this.out); o.start(at); o.stop(at + 0.18);
    }
  }
  cricket(t) {
    for (let i = 0; i < 3; i++) blip(this.ctx, this.out, t + i * 0.045, { from: 4600, to: 4500, dur: 0.025, peak: 0.018, attack: 0.004 });
  }
  owl(t) {
    for (const [d, f] of [[0, 390], [0.5, 360]]) blip(this.ctx, this.out, t + d, { from: f, to: f * 0.88, dur: 0.38, peak: 0.07, attack: 0.06 });
  }
}
