export const APP_NAME = "GameRizz";

export const APP_TAGLINE = "Can your rig run it? Ask me anything.";

/**
 * Provider settings (API key, base URL, model id) live in .env, not here:
 * GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL. Swapping provider is an .env edit.
 */

/** Embedding model must be identical for games and queries. TODO Phase 1: Groq has no embeddings endpoint. */
export const EMBEDDING_MODEL = "";
