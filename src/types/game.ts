/** One CPU/GPU/RAM/Storage requirement block from the catalog. */
export interface GameSpecBlock {
  cpu: string;
  gpu: string;
  ramGB: number;
  storageGB: number;
}

export interface GameRequirements {
  minimum: GameSpecBlock;
  /** null for older/simpler games that only publish a minimum. */
  recommended: GameSpecBlock | null;
}

/** One entry in src/data/games.json. */
export interface Game {
  id: string;
  name: string;
  steamAppId: number;
  releaseYear: number;
  developer: string;
  publisher: string;
  genres: string[];
  tags: string[];
  modes: string[];
  description: string;
  rating: number;
  popular: boolean;
  playableOn: string;
  recommendedTier: string;
  requiresSSD: boolean;
  requirements: GameRequirements;
  source: string;
  specsVerified: boolean;
}
