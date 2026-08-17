// Whether a salon is currently open, based on its daily open/close hours
// (e.g. "09:00" / "18:00"). Assumes same-day hours — a salon that closes
// after midnight isn't a case this app's booking flow handles elsewhere either.
export function isSalonOpenNow(openTime: string, closeTime: string): boolean {
  if (!openTime || !closeTime) return false;

  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);
  if ([openH, openM, closeH, closeM].some((n) => Number.isNaN(n))) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}
