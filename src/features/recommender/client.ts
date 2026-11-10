import type { RecommendResponse, Recommendation } from "./types";

/** Browser-side call. The service itself can't be imported here. */
export async function fetchRecommendations(
  text: string,
): Promise<Recommendation[]> {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Recommend request failed (${response.status})`);
  }

  const data = (await response.json()) as RecommendResponse;
  return data.recommendations;
}