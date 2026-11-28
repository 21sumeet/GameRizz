import { SectionHeading } from "./section-heading";

export function CatalogStrip({
  games,
  total,
}: {
  games: { id: string; name: string }[];
  total: number;
}) {
  return (
    <section id="catalog" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        index="03"
        label="Catalog"
        title={`${total} games, checked against real requirements.`}
      >
        A sample of what is in there. If a game is not in the catalog, we look it
        up on Steam and say so — we do not quietly make up numbers.
      </SectionHeading>

      <ul className="mt-10 flex flex-wrap gap-2">
        {games.map((game) => (
          <li
            key={game.id}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted"
          >
            {game.name}
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-xl border-t border-border pt-5 text-xs leading-relaxed text-muted">
        Named a game we do not have requirements for? We say that plainly instead
        of guessing a verdict.
      </p>
    </section>
  );
}