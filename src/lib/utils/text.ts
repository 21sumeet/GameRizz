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

/** normalizeText() with the spaces squeezed out: "gta 5" -> "gta5", "gta v" -> "gtav". */
export function compact(value : string){
  return normalizeText(value).replace(/ /g, "");   //remove all space char form string
}

/** normalizeText() split into words. */
export function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized.length === 0 ? [] : normalized.split(" ");
}
