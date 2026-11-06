import { googleEmbeddingConfig } from "@/config/env";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_TASK_TYPES,
  type EmbeddingTaskType,
} from "@/config/constants";

/** Google's embedContent returns one vector under `embedding.values`. */
interface EmbedContentResponse {
  embedding?: { values?: number[] };
}

export interface EmbedTextOptions {
  /** Game text → "RETRIEVAL_DOCUMENT". User input → "RETRIEVAL_QUERY". */
  taskType?: EmbeddingTaskType;
}

/**
 * The only place text becomes a vector.
 * Callers must pass the task type that matches what the text is,
 * otherwise the stored and queried vectors are not comparable.
 */
export async function embedText(
  text: string,
  { taskType = EMBEDDING_TASK_TYPES.document }: EmbedTextOptions = {},
): Promise<number[]> {
  if (text.trim().length === 0) {
    throw new Error("embedText: text must not be empty");
  }

  const { apiKey, model, baseUrl } = googleEmbeddingConfig();

  const response = await fetch(`${baseUrl}/models/${model}:embedContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google embeddings ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as EmbedContentResponse;
  const values = data.embedding?.values;
  if (!values || values.length === 0) {
    throw new Error("Google embeddings: response contained no vector");
  }

  return values;
}