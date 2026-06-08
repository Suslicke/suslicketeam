import { ArrowRight, ExternalLink, Lock } from "lucide-react";

import { CursorGlow } from "@/components/motion/cursor-glow";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

export interface CaseCardProps {
  slug: string;
  title: string;
  result: string;
  tags: readonly string[];
  year: number;
  url: string;
  detailsLabel: string;
  liveLabel: string;
  /** Confidential case — renders an "Под NDA" badge instead of a live link. */
  nda?: boolean;
  /** Localized label for the NDA badge (e.g. "Под NDA"). */
  ndaLabel?: string;
}

/**
 * Shared portfolio case card: title, year, a one-line result, tech tags, an
 * internal link to the detail page and an external live link. Presentational —
 * the caller passes already-localized copy.
 */
export function CaseCard({
  slug,
  title,
  result,
  tags,
  year,
  url,
  detailsLabel,
  liveLabel,
  nda,
  ndaLabel,
}: CaseCardProps) {
  const isConfidential = nda || !url;
  return (
    <Card className="h-full gap-4 p-6 transition-all hover:-translate-y-1 hover:ring-brand/40">
      <CursorGlow className="flex flex-col gap-4">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <h3 className="font-display text-xl font-semibold">{title}</h3>
          <span className="shrink-0 text-xs text-muted-foreground">{year}</span>
        </div>

        <p className="relative z-10 text-sm text-muted-foreground">{result}</p>

        <ul className="relative z-10 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-border/70 px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="relative z-10 mt-auto flex items-center gap-4 pt-2 text-sm font-medium">
          <Link
            href={`/cases/${slug}`}
            className="inline-flex items-center gap-1 text-brand hover:underline"
          >
            {detailsLabel}
            <ArrowRight className="size-4" />
          </Link>
          {isConfidential ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Lock className="size-3.5" />
              {ndaLabel}
            </span>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              {liveLabel}
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </CursorGlow>
    </Card>
  );
}
