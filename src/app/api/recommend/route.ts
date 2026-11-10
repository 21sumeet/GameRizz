import { recommendGames } from "@/features/recommender/service";
import type {
  RecommendRequest,
  RecommendResponse,
} from "@/features/recommender/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RecommendRequest | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const recommendations = await recommendGames(text);
    // An empty list is valid — the UI shows an empty state.
    return Response.json({ recommendations } satisfies RecommendResponse);
  } catch (error) {
    console.error("[api/recommend]", error);
    return Response.json(
      { error: "The recommender is unavailable right now." },
      { status: 502 },
    );
  }
}