// base64 without Node's Buffer (works the same in Netlify's runtime), and the size rules for Pino's eyes
export function toB64(u8: Uint8Array) { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); }
export function fromB64(b64: string) { const s = atob(b64), u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); return u8; }
export const EYES_FRESH_MS = 150_000;   // a view older than this is out of date
export const EYES_MAX_BYTES = 220_000;  // a small JPEG is plenty
