export const APP_NAME = "GameRizz";

export const APP_TAGLINE = "Can your rig run it? Ask me anything.";

/**
 * Provider settings (API key, base URL, model id) live in .env, not here:
 * GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL. Swapping provider is an .env edit.
 * GOOGLE_API_KEY, GOOGLE_EMBEDDING_BASE_URL, GOOGLE_EMBEDDING_MODEL
 */

/** Embedding model must be identical for games and queries; the model id lives in .env. */
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Task hints tell the model what a text is for. Deliberately asymmetric:
 * games are documents, user input is a query.
 * Do not mix them — a query vector compared against query vectors scores badly.
 * Note: `gemini-embedding-2` ignores taskType entirely (it uses prompt prefixes).
 */
export const EMBEDDING_TASK_TYPES = {
  document: "RETRIEVAL_DOCUMENT",
  query: "RETRIEVAL_QUERY",
} as const;

export type EmbeddingTaskType =
  (typeof EMBEDDING_TASK_TYPES)[keyof typeof EMBEDDING_TASK_TYPES];

/** How many recommendations the UI shows. */
export const RECOMMENDATION_COUNT = 6;


/**
 * Max characters accepted by the AI-backed API routes. 
 * this is to set max input from user
 */
export const MAX_INPUT_CHARS = 500;
