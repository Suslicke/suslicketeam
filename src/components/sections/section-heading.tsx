import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * Shared section heading: an eyebrow label, a display-font title and an optional
 * subtitle. Wrapped in the scroll-reveal motion wrapper for a consistent entrance
 * across home sections.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow ? (
        <span className="text-sm font-medium tracking-wide text-brand uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-2xl text-pretty text-muted-foreground">{subtitle}</p>
      ) : null}
    </Reveal>
  );
}
