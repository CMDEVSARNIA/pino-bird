// Seasonal decorations that go up in town on the real calendar (Toronto time).
export type Holiday = { id: "winter" | "halloween"; line: string };
export function holiday(now: number): Holiday | null {
  const [m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", month: "numeric", day: "numeric" })
    .formatToParts(new Date(now)).filter((p) => p.type !== "literal").map((p) => Number(p.value));
  if (m === 12 || (m === 1 && d <= 6))
    return { id: "winter", line: "The town is decorated for the winter holidays: a twinkly tree with ornaments and a star in the plaza, coloured lights along the roofs, and a wreath on your door." };
  if (m === 10 && d >= 20)
    return { id: "halloween", line: "It's nearly Hallowe'en: glowing jack-o'-lanterns sit on doorsteps around town." };
  return null;
}
