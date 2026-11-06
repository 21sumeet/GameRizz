/**
 * Server-only env access. Read lazily (on call, not at import) so `next build`
 * still succeeds on a machine without .env — the error surfaces at request time.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export function groqConfig() {
  return {
    apiKey: requireEnv("GROQ_API_KEY"),
    model: requireEnv("GROQ_MODEL"),
    baseUrl: requireEnv("GROQ_BASE_URL"),
  };
}

export function googleEmbeddingConfig(){
  return{
    apiKey: requireEnv("GOOGLE_API_KEY"),
    model: requireEnv("GOOGLE_EMBEDDING_MODEL"),
    baseUrl: requireEnv("GOOGLE_EMBEDDING_BASE_URL"),
  }
}