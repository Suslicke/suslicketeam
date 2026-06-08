import { cn } from "@/lib/utils";

/**
 * Faint brand-tinted ambient glow for depth between sections. Pure decorative
 * CSS — a single heavily-blurred radial gradient, no interaction, no animation,
 * no layout impact (absolutely positioned, `-z-10`, `aria-hidden`). Renders
 * inside a zero-height relative wrapper so it never affects flow or causes CLS.
 *
 * `position` nudges the glow toward one edge so it reads as light bleeding
 * between two stacked sections rather than a spotlight.
 */
export function SectionGlow({
  position = "center",
  className,
}: {
  position?: "left" | "center" | "right";
  className?: string;
}) {
  const x = position === "left" ? "25%" : position === "right" ? "75%" : "50%";

  return (
    <div aria-hidden="true" className="relative h-0">
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 -z-10 h-[28rem] w-[44rem] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[120px]",
          className,
        )}
        style={{
          background: `radial-gradient(closest-side, color-mix(in oklch, var(--brand) 14%, transparent), transparent)`,
          left: x,
        }}
      />
    </div>
  );
}
