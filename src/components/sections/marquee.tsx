import { cn } from "@/lib/utils";

/**
 * Subtle infinite horizontal marquee of project names. CSS-only (no JS): the
 * track holds the items twice and scrolls by -50% on a loop (`marquee-scroll`
 * keyframe in globals.css), so the seam is invisible.
 *
 * Restraint + a11y:
 * - Animates only `transform` (GPU, no layout, no CLS).
 * - `motion-safe:` gated → `prefers-reduced-motion` shows a static, wrapping row.
 * - Pauses on hover (`group-hover` → `animation-play-state: paused`).
 * - Edge fade mask so items dissolve at the container edges.
 * - The duplicated track is `aria-hidden`; screen readers read the items once.
 */
export function Marquee({
  items,
  className,
}: {
  items: readonly string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]",
        className,
      )}
    >
      {/* Static fallback for reduced motion: a centered, wrapping row. */}
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 motion-safe:hidden">
        {items.map((label) => (
          <MarqueeItem key={label} label={label} />
        ))}
      </ul>

      {/* Animated track (motion-safe only). Two identical sequences → -50% loops. */}
      <div className="hidden w-max shrink-0 motion-safe:flex motion-safe:animate-[marquee-scroll_38s_linear_infinite] motion-safe:group-hover:[animation-play-state:paused]">
        <ul className="flex shrink-0 items-center gap-x-10 pr-10">
          {items.map((label) => (
            <MarqueeItem key={label} label={label} />
          ))}
        </ul>
        <ul aria-hidden="true" className="flex shrink-0 items-center gap-x-10 pr-10">
          {items.map((label) => (
            <MarqueeItem key={label} label={label} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function MarqueeItem({ label }: { label: string }) {
  return (
    <li className="font-display text-xl font-semibold whitespace-nowrap text-muted-foreground/60 transition-colors hover:text-foreground">
      {label}
    </li>
  );
}
