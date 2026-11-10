import embeddingsFile from "@/data/embeddings.json";
//import { EMBEDDING_DIMENSIONS } from "@/config/constants";
import type { EmbeddingsFile, StoredEmbedding } from "@/types/embedding";

const file = embeddingsFile as unknown as EmbeddingsFile;

export interface EmbeddingsRepository {
  /** Header of the file, so callers can detect a model mismatch. */
  getMeta(): { model: string; taskType: string; dimensions: number };
  /** Every stored game vector, keyed by game id. */
  getVectors(): Record<string, StoredEmbedding>;
  getVector(gameId: string): number[] | null;
}

export function getEmbeddingsRepository(): EmbeddingsRepository {
  return {
    getMeta() {
      return {
        model: file.model,
        taskType: file.taskType,
        dimensions: file.dimensions,
      };
    },
    getVectors() {
      return file.games;
    },
    getVector(gameId: string) {
      return file.games[gameId]?.vector ?? null;
    },
  };
}