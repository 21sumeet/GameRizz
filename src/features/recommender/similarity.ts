/**
 * Pure vector math for the recommender. No network, no file reads, no Game type:
 * everything here is `number[]` in, `number` out, so it is trivially testable.
 */

/** One scored candidate. `id` is a game id in practice. */
export interface SimilarityHit {
  id: string;
  score: number;
}

/** Anything we can score: one id plus its vector. */
export interface VectorItem {
  id: string;
  vector: number[];
}

/**
 * Cosine similarity: the cosine of the angle between two vectors.
 * 1 = same direction, 0 = unrelated, -1 = opposite.
 *
 * Magnitude is ignored on purpose. Embeddings encode meaning as a direction, so
 * a short query and a long description can score high without the longer text
 * winning just by being longer.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  // Silently comparing a 1536-dim query against a 3072-dim game would produce a
  // believable but meaningless score, so this must be loud.
  if (a.length !== b.length) {
    throw new Error(
      `cosineSimilarity: dimension mismatch (${a.length} vs ${b.length})`,
    );
  }

  if (a.length === 0) {
    throw new Error("cosineSimilarity: empty vectors");
  }

  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  // A zero vector has no direction, so similarity is undefined. Returning 0
  // instead of NaN keeps sort() deterministic: NaN comparisons are always false,
  // which silently scrambles the ranking.
  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

/**
 * Score every candidate against the query and keep the best `n`, highest first.
 *
 * Deliberately dumb: it does not know about games the user already named.
 * Filtering those is the service's job, which keeps this function pure.
 */
export function topN(query: number[], items: VectorItem[], n: number): SimilarityHit[] {
  if (n <= 0) return [];

  const scored = items.map((item) => ({
    id: item.id,
    score: cosineSimilarity(query, item.vector),
  }));

  // Array.prototype.sort is stable in modern JS, so equal scores keep catalog
  // order and the output stays deterministic run to run.
  scored.sort((left, right) => right.score - left.score);

  return scored.slice(0, n);
}