/**
 * Lowercase a string and reduce it to alphanumeric words.
 *
 * "Sid Meier's Civilization VI" -> "sid meiers civilization vi"
 * "Intel Core i7-6700"          -> "intel core i7 6700"
 */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** normalizeText() split into words. */
export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized.length === 0 ? [] : normalized.split(" ");
}
