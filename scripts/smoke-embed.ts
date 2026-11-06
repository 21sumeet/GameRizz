import { embedText } from "@/lib/ai/embeddings";
import { EMBEDDING_DIMENSIONS } from "@/config/constants";
import { googleEmbeddingConfig } from "@/config/env";

async function main() {
  const { model } = googleEmbeddingConfig();
  const vector = await embedText("I loved Hades and Celeste");

  console.log("model    :", model);
  console.log("expected :", EMBEDDING_DIMENSIONS, "dimensions");
  console.log("got      :", vector.length, "dimensions");
  console.log("first 5  :", vector.slice(0, 5));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});