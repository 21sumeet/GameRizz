"use client";

import { useState } from "react";
import { MAX_INPUT_CHARS } from "@/config/constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameCard } from "./game-card";
import { fetchRecommendations } from "../client";
import type { Recommendation } from "../types";

const SUGGESTIONS = [
  "I loved Hades and Celeste",
  "chill farming game",
  "competitive multiplayer shooter",
  "story-driven open world RPG",
];

type Status = "idle" | "loading" | "done" | "error";

export function Recommender() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Recommendation[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(raw: string) {
    const query = raw.trim();
    if (!query) return;

        setStatus("loading");
    try {
      setResults(await fetchRecommendations(query));
      setStatus("done");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "couldn't reach my brain rn 😵 try that again in a sec.",
      );
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(text);
        }}
        className="flex gap-2"
      >
        <Input
          value={text}
          maxLength={MAX_INPUT_CHARS}
          onChange={(event) => setText(event.target.value)}
          placeholder="Describe what you want to play…"
          disabled={status === "loading"}
        />
        <Button type="submit" disabled={status === "loading" || !text.trim()}>
          {status === "loading" ? "Finding…" : "Recommend"}
        </Button>
      </form>

      {status === "idle" && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setText(suggestion);
                handleSubmit(suggestion);
              }}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-primary hover:text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {status === "error" && <p className="text-sm text-muted">{errorMessage}</p>}

      {status === "done" && results.length === 0 && (
        <p className="text-sm text-muted">
          nothing matched that — try describing a genre or a game you liked.
        </p>
      )}

      {status === "done" && results.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((recommendation) => (
            <GameCard
              key={recommendation.game.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      )}
    </div>
  );
}