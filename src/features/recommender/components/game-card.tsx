import { Card } from "@/components/ui/card";
import type { Recommendation } from "../types";

/** One result. Presentational only. Score is intentionally not shown. */
export function GameCard({ recommendation }: { recommendation: Recommendation }) {
  const { game } = recommendation;

  return (
    <Card className="flex flex-col gap-2 p-4">
      <h3 className="font-semibold text-foreground">{game.name}</h3>
      <p className="text-xs text-muted">{game.genres.join(" · ")}</p>
      <p className="line-clamp-3 text-sm text-muted">{game.description}</p>
    </Card>
  );
}