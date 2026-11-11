/**
 * Turns a failed fetch Response into something a human can read.
 * Our API routes answer with { error: string }; anything else (an HTML 500
 * page, a proxy error, a network hiccup with no body) falls back to `fallback`.
 */
export async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown } | null;
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // Body wasn't JSON — fall through to the fallback.
  }
  return fallback;
}