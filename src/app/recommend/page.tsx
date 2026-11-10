import { Recommender } from "@/features/recommender/components/recommender";
export default function RecommendPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Recommender</h1>
        <p className="text-sm text-muted">
          Describe what you feel like playing and we'll find games that fit.
        </p>
      </div>
      <Recommender />
    </div>
  );
}