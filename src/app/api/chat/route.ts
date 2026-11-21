import { chatComplete } from "@/lib/ai/client";
import { CHECKER_PROMPT, SYSTEM_PROMPT } from "@/features/chat/persona";
import { hasAnySpec, parseQuery , resolveContext} from "@/features/chat/spec-parser";
import { askForSpecs, noGameReply, specsUnavailableReply } from "@/features/chat/replies";
import { compareRequirements, formatVerdict } from "@/features/checker/compare";
import { findGameOnSteam } from "@/features/checker/requirements/from-steam";
import type { ChatRequest, ChatResponse, ChatHistory } from "@/features/chat/types";
import type { CheckableGame } from "@/types/game";
import {CHAT_HISTORY_LIMIT,  MAX_INPUT_CHARS } from "@/config/constants";


export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ChatRequest | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  // Guard before the api call: checking the max input from user length..
  if (message.length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: `message is too long (max ${MAX_INPUT_CHARS} characters)` },
      { status: 413 },
    );
  } 

  const history = readHistory(body);
  try {
    const reply = await buildReply(message , history);
    return Response.json({ reply } satisfies ChatResponse);
  } catch (error) {
    console.error("[api/chat]", error);
    return Response.json(
      { error: "The assistant is unavailable right now." },
      { status: 502 },
    );
  }
}

/**
 * If the message names a game from our catalog, the catalog decides the answer
 * and the model only rewords it. there are 3 ways of handling names as door1 , 2 and 3
 */
/**
 * Four doors:
 * 1. game in our tables + every named part is a real row -> our numbers decide, the model only words it.
 * 2. game found, but a part the user named cannot be placed -> ask, no verdict.
 * 3. game not in our catalog -> try Steam once, then use its numbers the same way.
 * 4. nothing anywhere -> say so, no verdict.
 */
async function buildReply(message: string, history: ChatHistory[] = [],): Promise<string> {

  const current = parseQuery(message);
  const {game : carriedGame , specs : carriedSpecs} = resolveContext(
    history.filter((turn)=> turn.role ==="user").map((turn)=> turn.content)
  );

  const specs = {...carriedSpecs, ...current.specs};
  const {unresolved} = current;

  const talkingAboutPc = hasAnySpec(specs) || unresolved.length > 0;

  // Door 3: this message did not name one of our games. Before falling back to
  // a game from earlier in the chat, check whether it is really a new question
  // about a game we do not have - only Steam can tell us that.
  let game: CheckableGame | null = current.game;
  let fromSteam = false;

  if (!game && talkingAboutPc) {
    const steam = await findGameOnSteam(message);

    if (steam.status === "found") {
      game = steam.game;
      fromSteam = true;
    } else if (steam.status === "no-specs") {
      return specsUnavailableReply();
    } else if (steam.status === "game-not-on-steam") {
      return noGameReply();
    } else {
      // "no-game" or "unknown": nothing new was named, so this is the spec
      // answer to our own question. Continue the older game.
      game = carriedGame;
    }
  }

  // Door 4 : nothing in the catalog and nothing readable on Steam -> say so, no verdict.
  if (!game) {
    if (!talkingAboutPc) {
      return chatComplete([
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: message },
      ]);
    }
    return noGameReply();
  }

  const source = fromSteam ? "steam" : "catalog";

  // Door 2: named but not placeable ("i5" with no number, or a chip not in our
  // table). "mismatch" is exactly that case - checkField only uses it when the
  // chip could not be ranked AND its wording is not one the catalog lists.
  const result = compareRequirements(specs, game);
  const unpinned = [
    ...new Set([
      ...unresolved,
      ...result.minimum
        .filter((check) => check.status === "mismatch")
        .map((check) => check.field),
    ]),
  ];
  // A gap in OUR tier tables is not the user's wording problem, so never ask
  // about a Steam game - let the honest "could not rank that" verdict through.
  if (!fromSteam && unpinned.length > 0) return askForSpecs(unpinned);

  if (!hasAnySpec(specs)) {
    const verdict = formatVerdict(result, source);
    return chatComplete([
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: `User message:\n${message}\n\nCatalog facts:\n${verdict}` },
    ]);
  }
  
  //door 1
  const verdict = formatVerdict(result, source);
  return chatComplete([
    { role: "system", content: CHECKER_PROMPT },
    ...history,
    { role: "user", content: `User message:\n${message}\n\nCatalog facts:\n${verdict}` },
  ]);
}

/**
// Ignore invalid messages, keep only the latest turns, and limit message length.
// History comes from the browser, so validate it before using it.
 */
function readHistory(body: ChatRequest | null): ChatHistory[] {
  if (!Array.isArray(body?.history)) return [];

  return body.history
    .filter(
      (turn): turn is ChatHistory =>
        (turn?.role === "user" || turn?.role === "assistant") &&
        typeof turn?.content === "string",
    )
    .slice(-CHAT_HISTORY_LIMIT)
    .map((turn) => ({
      role: turn.role,
      content: turn.content.slice(0, MAX_INPUT_CHARS),
    }));
}