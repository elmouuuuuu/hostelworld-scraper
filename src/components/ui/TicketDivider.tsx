/**
 * A dashed "tear line" divider, evoking the perforation between sections
 * of a paper boarding pass / ticket stub. Separates the three logical
 * sections of the search form (Destinations / Filters / Departure).
 */
export function TicketDivider() {
  return (
    <div className="my-7 flex items-center gap-3" aria-hidden="true">
      <span className="h-2 w-2 shrink-0 rounded-full bg-paper-50 ring-1 ring-inset ring-ink-200" />
      <span className="h-0 flex-1 border-t-2 border-dashed border-ink-200" />
      <span className="h-2 w-2 shrink-0 rounded-full bg-paper-50 ring-1 ring-inset ring-ink-200" />
    </div>
  );
}
