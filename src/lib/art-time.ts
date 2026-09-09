const TZ = "America/Argentina/Buenos_Aires";

export function artYmd(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

export function artToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function artTomorrow() {
  const [y, m, d] = artToday().split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  const dd = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${mm}-${dd}`;
}

export function artWeekday(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: TZ,
    weekday: "short",
  });
}

export function isWeekend(iso: string) {
  const w = artWeekday(iso);
  return w === "Sat" || w === "Sun";
}

export function clockArt(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dayBucket(iso: string): "hoy" | "manana" | "prox" {
  const d = artYmd(iso);
  if (d === artToday()) return "hoy";
  if (d === artTomorrow()) return "manana";
  return "prox";
}
