import type { Game } from "@/types/game";

/** One recommended game plus the similarity score that ranked it. */
export interface Recommendation {
  game: Game;
  /** Cosine similarity to the query. For debugging/ranking only — do NOT show this to users. */
  score: number;
}

/** Wire format for POST /api/recommend. */
export interface RecommendRequest {
  text: string;
}

export interface RecommendResponse {
  recommendations: Recommendation[];
}