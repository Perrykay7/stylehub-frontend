import * as SecureStore from "expo-secure-store";

// Tracks the salon ids a customer has recently opened, most-recent-first,
// so Home can show a "Recently Viewed" row. Stored on-device only (not
// synced to the backend) — no account needed, just local browsing history.
const RECENTLY_VIEWED_KEY = "stylehub_recently_viewed_salons";
const MAX_RECENT = 10;

export async function recordSalonView(salonId: string): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(RECENTLY_VIEWED_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const next = [salonId, ...ids.filter((id) => id !== salonId)].slice(0, MAX_RECENT);
    await SecureStore.setItemAsync(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // Local browsing history isn't critical — fail silently.
  }
}

export async function getRecentlyViewedSalonIds(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
