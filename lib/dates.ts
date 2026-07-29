const TIME_ZONE = "Europe/Brussels";

export function getBrusselsDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function addDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function getNextDateKeys(count: number, now = new Date()): string[] {
  const today = getBrusselsDateKey(now);
  return Array.from({ length: count }, (_, index) => addDays(today, index + 1));
}
export function longDutchDate(dateKey: string): string {
  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "long", day: "numeric", month: "long", timeZone: TIME_ZONE,
  }).format(new Date(`${dateKey}T12:00:00Z`));
}
