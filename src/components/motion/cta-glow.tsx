import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Wraps the primary messenger CTA with a subtle, slowly-breathing brand-tinted
 * glow behind it. Pure CSS (`@keyframes cta-glow`, transform + opacity only),
 * `motion-safe:` gated so it's static under `prefers-reduced-motion`. Tasteful —
 * a soft halo, not a flashing badge. The glow is `aria-hidden` and
 * non-interactive; the CTA itself sits above it.
 */
export function CtaGlow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex isolate", className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-2 -z-10 rounded-full bg-brand/40 blur-lg motion-safe:animate-[cta-glow_4.5s_ease-in-out_infinite]"
      />
      {children}
    </span>
  );
}
