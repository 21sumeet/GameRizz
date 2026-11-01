# GameRizz — Workflow & Architecture Diagrams

This document explains **how GameRizz works** using diagrams first, then short plain-language notes. You do not need to read the code to understand it.

Read it in this order:

1. [The 30-second overview](#1-the-30-second-overview) — what the app does at a glance
2. [Layered architecture](#2-layered-architecture) — the one rule that keeps the code clean
3. [Runtime flows](#3-runtime-flows) — step-by-step journeys through the app
4. [Data model](#4-data-model) — what data exists and how it connects
5. [Roadmap](#5-roadmap--what-exists-vs-what-is-planned) — what is built today vs planned

---

## How to read the diagrams

| Element | Meaning |
|---|---|
| Rectangle | A piece of code (page, component, service, repository) |
| Diamond | A decision (a branch in logic) |
| Rounded shape | A start / end point or an external system |
| Solid arrow | "Calls" or "imports" |
| Dotted arrow | Planned / not built yet |
| 🟢 green note | Exists in the codebase **today** |
| 🟡 amber note | Planned for a later phase |

> **Status:** this document describes the current **Phase 0** state plus the target design. Every diagram labels which parts are built and which are not.

---

## 1. The 30-second overview

GameRizz is a web app for PC gamers with exactly two features:

1. **Chatbot** — "Can my PC run this game?" (Feature 2)
2. **Recommender** — "I liked these games, what should I play next?" (Feature 1)

The chatbot is the entry point users see today.

```mermaid
flowchart LR
    User["🧑 PC Gamer<br/>in a browser"]

    subgraph App["GameRizz — Next.js app"]
        direction TB
        UI["Pages + React components<br/>chat UI, results UI"]
        Svc["Feature services<br/>business logic"]
        Lib["Shared lib<br/>repositories, AI client, utils"]
        Data["Data layer<br/>JSON files today, Postgres later"]
    end

    Ext["☁️ External services<br/>Groq API, Steam API"]

    User -->|"types a question"| UI
    UI -->|"calls service"| Svc
    Svc -->|"reads / writes"| Lib
    Lib -->|"reads / writes"| Data
    Lib -.->|"LLM + embeddings"| Ext
    Svc -->|"verdict + reply"| UI
    UI -->|"streams answer"| User
```

**The mental model:** the user talks to the UI. The UI never does the thinking. A *feature service* does the thinking, using *shared libraries* for data access and AI calls. Verdicts come from **code + real data**, never from the LLM's memory.

---

## 2. Layered architecture

This is the most important rule in the project. Code may only import **downward**:

```mermaid
flowchart TD
    subgraph L1["Layer 1 — app/ (thin routes and pages)"]
        direction LR
        Layout["layout.tsx"]
        Home["page.tsx"]
        Rec["recommend/page.tsx"]
        Api["api/chat/route.ts 🟡"]
    end

    subgraph L2["Layer 2 — features/ (all real logic)"]
        direction LR
        ChatF["chat/"]
        CheckerF["checker/ 🟡"]
        RecF["recommender/ 🟡"]
    end

    subgraph L3["Layer 3 — components/ (dumb, reusable UI)"]
        direction LR
        UIp["ui/ — Button, Card, Input"]
        Layp["layout/ — Navbar, PageShell"]
    end

    subgraph L4["Layer 4 — lib/ + config/ + styles/"]
        direction LR
        Repo["data/ repositories"]
        Ai["ai/ — Groq client"]
        Steam["steam/ client 🟡"]
        Const["config/ constants"]
        Theme["styles/ theme.css"]
    end

    L1 --> L2
    L1 --> L3
    L1 --> L4
    L2 --> L3
    L2 --> L4
    L3 --> L4

    L2 -. "❌ never" .-> L2
    L4 -. "❌ never" .-> L2
    L4 -. "❌ never" .-> L1
```

**The four rules this diagram encodes:**

| Rule | Why it matters |
|---|---|
| Routes are **thin** | `app/` only parses input, calls a service, returns the result |
| Features **own their logic** | Adding a feature = adding a folder, not editing ten files |
| Features **never import each other** | Sharing happens through `lib/` or a repository, never directly |
| `lib/` **never imports upward** | Infrastructure stays generic and reusable |

**Why bother?** Because it makes swapping pieces cheap. When JSON storage becomes PostgreSQL, only `lib/data/` changes. When Groq is replaced by another provider, only `.env` (key, base URL, model) changes. No feature or UI code is touched.

---

## 3. Runtime flows

### 3a. Chat flow — 🟢 what is running right now (Phase 0)

The UI, layout, theme, and message loop all work today. The "brain" is a placeholder so the screen is testable before any API key exists.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as ChatWindow<br/>client component
    participant I as ChatInput
        participant S as getReply<br/>chat/service.ts

    U->>I: types "can I run Elden Ring? i5 10400, 16GB, GTX 1650"
    I->>I: Enter pressed, text is trimmed
    I->>W: onSend(text)
    W->>W: append user bubble, set isThinking = true
    W->>S: await getReply(text)
    Note over S: Phase 0: canned Gen Z reply<br/>Phase 2: real Groq call
    S-->>W: reply string
    W->>W: append assistant bubble, isThinking = false
    W-->>U: scrolls to newest message
```

Everything here is **client-side**. No network call, no API key, no cost. That is deliberate: the chat shell was proven working before adding an LLM.

---

### 3b. Chat flow — 🟡 the Phase 2 target (real AI + tools)

Once the checker exists, the service moves behind an API route so the API key stays on the server.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as ChatWindow
    participant R as /api/chat/route.ts
    participant S as chat/service.ts
    participant L as Groq<br/>OpenAI-compatible API
    participant T as Tools<br/>extractSpecs, checkGame
        participant C as Checker service

    U->>UI: sends game name + PC specs
    UI->>R: POST { messages }
    R->>S: run chat loop
    S->>L: system prompt (Gen Z persona) + messages
    L-->>S: tool call: extractSpecs(text)
    S->>T: validate arguments with Zod
    T-->>S: { gameName, cpu, gpu, ramGB }
    S->>T: tool call: checkGame(specs)
    T->>C: checkGame(specs)
    C-->>T: Verdict (from real data, not the LLM)
    T-->>S: Verdict JSON
    S->>L: tool result
    L-->>S: streamed Gen Z explanation
    S-->>R: token stream
    R-->>UI: streamed tokens
    UI-->>U: message renders progressively
```

**The key idea:** the LLM is used **twice** for language (understand the request, explain the answer) and **never** for the verdict. The verdict is computed by plain TypeScript.

---

### 3c. Requirement checker — 🟡 the core logic (Phase 2)

This is the app's most important flow. It follows the principle **"LLM for language, code for facts."**

```mermaid
flowchart TD
    Start(["User: 'can I run X? here are my specs'"]) --> Extract["LLM extracts structured data<br/>gameName, cpu, gpu, ramGB, storageGB"]
    Extract --> Valid{"Zod validation<br/>passes?"}
    Valid -->|"No"| AskAgain["Bot asks the user to rephrase<br/>(in persona, no crash)"]
    Valid -->|"Yes"| Lookup["getRequirements(gameName)<br/>lookup chain"]

    Lookup --> J{"Found in<br/>games.json?"}
    J -->|"Yes"| Req["Requirements: min + recommended"]
    J -->|"No"| S{"Found on<br/>Steam API?"}
    S -->|"Yes"| Messy["Messy HTML text<br/>'Intel Core i5-3570K or AMD FX-8310'"]
    Messy --> Struct["LLM structured extraction<br/>with Zod schema"]
    Struct --> Cache["Cache in repository<br/>source: steam"]
    Cache --> Req
    S -->|"No"| NoGame["Reply: cannot find specs<br/>🚫 never guess"]
    Struct -->|"Fails validation"| NoGame

    Req --> Bench["Look up benchmark scores<br/>normalize names first<br/>'NVIDIA GeForce RTX 3060 12GB' → 'RTX 3060'"]
    Bench --> Known{"All hardware<br/>recognized?"}
    Known -->|"No"| Unknown["Reply: ask user to double-check<br/>their chip name"]
    Known -->|"Yes"| Compare["compare.ts<br/>deterministic, pure, unit-tested"]
    Compare --> Verdict["Verdict object"]
    Verdict --> Explain["LLM explains the verdict<br/>in Gen Z tone, using only<br/>the data code returned"]
    Explain --> Done(["User sees: verdict, reasons, tip"])
```

**Why the verdict is code, not AI:** LLMs hallucinate hardware numbers. A deterministic comparison is testable, reproducible, and honest. The LLM only turns the result into friendly words.

---

### 3d. Verdict decision table — 🟡 (what `compare.ts` produces)

```mermaid
flowchart TD
    V(["compare(user, requirements)"]) --> Min{"Meets<br/>minimum?"}
    Min -->|"No"| Wont["wont_run<br/>'you're cooked'"]
    Min -->|"Yes"| Rec{"Meets<br/>recommended?"}
    Rec -->|"Yes"| Well["runs_well<br/>'easy W'"]
    Rec -->|"No"| Low["runs_low<br/>'runs, but drop to low settings'"]

    Wont --> Out["Verdict<br/>+ checks per component<br/>+ reasons[]"]
    Low --> Out
    Well --> Out
```

Each component (CPU, GPU, RAM, storage) is checked separately, so the bot can say *"GPU's fine, RAM is the bottleneck"* instead of a vague yes/no.

---

### 3e. Recommender — 🟡 Phase 1

Two separate steps: a **one-time** embedding generation, then fast lookups at query time.

```mermaid
flowchart LR
    subgraph Offline["🕐 One-time setup — scripts/generate-embeddings.ts"]
        direction TB
        G1["games.json<br/>50–100 games"] --> Blob["Build text blob<br/>name + genres + tags + description"]
        Blob --> Emb["Embedding model (TBD)<br/>text → vector of numbers"]
        Emb --> Store["data/embeddings.json<br/>+ model name"]
    end

    subgraph Online["⚡ At query time — features/recommender/service.ts"]
        direction TB
        Q["User: 'I loved Hades and Celeste'"] --> QB["Same embedding model<br/>text → query vector"]
        QB --> Cos["cosineSimilarity()<br/>against every stored vector"]
        Store -.-> Cos
        Cos --> Top["topN(), excluding games<br/>the user already named"]
        Top --> Cards["Results UI<br/>game cards + 'why this matches'"]
    end
```

**The two concepts, in one line each:**

- **Embedding** — a model turns text into a list of numbers (a vector). Texts with similar *meaning* produce vectors that point in similar directions.
- **Cosine similarity** — a number from $-1$ to $1$ measuring the angle between two vectors. Close to $1$ means semantically similar. We compute it in plain JS first:

$$
\cos(\mathbf{a},\mathbf{b}) = \frac{\mathbf{a} \cdot \mathbf{b}}{\lVert \mathbf{a} \rVert \, \lVert \mathbf{b} \rVert}
= \frac{\sum_{i=1}^{n} a_i b_i}{\sqrt{\sum_{i=1}^{n} a_i^2} \; \sqrt{\sum_{i=1}^{n} b_i^2}}
$$

**Rule:** the embedding model used for games and for queries must be identical, which is why the model name is stored next to the vectors.

---

## 4. Data model

```mermaid
erDiagram
    GAME ||--|| REQUIREMENTS : "has"
    GAME ||--|| EMBEDDING : "has"
    REQUIREMENTS ||--|| HARDWARE_SPEC : "minimum"
    REQUIREMENTS ||--|| HARDWARE_SPEC : "recommended"
    HARDWARE_SPEC ||--o{ GPU_BENCHMARK : "resolved via name"
    HARDWARE_SPEC ||--o{ CPU_BENCHMARK : "resolved via name"
    USER_SPECS ||--o{ GPU_BENCHMARK : "resolved via name"
    USER_SPECS ||--o{ CPU_BENCHMARK : "resolved via name"
    GAME ||--o{ VERDICT : "produces"

    GAME {
        string id PK
        string name
        string[] genres
        string[] tags
        string description
        string source "manual | steam"
    }
    REQUIREMENTS {
        string gameId FK
    }
    HARDWARE_SPEC {
        string cpu
        string gpu
        number ramGB
        number storageGB
    }
    EMBEDDING {
        string gameId FK
        number[] vector
        string model
    }
    GPU_BENCHMARK {
        string name PK
        number score
    }
    CPU_BENCHMARK {
        string name PK
        number score
    }
    USER_SPECS {
        string cpu
        string gpu
        number ramGB
        number storageGB
    }
    VERDICT {
        string verdict "runs_well | runs_low | wont_run"
        string[] reasons
    }
```

**Where each piece lives:**

| Data | File today | Later |
|---|---|---|
| Games + requirements | `data/games.json` | PostgreSQL |
| Embedding vectors | `data/embeddings.json` | PostgreSQL + pgvector |
| GPU scores | `data/gpu-benchmarks.json` | PostgreSQL |
| CPU scores | `data/cpu-benchmarks.json` | PostgreSQL |

Nobody reads these files directly except the repository implementations in `lib/data/json/`. That is what makes the database migration a one-file change.

---

## 5. Folder map — which box does what

```mermaid
flowchart TD
    Root["gamerizz/"]

    Root --> Src["src/"]
    Root --> Dataf["data/ 🟡<br/>JSON database"]
    Root --> Scripts["scripts/ 🟡<br/>one-off CLI tasks"]
    Root --> Docs["docs/<br/>this document"]

    Src --> Appd["app/<br/>thin routes only"]
    Src --> Feat["features/<br/>all real logic"]
    Src --> Comp["components/<br/>reusable UI"]
    Src --> Libd["lib/<br/>infrastructure"]
    Src --> Conf["config/<br/>constants + env"]
    Src --> Styles["styles/<br/>theme.css + globals.css"]

    Appd --> A1["layout.tsx 🟢"]
    Appd --> A2["page.tsx 🟢<br/>chat screen"]
    Appd --> A3["recommend/page.tsx 🟢<br/>stub"]
    Appd --> A4["api/chat/route.ts 🟡"]

    Feat --> F1["chat/ 🟢<br/>components, service, persona 🟡, tools 🟡"]
    Feat --> F2["checker/ 🟡<br/>compare, normalize, requirements/"]
    Feat --> F3["recommender/ 🟡<br/>similarity, service"]

    Comp --> C1["ui/ 🟢<br/>Button, Card, Input"]
    Comp --> C2["layout/ 🟢<br/>Navbar, PageShell"]

    Libd --> L1["ai/ 🟡<br/>client, embeddings, structured"]
    Libd --> L2["data/ 🟡<br/>repositories"]
    Libd --> L3["steam/ 🟡<br/>client"]
```

🟢 = exists today · 🟡 = planned

---

## 6. Roadmap — what exists vs what is planned

```mermaid
flowchart LR
    P0["✅ Phase 0<br/>Setup<br/><br/>theme tokens, UI primitives,<br/>layout shell, chat UI,<br/>placeholder service"]
    P1["⬜ Phase 1<br/>Recommender<br/><br/>game data, embeddings,<br/>cosine similarity, results UI"]
    P2["⬜ Phase 2<br/>Checker<br/><br/>benchmarks, compare logic,<br/>tools, real chat"]
    P25["⬜ Phase 2.5<br/>Fallback<br/><br/>Steam client, structured<br/>extraction, caching"]
    P3["⬜ Phase 3<br/>Database<br/><br/>Postgres + pgvector,<br/>same interfaces"]

    P0 --> P1 --> P2 --> P25 --> P3
```

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Themed, structured app with working chat shell | ✅ done |
| 1 | Game recommender with real embeddings | not started |
| 2 | Deterministic "can I run it?" checker + real chat | not started |
| 2.5 | Steam fallback for games outside our dataset | not started |
| 3 | PostgreSQL + pgvector behind existing interfaces | not started |

---

## 7. Glossary — plain-language AI terms used here

| Term | Plain meaning |
|---|---|
| **LLM** | Large Language Model — the text-in, text-out AI (here: Groq, `qwen/qwen3.8-27b`) |
| **Embedding** | Text converted into a list of numbers, so "similar meaning" becomes "similar numbers" |
| **Vector** | That list of numbers |
| **Cosine similarity** | A $[-1, 1]$ score for how closely two vectors point in the same direction |
| **System prompt** | Standing instructions that shape the AI's personality (the Gen Z persona lives in one file) |
| **Tool calling** | Letting the model ask our code to run a function, e.g. "extract these specs" or "check this game" |
| **Structured extraction** | Forcing the model to return typed JSON that matches a schema, instead of free text |
| **Streaming** | Sending the reply word-by-word so it renders as it is written |
| **Zod** | A TypeScript library that validates data shape at runtime — used for env vars, API input, and AI output |
| **Repository** | An interface that hides where data lives, so JSON can become Postgres without touching features |
| **Hallucination** | The model confidently stating something false — the reason verdicts are computed by code, never by AI |

---

## 8. The one-sentence summary of the whole architecture

> **The UI talks, the AI translates, the code decides, and the repository hides where the data lives.**

Every diagram above is a zoom-in on some part of that sentence.