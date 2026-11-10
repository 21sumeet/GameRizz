import { embedText } from "@/lib/ai/embeddings";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_TASK_TYPES,
  RECOMMENDATION_COUNT,
} from "@/config/constants";
import { googleEmbeddingConfig } from "@/config/env";
import { getEmbeddingsRepository } from "@/lib/data/embeddings.repository";
import { getGamesRepository } from "@/lib/data/games.repository";
import { topN } from "./similarity";
import type { Recommendation } from "./types";

/**
 * Text -> query vector -> nearest stored game vectors -> ranked games.
 * Server-only: it reaches src/config/env.ts. Do not import from a client file.
 */
export async function recommendGames(
  text: string,
  limit = RECOMMENDATION_COUNT,
): Promise<Recommendation[]> {
  const query = text.trim();
  if (!query) throw new Error("recommendGames: text must not be empty");

  // Guard the stored file BEFORE spending an embedding call. Vectors from a
  // different model or task type are not comparable, so fail early and loud.
  const repository = getEmbeddingsRepository();
  const meta = repository.getMeta();
  const config = googleEmbeddingConfig();

  if (meta.model !== config.model) {
    throw new Error(
      `Embeddings are from model "${meta.model}" but the app is configured for "${config.model}". Re-run npm run embed:generate.`,
    );
  }
  if (meta.taskType !== EMBEDDING_TASK_TYPES.document) {
    throw new Error(
      `Embeddings use task type "${meta.taskType}" but should be "${EMBEDDING_TASK_TYPES.document}". Re-run npm run embed:generate.`,
    );
  }

  const queryVector = await embedText(query, {
    taskType: EMBEDDING_TASK_TYPES.query, // queries, not documents
  });

  // Drop wrong-sized vectors up front. cosineSimilarity throws on a mismatch,
  // so one bad vector would otherwise fail the entire request.
  const candidates = Object.entries(repository.getVectors())
    .filter(([, entry]) => entry.vector.length === EMBEDDING_DIMENSIONS)
    .map(([id, entry]) => ({ id, vector: entry.vector }));

  // Don't hand back a game the user just told us they liked. Note: short alias
  // keys like "civ" mean "I like civ games" excludes Civilization VI — intended.
  const named = new Set(
    getGamesRepository()
      .findAllInText(query)
      .map((game) => game.id),
  );
  const filtered = candidates.filter((item) => !named.has(item.id));

  const hits = topN(queryVector, filtered, limit);

  // topN returns ids only, so look each up in the catalog.
  const byId = new Map(
    getGamesRepository()
      .getAll()
      .map((game) => [game.id, game]),
  );

  const recommendations: Recommendation[] = [];
  for (const hit of hits) {
    const game = byId.get(hit.id);
    if (!game) continue; // present in embeddings but not in the catalog
    recommendations.push({ game, score: hit.score });
  }
  return recommendations;
}