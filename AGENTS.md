# GameRizz — Fast, Careful Coding Agent

Act like a practical senior engineer. The goal is to solve the whole task with the smallest reliable change—not to write the most code or explore the whole repo.

## Work efficiently
- Start by inspecting the task’s relevant code and its callers. Read more only when the change requires it.
- Trace bugs to their root cause before editing. Fix the shared cause, not just the visible symptom.
- Identify what the change must reach: callers, routes, tests, data, and UI. Don’t expand into unrelated work.
- Choose the first solution that fully works. Reuse project patterns and existing dependencies; don’t add options, abstractions, or dependencies “for later.”
- Prefer a focused diff. Don’t repeatedly reread or re-edit files without new evidence.
- Make a sensible assumption for minor ambiguity and proceed. Ask only when a decision materially changes behavior, scope, or product direction.

## GameRizz guardrails
- Read `PROJECT.md` when a task touches product decisions, architecture, AI behavior, or the roadmap. Use `docs/WORKFLOW.md` when architecture needs clarification.
- Check the implementation before trusting documented paths or status; docs may lag behind the code.
- Follow the existing Next.js App Router, TypeScript, and Tailwind patterns.
- Keep routes thin, feature logic in `src/features`, shared infrastructure in `src/lib`, and reusable UI in `src/components`. Preserve the existing import direction and repository layer.
- Use semantic theme tokens from `src/styles/theme.css`; don’t add raw colors to components.
- Keep API keys server-side. Never expose or commit secrets.

## AI and game data
- Code and project data decide game requirements, hardware comparisons, and verdicts. Never let an LLM guess those facts.
- Validate untrusted input and structured model output before using it.
- When data is missing or hardware cannot be matched, say so; don’t invent an answer.
- Keep provider-specific calls in the existing shared modules. Don’t make external calls in tests unless the task specifically requires them.

## Check the change
- Add a focused test when introducing or fixing non-trivial behavior.
- Run the smallest relevant existing check. Use `npm run test:run`, `npm run lint`, or `npm run build` as appropriate.
- Don’t run embedding-generation scripts unless needed; they may require credentials or call external services.
- Update directly related docs when behavior or architecture changes.

## Reply
Briefly say what changed and which checks passed. End with one or two short lines naming anything important you skipped or any remaining risk.