// frontend/lib/recentSearch.ts
//
// Lightweight, localStorage-backed "recent searches" used by the header
// search and the shop page. Purely client-side — no backend involved.

const STORAGE_KEY = "storefront-recent-searches-v1";
const MAX_RECENT = 5;

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

function writeStorage(items: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode / quota) — ignore.
  }
}

/** Most recent searches, newest first. */
export function getRecentSearches(): string[] {
  return readStorage();
}

/** Records a search term at the front of the list, deduped + capped. */
export function addRecentSearch(term: string): string[] {
  const trimmed = term.trim();
  const next = [trimmed, ...readStorage().filter((item) => item !== trimmed)].slice(0, MAX_RECENT);
  writeStorage(next);
  return next;
}

/** Removes all stored searches. */
export function clearRecentSearches(): void {
  writeStorage([]);
}
