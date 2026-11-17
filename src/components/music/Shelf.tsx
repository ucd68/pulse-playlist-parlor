import type { ReactNode } from "react";

/** A titled row of cards: horizontal scroll on phones, grid on larger screens. */
export function Shelf({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-end justify-between gap-4 px-2.5">
        <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
        {action}
      </div>
      <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] md:overflow-visible md:px-0 md:[&>*:nth-child(n+13)]:hidden">
        {children}
      </div>
    </section>
  );
}
