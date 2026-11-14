export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getMondayOfWeek(date: Date): Date {
  const monday = new Date(date);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getNextMonday(from: Date): Date {
  const monday = getMondayOfWeek(from);
  if (monday.toDateString() === from.toDateString()) return monday;
  monday.setDate(monday.getDate() + 7);
  return monday;
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
