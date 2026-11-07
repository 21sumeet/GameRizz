/**
 * Sanity-check retrieval quality by hand.
 * Embeds one query, scores it against every stored game, prints the top 5.
 * This is a read-and-look tool, not a test: it costs one API call.
 *
 * Run: npm run embed:check -- "I loved Hades and Celeste"
 */
import { embedText } from "@/lib/ai/embeddings";
import { EMBEDDING_TASK_TYPES } from "@/config/constants";
import { getEmbeddingsRepository } from "@/lib/data/embeddings.repository";
import { topN } from "@/features/recommender/similarity";

const DEFAULT_QUERY = "competitive multiplayer shooter";

async function main() {
  const query = process.argv[2] ?? DEFAULT_QUERY;
  const repository = getEmbeddingsRepository();
  const meta = repository.getMeta();

  const vectors = repository.getVectors();
  const items = Object.entries(vectors).map(([id, entry]) => ({
    id,
    vector: entry.vector,
  }));

  console.log(`query : "${query}"`);
  console.log(`model : ${meta.model} (${meta.dimensions}-dim, ${meta.taskType})`);
  console.log("");

  const queryVector = await embedText(query, {
    taskType: EMBEDDING_TASK_TYPES.query,
  });

  for (const hit of topN(queryVector, items, 5)) {
    console.log(`  ${hit.score.toFixed(4)}  ${hit.id}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});