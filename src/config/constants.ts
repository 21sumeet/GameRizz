export const APP_NAME = "GameRizz";

export const APP_TAGLINE = "Can your rig run it? Ask me anything.";

/**
 * Provider settings (API key, base URL, model id) live in .env, not here:
 * GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL. Swapping provider is an .env edit.
 * GOOGLE_API_KEY, GOOGLE_EMBEDDING_BASE_URL, GOOGLE_EMBEDDING_MODEL
 */

/** Embedding model must be identical for games and queries; the model id lives in .env. */
export const EMBEDDING_DIMENSIONS = 1536;

/** Task hint for the embedding model. Games and queries must use the same one. */
export const EMBEDDING_TASK_TYPE = "SEMANTIC_SIMILARITY";
