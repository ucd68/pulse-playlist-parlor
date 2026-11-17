import { Link } from "@tanstack/react-router";

import { NAV_ITEMS } from "@/components/layout/nav";

export function MobileNav() {
  return (
    <nav className="grid grid-cols-4 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/" }}
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors"
          activeProps={{ className: "text-foreground" }}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
