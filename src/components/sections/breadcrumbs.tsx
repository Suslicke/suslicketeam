import { ChevronRight } from "lucide-react";

import { Link } from "@/i18n/routing";

export interface Crumb {
  /** Locale-less href, e.g. "/services". Omit for the current (last) page. */
  href?: string;
  label: string;
}

/**
 * Visual breadcrumb trail rendered as a nav landmark. The last crumb is the
 * current page (no link, marked aria-current). Mirror the same items into
 * `breadcrumbLd` for the JSON-LD graph.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="text-foreground">
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight aria-hidden="true" className="size-3.5 opacity-60" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
