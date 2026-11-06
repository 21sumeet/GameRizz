import type { EmbeddingTaskType } from "@/config/constants";

/** One stored vector plus the fingerprint of the text that produced it. */
export interface StoredEmbedding {
  /** sha256 of the exact text sent to the model. Text changed → hash changed → re-embed. */
  textHash: string;
  vector: number[];
}

/**
 * src/data/embeddings.json
 *
 * The header (model + taskType + dimensions) is what makes a stale file detectable:
 * vectors from different models or task types are not comparable.
 */
export interface EmbeddingsFile {
  model: string;
  taskType: EmbeddingTaskType;
  dimensions: number;
  games: Record<string, StoredEmbedding>;
}