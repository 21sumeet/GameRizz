import {
  STEAM_CACHE_TTL_MS,
  STEAM_MAX_ATTEMPTS,
  STEAM_TIMEOUT_MS,
} from "@/config/constants";
import { compact, stripHtml } from "@/lib/utils/text";

/**
 * The only place the app talks to Steam's store API.
 * It knows nothing about games, tiers, verdicts or the model - it just fetches
 * and returns plain text. Free to use, no API key.
 *
 * Gotchas learned the hard way:
 * - Never add `filters=pc_requirements`; Steam answers with an empty data array.
 * - Always send cc + l, or the reply comes back in another language and currency.
 */
const STORE_BASE = "https://store.steampowered.com/api";
const USER_AGENT = "GameRizz/0.1 (PC game requirements checker)";

export interface SteamSearchHit {
  id: number;
  name: string;
}

export interface SteamDetails {
  id: number;
  name: string;
  releaseYear: number;
  /** Requirements as plain text, HTML already stripped. */
  minimumText: string;
  recommendedText: string | null;
}

interface SteamAppDetailsResponse {
  success?: boolean;
  data?: {
    name?: string;
    release_date?: { date?: string };
    pc_requirements?: { minimum?: string; recommended?: string };
  };
}

interface CacheEntry {
  value: SteamDetails | null;
  expiresAt: number;
}

/** Small in-memory cache. Lives as long as the server process does. */
const detailsCache = new Map<number, CacheEntry>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Never throws. A Steam outage must not turn into a failed chat reply,
 * so anything unrecoverable comes back as null and the caller says so honestly.
 */
async function fetchJson<T>(url: string): Promise<T | null> {
  let lastError = "";

  for (let attempt = 1; attempt <= STEAM_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(STEAM_TIMEOUT_MS),
      });

      if (response.status === 429 || response.status >= 500) {
        lastError = `steam ${response.status}`;
      } else if (!response.ok) {
        console.warn(`[steam] ${response.status} for ${url}`);
        return null;
      } else {
        return (await response.json()) as T;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    if (attempt < STEAM_MAX_ATTEMPTS) await sleep(500 * attempt);
  }

  console.warn(`[steam] giving up: ${lastError}`);
  return null;
}

/** Look a title up on the Steam store. Returns the best match, or null. */
export async function searchApp(term: string): Promise<SteamSearchHit | null> {
  const url = `${STORE_BASE}/storesearch/?term=${encodeURIComponent(term)}&cc=US&l=en`;
  const data = await fetchJson<{ items?: { id?: number; name?: string }[] }>(url);

  const items = data?.items ?? [];
  if (items.length === 0) return null;

  // Prefer an exact title match, otherwise trust Steam's own ordering.
  const wanted = compact(term);
  const exact = items.find(
    (item) => item.id && item.name && compact(item.name) === wanted,
  );
  const chosen = exact ?? items[0];

  if (!chosen?.id || !chosen.name) return null;
  return { id: chosen.id, name: chosen.name };
}

function toDetails(
  appId: number,
  data: NonNullable<SteamAppDetailsResponse["data"]>,
): SteamDetails | null {
  const rawMinimum = data.pc_requirements?.minimum;
  const minimumText = typeof rawMinimum === "string" ? stripHtml(rawMinimum) : "";

  // Without a minimum block there is nothing to compare against.
  if (minimumText.length === 0) return null;

  const rawRecommended = data.pc_requirements?.recommended;
  const recommendedText =
    typeof rawRecommended === "string" ? stripHtml(rawRecommended) : "";

  const year = data.release_date?.date?.match(/\d{4}/)?.[0];

  return {
    id: appId,
    name: data.name ?? "",
    releaseYear: year ? Number(year) : 0,
    minimumText,
    recommendedText: recommendedText.length > 0 ? recommendedText : null,
  };
}

/**
 * System requirements for one app, as plain text.
 * null means: Steam has no readable requirements for it (or we could not reach Steam).
 */
export async function getAppDetails(appId: number): Promise<SteamDetails | null> {
  const cached = detailsCache.get(appId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const url = `${STORE_BASE}/appdetails?appids=${appId}&cc=us&l=english`;
  const data = await fetchJson<Record<string, SteamAppDetailsResponse>>(url);

  const entry = data?.[String(appId)];
  const details = entry?.success ? entry.data : undefined;
  const value = details ? toDetails(appId, details) : null;

  detailsCache.set(appId, { value, expiresAt: Date.now() + STEAM_CACHE_TTL_MS });
  return value;
}