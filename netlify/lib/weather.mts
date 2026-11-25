// Real weather and seasons for Pino's town.
// The weather is the live weather in Sarnia, Ontario (Open-Meteo, free, no key).
// Seasons follow the real calendar there.

export type WeatherKind = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";
export type Weather = {
  at: number;        // when we last checked (ms)
  code: number;      // WMO weather code
  kind: WeatherKind;
  temp: number;      // °C
  wind: number;      // km/h
  snow: number;      // snow on the ground, cm
  day: boolean;
  desc: string;      // "light snow", "clear sky", ...
  forecast?: { day: string; kind: WeatherKind; desc: string; hi: number; lo: number }[]; // next few days, for the TV weather channel
};
export type Season = { name: "winter" | "spring" | "summer" | "autumn"; phase: "early" | "mid" | "late"; label: string };

export const WEATHER_PLACE = { name: "Sarnia", lat: 42.97, lon: -82.40 };
const REFRESH_MS = 15 * 60_000;

const CODES: Record<number, [WeatherKind, string]> = {
  0: ["clear", "clear sky"], 1: ["clear", "mostly clear"], 2: ["partly", "partly cloudy"], 3: ["cloudy", "overcast"],
  45: ["fog", "fog"], 48: ["fog", "freezing fog"],
  51: ["drizzle", "light drizzle"], 53: ["drizzle", "drizzle"], 55: ["drizzle", "heavy drizzle"],
  56: ["drizzle", "freezing drizzle"], 57: ["drizzle", "freezing drizzle"],
  61: ["rain", "light rain"], 63: ["rain", "rain"], 65: ["rain", "heavy rain"], 66: ["rain", "freezing rain"], 67: ["rain", "freezing rain"],
  71: ["snow", "light snow"], 73: ["snow", "snow"], 75: ["snow", "heavy snow"], 77: ["snow", "snow grains"],
  80: ["rain", "rain showers"], 81: ["rain", "heavy rain showers"], 82: ["storm", "pouring rain"],
  85: ["snow", "snow showers"], 86: ["snow", "heavy snow showers"],
  95: ["storm", "thunderstorm"], 96: ["storm", "thunderstorm with hail"], 99: ["storm", "thunderstorm with hail"],
};

export function needsRefresh(w: Weather | undefined, now: number) {
  return !w || now - w.at > REFRESH_MS;
}

export async function fetchWeather(now: number, timeoutMs = 4000): Promise<Weather | null> {
  const { lat, lon } = WEATHER_PLACE;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,weather_code,wind_speed_10m,is_day,snow_depth" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=4&timezone=America%2FToronto";
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) throw new Error(`open-meteo ${r.status}`);
    const body = await r.json(), c = body?.current, dl = body?.daily;
    if (!c || typeof c.weather_code !== "number") throw new Error("open-meteo: no current weather");
    const [kind, desc] = CODES[c.weather_code] ?? ["cloudy", "grey skies"];
    return {
      at: now, code: c.weather_code, kind, desc,
      temp: Math.round(c.temperature_2m ?? 0), wind: Math.round(c.wind_speed_10m ?? 0),
      snow: Math.round((c.snow_depth ?? 0) * 100), day: c.is_day === 1,
      forecast: Array.isArray(dl?.time) ? dl.time.slice(0, 4).map((t: string, i: number) => {
        const [k, ds] = CODES[dl.weather_code?.[i]] ?? ["cloudy", "grey skies"];
        const day = new Date(`${t}T12:00:00Z`).toLocaleDateString("en-CA", { weekday: "short", timeZone: "UTC" });
        return { day, kind: k, desc: ds, hi: Math.round(dl.temperature_2m_max?.[i] ?? 0), lo: Math.round(dl.temperature_2m_min?.[i] ?? 0) };
      }) : undefined,
    };
  } catch (e) {
    console.log("Weather check failed:", (e as Error).message);
    return null;
  }
}

export function season(now: number): Season {
  const month = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", month: "numeric" }).format(new Date(now)));
  // meteorological seasons: Dec-Feb winter, Mar-May spring, Jun-Aug summer, Sep-Nov autumn
  const name = (["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"] as const)[month - 1];
  const idx = { winter: [12, 1, 2], spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11] }[name].indexOf(month);
  const phase = (["early", "mid", "late"] as const)[idx];
  return { name, phase, label: `${phase === "mid" ? "" : phase + " "}${name}`.trim() };
}

export const snowy = (w?: Weather) => !!w && (w.snow >= 1 || (w.kind === "snow" && w.temp <= 1));
export const frozenPond = (w?: Weather) => !!w && w.temp <= -4;
export const wet = (w?: Weather) => !!w && (w.kind === "rain" || w.kind === "storm" || w.kind === "drizzle");

function feel(w: Weather) {
  const t = w.temp;
  const temp = t <= -15 ? "bitterly cold" : t <= -5 ? "very cold" : t <= 2 ? "cold" : t <= 10 ? "chilly" : t <= 18 ? "mild" : t <= 26 ? "warm" : "hot";
  const wind = w.wind >= 40 ? ", very windy" : w.wind >= 25 ? ", windy" : w.wind >= 14 ? ", breezy" : "";
  return `${temp} (${t}°C)${wind}`;
}

// One line for his prompts, e.g. "light snow, cold (-1°C), breezy; snow on the ground (3 cm). Season: late autumn."
export function weatherLine(w: Weather | undefined, now: number) {
  const s = season(now);
  if (!w) return `Season: ${s.label}.`;
  const ground = w.snow >= 1 ? `; there's snow on the ground (${w.snow} cm)` : "";
  const pond = frozenPond(w) ? "; the pond is frozen over" : "";
  return `${w.desc}, ${feel(w)}${ground}${pond}. Season: ${s.label}.`;
}

// How the weather feels to a small bird outside, for his decisions
export function outdoorFeeling(w: Weather | undefined) {
  if (!w) return "";
  if (w.kind === "storm") return "There's a storm - thunder and pouring rain. Being outside is scary and you're getting soaked.";
  if (w.kind === "rain") return "It's raining on you and your feathers are getting wet.";
  if (w.kind === "drizzle") return "A fine drizzle is settling on your feathers.";
  if (w.kind === "snow") return w.temp <= -5 ? "Snow is falling and it's freezing out here." : "Snowflakes are landing on your beak.";
  if (w.temp <= -10) return "It's bitterly cold out here; your toes are freezing.";
  if (w.temp >= 30) return "It's very hot out here.";
  return "";
}

// Small extra drain on energy for being out in rough weather (per moment)
export function weatherDrain(w: Weather | undefined): number {
  if (!w) return 0;
  if (w.kind === "storm") return 3;
  if (w.kind === "rain" || (w.kind === "snow" && w.temp <= -5) || w.temp <= -10) return 2;
  if (w.kind === "drizzle" || w.temp <= -3) return 1;
  return 0;
}
