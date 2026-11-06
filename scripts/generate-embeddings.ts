/**
 * Precompute one embedding per game and write src/data/embeddings.json.
 *
 * Run: npm run embed:generate
 * Incremental: only games whose text changed (or new games) call the API.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { embedText } from "@/lib/ai/embeddings";
import { googleEmbeddingConfig } from "@/config/env";
import { EMBEDDING_DIMENSIONS, EMBEDDING_TASK_TYPES } from "@/config/constants";
import { buildGameText } from "@/lib/data/game-text";
import { getGamesRepository } from "@/lib/data/games.repository";
import type { EmbeddingsFile, StoredEmbedding } from "@/types/embedding";

// scripts are run from the project root, so process.cwd() is the repo.
const OUTPUT_PATH = join(process.cwd(), "src", "data", "embeddings.json");

/** Small pause between calls to stay clear of free-tier rate limits. */
const REQUEST_DELAY_MS = 250;

/** One retry loop for 429/503 — transient, not a bug in our request. */
const MAX_ATTEMPTS = 3;

function hashText(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Returns the previous file, or null when missing/unreadable/corrupt. */
function readExisting(): EmbeddingsFile | null {
  try {
    const parsed = JSON.parse(readFileSync(OUTPUT_PATH, "utf8")) as EmbeddingsFile;
    if (!parsed || typeof parsed !== "object" || typeof parsed.games !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * True only when the old file was built with the same model, task type and
 * dimensions. Otherwise its vectors live in a different space and cannot be reused.
 */
function matchesConfig(
  file: EmbeddingsFile,
  model: string,
  taskType: string,
): boolean {
  return (
    file.model === model &&
    file.taskType === taskType &&
    file.dimensions === EMBEDDING_DIMENSIONS
  );
}

async function embedWithRetry(text: string): Promise<number[]> {
  let lastError: Error = new Error("embedWithRetry: never attempted");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await embedText(text, { taskType: EMBEDDING_TASK_TYPES.document });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const retryable =
        lastError.message.includes("429") || lastError.message.includes("503");
      if (!retryable || attempt === MAX_ATTEMPTS) break;

      const backoffMs = 1000 * attempt;
      console.warn(`    retrying in ${backoffMs}ms (${lastError.message.slice(0, 60)})`);
      await sleep(backoffMs);
    }
  }

  throw lastError;
}

async function main() {
  const { model } = googleEmbeddingConfig();
  const taskType = EMBEDDING_TASK_TYPES.document;
  const games = getGamesRepository().getAll();

  const existing = readExisting();   //check if emeding file already exist or not , also check if corrupt, missing or unreadable 
  const reusable = existing !== null && matchesConfig(existing, model, taskType);   //old file is resuable or not 

  console.log(`model     : ${model}`);
  console.log(`taskType  : ${taskType}`);
  console.log(`dimensions: ${EMBEDDING_DIMENSIONS}`);
  console.log(`games     : ${games.length}`);

  if (existing && !reusable) {
    console.log("previous file ignored: model/taskType/dimensions changed");
  } else if (existing) {
    console.log(`previous file: ${Object.keys(existing.games).length} vectors available`);
  }
  console.log("");

  const next: Record<string, StoredEmbedding> = {};
  const failed: string[] = [];
  let embedded = 0;
  let skipped = 0;

  for (const game of games) {
    const text = buildGameText(game);
    const textHash = hashText(text);
    const previous = existing && reusable ? existing.games[game.id] : undefined;
    // Reuse only when the text is identical AND the vector length is what we expect.
    if (
      previous &&
      previous.textHash === textHash &&
      previous.vector.length === EMBEDDING_DIMENSIONS
    ) {
      next[game.id] = previous;
      skipped += 1;
      continue;
    }

    try {
      const vector = await embedWithRetry(text); // this create vector for text

      if (vector.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `expected ${EMBEDDING_DIMENSIONS} dimensions, got ${vector.length}`,
        );
      }

      next[game.id] = { textHash, vector };
      embedded += 1;
      console.log(`  ok   ${game.id}`);
      await sleep(REQUEST_DELAY_MS);
    } catch (error) {
      // Keep going: one bad game must not throw away the others' work.
      const message = error instanceof Error ? error.message : String(error);
      failed.push(game.id);
      console.error(`  FAIL ${game.id}: ${message}`);
    }
  }

  // Never overwrite a good file with an empty result (e.g. key revoked mid-run).
  if (Object.keys(next).length === 0) {
    console.error("\nNo vectors produced — leaving the existing file untouched.");
    process.exitCode = 1;
    return;
  }

  const file: EmbeddingsFile = {
    model,
    taskType,
    dimensions: EMBEDDING_DIMENSIONS,
    games: next,
  };

  // Write to .tmp then rename: rename is atomic, so the file is never half-written.
  const tempPath = `${OUTPUT_PATH}.tmp`;
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(tempPath, JSON.stringify(file), "utf8");
  renameSync(tempPath, OUTPUT_PATH);

  console.log("");
  console.log(`embedded: ${embedded} | skipped: ${skipped} | failed: ${failed.length}`);
  console.log(`written : src/data/embeddings.json (${Object.keys(next).length} vectors)`);

  if (failed.length > 0) {
    console.error(`failing games: ${failed.join(", ")}`);
    process.exitCode = 1;
  }
}

// No top-level await: this package is CommonJS, so `.catch()` replaces it.
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});