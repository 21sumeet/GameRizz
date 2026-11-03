/**
 * The two catalog spec fields that can be ranked in a tier table.
 * RAM and storage are plain numbers and need no table.
 */
export type TieredField = "cpu" | "gpu";

/** Shape of cpu-tiers.json / gpu-tiers.json: chip name -> tier, 1 = weakest. */
export type ChipTierTable = Record<string, number>;