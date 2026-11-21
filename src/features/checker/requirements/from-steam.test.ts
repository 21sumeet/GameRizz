import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/client", () => ({ chatComplete: vi.fn() }));

import { chatComplete } from "@/lib/ai/client";
import { findGameOnSteam } from "./from-steam";

const mockedChat = vi.mocked(chatComplete);

const BLOCKS = {
  minimum: { cpu: "Intel Core i5-8400", gpu: "GTX 1060", ramGB: 12, storageGB: 60 },
  recommended: { cpu: "Intel Core i7-8700K", gpu: "GTX 1070", ramGB: 16, storageGB: 60 },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

/** Answer the name prompt, then the specs prompt, with the given specs JSON. */
function chatReturns(nameReply: string, specsReply: string) {
  mockedChat.mockImplementation(async (messages) => {
    const system = messages[0]?.content ?? "";
    return system.includes("video game") ? nameReply : specsReply;
  });
}

function stubSteam(options: { items?: unknown[]; details?: unknown }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/storesearch/")) {
        return jsonResponse({ items: options.items ?? [] });
      }
      if (url.includes("/appdetails?")) {
        return jsonResponse(options.details ?? {});
      }
      return new Response("not found", { status: 404 });
    }),
  );
}

function appDetails(appId: number, name: string, minimum?: string, recommended?: string) {
  return {
    [String(appId)]: {
      success: true,
      data: {
        name,
        release_date: { date: "25 Feb, 2022" },
        pc_requirements: { minimum, ...(recommended ? { recommended } : {}) },
      },
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("findGameOnSteam", () => {
  it("returns a checkable game when both blocks are readable", async () => {
    chatReturns("ELDEN RING", JSON.stringify(BLOCKS));
    stubSteam({
      items: [{ id: 1245620, name: "ELDEN RING" }],
      details: appDetails(1245620, "ELDEN RING", "<li>Processor: x</li>", "<li>Processor: y</li>"),
    });

    const result = await findGameOnSteam("can my i5 8400 and GTX 1060 run elden ring?");

    expect(result).toEqual({
      status: "found",
      game: { name: "ELDEN RING", releaseYear: 2022, requirements: BLOCKS },
    });
  });

  it("keeps recommended null when Steam only lists a minimum", async () => {
    chatReturns("Stardew Valley", JSON.stringify({ minimum: BLOCKS.minimum, recommended: null }));
    stubSteam({
      items: [{ id: 413150, name: "Stardew Valley" }],
      details: appDetails(413150, "Stardew Valley", "<li>Processor: 2 Ghz</li>"),
    });

    const result = await findGameOnSteam("will stardew valley run on my laptop?");

    expect(result.status).toBe("found");
    if (result.status !== "found") return;
    expect(result.game.requirements.recommended).toBeNull();
  });

  it("reports no-specs when the model returns something unusable", async () => {
    chatReturns("Terraria", "I am sorry, I cannot help with that.");
    stubSteam({
      items: [{ id: 105600, name: "Terraria" }],
      details: appDetails(105600, "Terraria", "<li>Processor: 2.0 GHz</li>"),
    });

    expect(await findGameOnSteam("will terraria run?")).toEqual({ status: "no-specs" });
  });

  it("reports no-specs when Steam has no requirements block", async () => {
    chatReturns("Some Game", JSON.stringify(BLOCKS));
    stubSteam({
      items: [{ id: 999001, name: "Some Game" }],
      details: appDetails(999001, "Some Game"),
    });

    expect(await findGameOnSteam("will some game run?")).toEqual({ status: "no-specs" });
  });

  it("reports miss when Steam search finds nothing", async () => {
    chatReturns("Totally Made Up Game", JSON.stringify(BLOCKS));
    stubSteam({ items: [] });

    expect(await findGameOnSteam("will totally made up game run?")).toEqual({ status: "miss" });
  });

  it("reports miss when the message names no game, without calling Steam", async () => {
    chatReturns("NONE", JSON.stringify(BLOCKS));
    stubSteam({ items: [{ id: 999002, name: "Whatever" }] });

    expect(await findGameOnSteam("is my pc good enough?")).toEqual({ status: "miss" });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("reports miss when the model call throws", async () => {
    mockedChat.mockRejectedValue(new Error("Groq 502"));

    expect(await findGameOnSteam("will elden ring run?")).toEqual({ status: "miss" });
  });
});