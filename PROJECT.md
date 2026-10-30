# GameRizz: Project Spec

**GameRizz** is a gaming assistant for PC gamers: a game recommender plus a "can my PC run it?" chatbot that talks in Gen Z tone.

> This file is the single source of truth for the project. Any coding agent working on this repo must read it fully before writing code. Items marked **DECIDED** are final unless the owner changes them. Items marked **OPEN** need confirmation.

---

## 1. Project Overview

A web app for PC gamers with exactly **two features** (nothing else for now):

1. **Game Recommendation**: the user tells us what games or genres they like, and we recommend similar games using **text embeddings and vector similarity**.
2. **System Requirement Checker**: the user gives a **game name** and their **PC specs** in a chatbot, and the bot tells them whether the game will run (and how well).

The chatbot talks in a **Gen Z tone**.

## 2. Owner Context and Learning Goals (IMPORTANT for agents)

- The owner is a **JavaScript developer** building this project **to learn AI engineering**, not only to ship it.
- We go **from 0 to 1**, start small, and grow while learning. The codebase must stay organized as it grows from simple to complex.
- **Agent behavior expected:**
  - Explain each new concept briefly when introducing it (what it is, why we use it).
  - Prefer simple, readable code over clever abstractions.
  - Build from scratch first (e.g. cosine similarity in plain JS) before adopting heavy tools (vector DB).
  - Work in small steps, one phase at a time. Do not jump ahead to later phases.
  - Add short comments explaining AI-specific parts (embeddings, tool calling, structured extraction).
  - Follow the architecture rules in Section 6 strictly. Never dump code in random places.

## 3. Decisions Summary

| Area | Decision | Status |
|---|---|---|
| Project name | **GameRizz** | DECIDED |
| Framework | **Next.js (App Router)**, one codebase for frontend and backend API routes | DECIDED |
| Language | **TypeScript** (strict mode) | DECIDED (assumed, owner has not objected) |
| Styling | **Tailwind CSS** with a **semantic design-token theme** (Section 5) | DECIDED |
| Palette | Jet black, muted moss green, neon emerald green | DECIDED (changeable in one file) |
| Theme mode | Dark-first (palette is dark based). Light mode not planned | DECIDED |
| AI provider | **Google Gemini** for both chat and embeddings (free tier) | DECIDED |
| AI SDK | Vercel AI SDK (streaming and tool calling), or Google's SDK directly | DECIDED (agent may pick the simpler one) |
| Data storage (now) | **JSON files only**, behind a repository layer | DECIDED |
| Data storage (later) | **PostgreSQL**, with **pgvector** preferred over a separate vector DB | Phase 3 |
| Vector search (now) | Plain JS **cosine similarity** over embeddings stored in JSON | DECIDED |
| Platform scope | **PC games only** | DECIDED |
| Initial dataset | Hand-curated **50 to 100 PC games** | DECIDED |
| Chatbot tone | **Gen Z** | DECIDED |
| Validation | **Zod** for env, LLM output, API inputs | DECIDED |
| Testing | **Vitest** for pure logic (checker, similarity) | DECIDED |

Notes:
- Gemini free-tier limits and model names change over time. **Verify current limits and model names in official Google docs before coding.**
- Optional later alternative for free, offline embeddings: **Transformers.js**.

## 4. Tech Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Vercel AI SDK with the Google Gemini provider
- Zod (validation)
- Vitest (unit tests)
- JSON files in `/data` for now
- Later: PostgreSQL + pgvector, with Prisma or Drizzle

## 5. Theming and Design System (must be easy to change)

### Palette

| Role | Name | Hex |
|---|---|---|
| Base | Jet black | `#000000` |
| Secondary | Muted moss green | `#6d8f63` |
| Accent | Neon emerald green | `#39ff88` |

Note: the owner originally typed `#00000` (5 digits, invalid). It is treated as `#000000`. The owner may prefer a slightly softer black such as `#0a0a0a`; it is a one-line change.

### The rule: components never use raw colors

The palette must be changeable in **one place**, with **zero edits to components**. The design works in two layers:

1. **Raw palette (the only place hex codes exist):** `src/styles/theme.css`
   ```css
   :root {
     /* RAW PALETTE: edit these 3 lines to re-theme the whole site */
     --palette-base: #000000;      /* jet black */
     --palette-secondary: #6d8f63; /* muted moss green */
     --palette-accent: #39ff88;    /* neon emerald green */

     /* SEMANTIC TOKENS: what components actually use (derived from the palette) */
     --color-background: var(--palette-base);
     --color-foreground: #e8f5ec;          /* readable off-white text */
     --color-surface: color-mix(in srgb, var(--palette-base) 92%, var(--palette-secondary));
     --color-border: color-mix(in srgb, var(--palette-secondary) 35%, var(--palette-base));
     --color-muted: var(--palette-secondary);
     --color-primary: var(--palette-accent);
     --color-primary-foreground: var(--palette-base);
     --color-success: var(--palette-accent);
     --color-warning: #f5c542;
     --color-danger: #ff5c5c;
   }
   ```
   The exact derived values can be tuned, but the structure stays: **3 raw colors in, semantic tokens out**.

2. **Semantic Tailwind mapping:** Tailwind config (or Tailwind v4 `@theme`) maps tokens to class names: `bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `border-border`, `bg-primary`, `text-primary-foreground`, and so on.

### Rules for agents
- **Never** write a hex code, `rgb()`, or a Tailwind default color (`bg-green-500`, `text-black`) inside a component. Use only semantic classes (`bg-surface`, `text-primary`).
- **Never** import palette values into TypeScript. If JS needs a color (e.g. for a chart), read the CSS variable.
- To change the look: edit the 3 `--palette-*` lines. To change semantics (e.g. what "surface" means): edit the token block. Components stay untouched.
- Check contrast: text on black must be readable, and neon green on black is for accents and buttons, not long paragraphs.
- Use `next/font` for fonts, and define font choices in the same theme layer.
- Reusable UI primitives (Button, Card, Input, ChatBubble) live in `src/components/ui` and are the only place base styling lives, so restyling is also centralized.

### Look and feel
Dark, gamer aesthetic: black background, moss green for secondary elements and borders, neon emerald for primary actions, highlights, and glow effects. Responsive (mobile first). Chat UI streams responses.

## 6. Architecture and Folder Structure (built to scale)

### Principles
1. **Feature-based organization.** Each feature (`recommender`, `checker`, `chat`) owns its own logic, types, components, and tests. Adding a feature means adding a folder, not editing ten places.
2. **Thin routes.** Files in `src/app` only wire things together: they parse input, call a feature's service, and return the result. No business logic in routes or page files.
3. **Layered, one-directional dependencies.** Code may only import "downward":
   ```
   app (routes/pages)  →  features  →  lib/shared  →  (nothing app-specific)
   ```
   - `app` can import `features`, `components`, `lib`.
   - `features` can import `lib`, `components/ui`, `config`, `types`, and **not other features** (share through `lib` or the repository layer).
   - `lib` never imports from `features` or `app`.
4. **Hide external dependencies behind interfaces.** Gemini, Steam, and the data store each sit behind one small module/interface. The rest of the code never calls them directly. This is what makes "swap JSON for Postgres" and "swap Gemini for another provider" low-risk.
5. **Pure logic stays pure.** Similarity math, requirement comparison, and name normalization are plain functions with no network or file access, so they are easy to test.
6. **One concept per file, small files.** If a file passes ~200 lines or mixes concerns, split it.

### Folder structure

```
gamerizz/
├── PROJECT.md                     # this file
├── .env.example                   # documents required env vars (no secrets)
├── data/                          # JSON "database" (Phase 0 to 2)
│   ├── games.json
│   ├── embeddings.json            # vectors + embedding model name
│   ├── gpu-benchmarks.json
│   └── cpu-benchmarks.json
├── scripts/                       # one-off CLI tasks, run with tsx
│   └── generate-embeddings.ts
├── src/
│   ├── app/                       # Next.js routes ONLY (thin)
│   │   ├── layout.tsx
│   │   ├── page.tsx               # landing
│   │   ├── recommend/page.tsx
│   │   ├── chat/page.tsx
│   │   └── api/
│   │       ├── recommend/route.ts
│   │       └── chat/route.ts
│   │
│   ├── features/                  # all real feature logic lives here
│   │   ├── recommender/
│   │   │   ├── components/        # RecommendForm, GameCard, ResultsGrid
│   │   │   ├── service.ts         # recommendGames(): orchestrates the feature
│   │   │   ├── similarity.ts      # cosineSimilarity, topN (pure)
│   │   │   ├── types.ts
│   │   │   └── recommender.test.ts
│   │   ├── checker/
│   │   │   ├── service.ts         # checkGame(): lookup + compare, returns Verdict
│   │   │   ├── compare.ts         # deterministic comparison (pure)
│   │   │   ├── normalize.ts       # hardware name normalization (pure)
│   │   │   ├── requirements/      # lookup chain
│   │   │   │   ├── index.ts       # getRequirements(): JSON, then Steam, then fail
│   │   │   │   ├── from-json.ts
│   │   │   │   └── from-steam.ts  # Phase 2.5
│   │   │   ├── types.ts
│   │   │   └── checker.test.ts
│   │   └── chat/
│   │       ├── components/        # ChatWindow, ChatBubble, ChatInput
│   │       ├── service.ts         # runs the LLM loop with tools
│   │       ├── tools.ts           # tool definitions (extract specs, check game)
│   │       ├── persona.ts         # Gen Z system prompt (single place)
│   │       └── types.ts
│   │
│   ├── components/
│   │   ├── ui/                    # design-system primitives (Button, Card, Input...)
│   │   └── layout/                # Navbar, Footer, PageShell
│   │
│   ├── lib/                       # shared infrastructure, no feature logic
│   │   ├── ai/
│   │   │   ├── client.ts          # Gemini client setup (single place)
│   │   │   ├── embeddings.ts      # embedText(), embedMany()
│   │   │   └── structured.ts      # generic "extract JSON with Zod schema" helper
│   │   ├── data/                  # repository layer (see below)
│   │   │   ├── games.repository.ts
│   │   │   ├── benchmarks.repository.ts
│   │   │   └── json/              # JSON implementations (swap for Postgres later)
│   │   ├── steam/
│   │   │   └── client.ts          # Steam API wrapper (Phase 2.5)
│   │   └── utils/                 # small generic helpers
│   │
│   ├── config/
│   │   ├── env.ts                 # Zod-validated environment variables
│   │   └── constants.ts           # app-wide constants (top-N size, model names)
│   │
│   ├── types/                     # shared domain types (Game, PCSpecs, Verdict)
│   └── styles/
│       ├── theme.css              # the ONLY place colors are defined
│       └── globals.css
└── tests/                         # optional cross-feature tests
```

Agents may adjust names slightly but must keep: **thin routes, feature folders, a repository layer, external services isolated in `lib`, and a single theme file.**

### Repository layer (the key to scaling from JSON to Postgres)

Features never read JSON files directly. They call a repository interface:

```ts
// src/lib/data/games.repository.ts
export interface GamesRepository {
  getAll(): Promise<Game[]>;
  findByName(name: string): Promise<Game | null>;
  save(game: Game): Promise<void>;
  getEmbeddings(): Promise<GameEmbedding[]>;
}
```

- Now: `json/games.json.repository.ts` implements it by reading and writing files in `/data`.
- Phase 3: add `postgres/games.pg.repository.ts` implementing the **same interface**, and change one line where the repository is created. No feature code changes.
- The same idea applies to benchmarks.

### Config and environment
- All env vars are read and validated in `src/config/env.ts` using Zod. Nothing else touches `process.env`.
- `.env.example` documents every variable (e.g. `GEMINI_API_KEY`). `.env.local` is gitignored.
- Constants (embedding model name, result count, Steam timeouts) live in `src/config/constants.ts`, not scattered in code.

### Conventions
- File names: `kebab-case.ts`; React components: `PascalCase.tsx`; types and interfaces: `PascalCase`.
- Keep domain types in `src/types` or the feature's `types.ts`. Use Zod schemas as the source of truth where data crosses a boundary, and infer TS types from them.
- Prefer named exports. Keep barrel files (`index.ts`) minimal and only at feature or folder roots.
- Errors: use typed, descriptive errors (e.g. `GameNotFoundError`, `HardwareNotFoundError`) and handle them in the service layer, so routes return clean responses.
- Every pure function in `checker` and `recommender` gets a Vitest test.
- Commit in small steps, one logical change each.

## 7. Feature 1: Game Recommendation

### Goal
Given a user's interests, return similar games. Also the learning ground for **embeddings and vector similarity**.

### How it works
1. Each game has a text blob built from: name, genres, tags, description.
2. That text is turned into a **vector (embedding)** using the Gemini embedding model.
3. Embeddings are **precomputed by `scripts/generate-embeddings.ts`** and stored in `data/embeddings.json` (not computed on every request).
4. At query time (`features/recommender/service.ts`):
   - Embed the user's input (e.g. "I loved Hades and Celeste") the same way, or average the vectors of games they named.
   - Compute **cosine similarity** against every game vector (`similarity.ts`).
   - Return the top N, excluding games the user already named.
5. UI shows game cards with a short "why this matches" line.

### Rules
- Use the **same embedding model** for games and queries. Store the model name next to the embeddings so a mismatch is detectable.
- No vector database yet. Plain JS first.

## 8. Feature 2: System Requirement Checker (Chatbot)

### Core principle
**The LLM understands and talks. Code does the facts.**
The LLM must **never** decide "will it run" from memory and must **never** invent game requirements. Verdicts come from deterministic code comparing real data.

### User input
The user gives only a **game name** and their **PC specs** (CPU, GPU, RAM, optionally storage). Example: "can I run Elden Ring? i5 10400, 16gb ram, gtx 1650". The user does **not** provide the game's requirements. We get those ourselves.

### Flow
1. **LLM extracts** game name and PC specs into structured data (tool calling, Zod schema). (`chat/tools.ts`)
2. **Code looks up the game's requirements** via the lookup chain. (`checker/requirements`)
3. **Code looks up benchmark scores** for the user's and the game's CPU/GPU. (`benchmarks.repository`)
4. **Code compares** and returns a verdict. (`checker/compare.ts`)
5. **LLM explains the verdict** in Gen Z tone, using only the data code returned. (`chat/persona.ts`)

### Game requirements lookup chain
1. **Local JSON** (via `GamesRepository`): fast and trusted.
2. **Steam Store API** (free, no key) if not found:
   - Search Steam for the game, then fetch details (the `appdetails` endpoint) for PC minimum and recommended requirements.
   - **This API is unofficial and undocumented. Verify current endpoints and behavior before coding. It may change or rate-limit.** Keep it isolated in `lib/steam/client.ts`.
3. **Structured extraction:** Steam returns messy HTML text (e.g. "Intel Core i5-3570K or AMD FX-8310"). Use the LLM with a Zod schema (`lib/ai/structured.ts`) to convert it into `cpu`, `gpu`, `ramGB`, `storageGB`. This is a core AI-engineering lesson.
4. **Cache** the result through `GamesRepository.save()` with `source: "steam"`, and generate its embedding so it joins the recommendation pool.
5. **Not found anywhere:** the bot says it can't find specs for that game. **Never guess.**

> **Phase note:** steps 2 to 5 are **Phase 2.5**. Build the JSON-only checker first.

### Hardware benchmark data
Code needs a numeric score per chip to compare "RTX 3050" vs "GTX 1060".
- `data/gpu-benchmarks.json` and `data/cpu-benchmarks.json` map hardware names to scores (PassMark or a similar free source).
- Start with ~40 common GPUs and ~30 common CPUs.
- Normalize names before lookup (`normalize.ts`): case, spacing, "NVIDIA GeForce" prefixes, "6GB" suffixes.
- If a user's chip is not found, the bot asks them to double-check the name or says it can't compare. It must not guess.

### Known limitations (accept for v1)
- Not every PC game is on Steam (Epic and launcher exclusives will miss). A second source (e.g. RAWG) may come later.
- Writing JSON only works locally; hosts like Vercel have read-only filesystems. This is a deliberate reason to move to Postgres in Phase 3, and the repository layer makes that easy.

## 9. Chatbot Persona (Gen Z tone)

- Casual, playful, short sentences, light slang ("lowkey", "no cap", "you're cooked", "easy W"), occasional emojis.
- Keep slang readable and never let the tone hide the verdict.
- Always give the verdict first, then the reason, then a tip if useful (e.g. "drop to low settings", "upgrade RAM").
- Be honest when data is missing, in the same tone. Never fabricate.
- Friendly, never insulting toward the user.
- The persona lives only in `src/features/chat/persona.ts`.

## 10. Data Schemas

### `data/games.json`
```json
[
  {
    "id": "cyberpunk-2077",
    "name": "Cyberpunk 2077",
    "genres": ["RPG", "Open World"],
    "tags": ["Futuristic", "Story Rich", "Singleplayer"],
    "description": "Short description used for embeddings.",
    "requirements": {
      "minimum": { "cpu": "Core i5-3570K", "gpu": "GTX 1060 6GB", "ramGB": 8, "storageGB": 70 },
      "recommended": { "cpu": "Core i7-4790", "gpu": "RTX 2060", "ramGB": 12, "storageGB": 70 }
    },
    "source": "manual"
  }
]
```
- `source` is `"manual"` or `"steam"`.

### `data/embeddings.json`
```json
{
  "model": "<embedding model name>",
  "vectors": { "cyberpunk-2077": [0.012, -0.034] }
}
```

### `data/gpu-benchmarks.json` and `data/cpu-benchmarks.json`
```json
{ "GTX 1060 6GB": 10000, "RTX 3050": 12500, "RTX 3060": 17000 }
```
(Example numbers only. Use real scores from a free benchmark source.)

### User PC specs (LLM-extracted, Zod-validated)
```ts
{ cpu: string; gpu: string; ramGB: number; storageGB?: number }
```

### Verdict (returned by code)
```ts
{
  verdict: "runs_well" | "runs_low" | "wont_run";
  checks: { component: "cpu" | "gpu" | "ram" | "storage"; passesMin: boolean; passesRec: boolean }[];
  reasons: string[];
}
```

## 11. Phased Roadmap

Work **one phase at a time**, confirming with the owner before moving on.

- **Phase 0: Setup.** Next.js + TypeScript (strict) + Tailwind, full folder skeleton from Section 6, `theme.css` with the palette and semantic tokens, Tailwind token mapping, base UI primitives (Button, Card, Input), layout shell and navbar, `config/env.ts`, `.env.example`, Vitest setup. Result: an empty but properly structured, correctly themed app.
- **Phase 1: Recommender.**
  1. Curate the 50 to 100 game dataset (with requirements).
  2. `GamesRepository` JSON implementation.
  3. `scripts/generate-embeddings.ts`.
  4. `similarity.ts` (cosine, top N) with tests.
  5. Recommender service, API route, and UI.
- **Phase 2: Requirement checker (JSON only).**
  1. Benchmark data and `BenchmarksRepository`.
  2. `normalize.ts` and `compare.ts` with tests.
  3. Chat tools (extract specs, check game), persona prompt, streaming chat UI.
- **Phase 2.5: Internet fallback.** Steam client, structured extraction, caching via repository, auto-embedding of new games.
- **Phase 3: Real database.** Add Postgres + pgvector repository implementations (Prisma or Drizzle). Possibly users and history. Feature code should need no changes.

## 12. Engineering Rules for Agents

1. **Do not invent data.** Requirements and hardware scores come only from our data or Steam, never from LLM memory.
2. **LLM for language, code for logic.** Verdict logic is deterministic and unit-testable without any LLM call.
3. **Validate all LLM structured output** with Zod before using it.
4. **Never commit secrets.** Keys live in `.env.local`, which is gitignored.
5. **Respect the layers** (Section 6): thin routes, features own logic, no feature-to-feature imports, `lib` never imports upward.
6. **Never read or write data files outside the repository layer.**
7. **Never hard-code colors.** Use semantic tokens only (Section 5).
8. **Handle failures gracefully:** unknown game, unknown hardware, rate limit, empty input. Each yields a friendly in-persona message, not a crash.
9. **No premature complexity:** no vector DB, auth, or database before the roadmap reaches them. But keep the seams (repositories, interfaces) in place from day one.
10. **Keep it learnable:** small files, clear names, comments on AI-specific code.
11. **Verify before relying on:** Gemini model names and limits, and the Steam API shape, can change. Check current docs first.

## 13. Open Items Checklist

- [ ] Owner confirms TypeScript (currently assumed)
- [ ] Owner confirms the black shade: `#000000` or a softer `#0a0a0a`
- [ ] Owner creates a Gemini API key (Google AI Studio) and adds it to `.env.local`
- [ ] Choose the benchmark data source and the first list of ~40 GPUs and ~30 CPUs
- [ ] Curate the initial 50 to 100 games list

## 14. Out of Scope (for now)

Console games, user accounts and authentication, saved history, payments, mobile app, multiplayer or social features, price tracking, real-time FPS prediction, light mode, and any database. These may come after Phase 3.
