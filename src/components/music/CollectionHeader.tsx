import type { ReactNode } from "react";

/** Big gradient header for Liked Songs and playlist pages. */
export function CollectionHeader({
  cover,
  kind,
  title,
  meta,
}: {
  cover: ReactNode;
  kind: string;
  title: string;
  meta: ReactNode;
}) {
  return (
    <header className="flex flex-col items-center gap-6 px-4 pt-10 pb-6 text-center md:flex-row md:items-end md:px-8 md:pt-16 md:text-left">
      <div className="w-48 shrink-0 shadow-elevated md:w-56">{cover}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground/80">{kind}</p>
        <h1 className="mt-1 line-clamp-2 text-4xl font-extrabold break-words md:text-6xl lg:text-7xl">{title}</h1>
        <div className="mt-4 text-sm text-muted-foreground">{meta}</div>
      </div>
    </header>
  );
}
