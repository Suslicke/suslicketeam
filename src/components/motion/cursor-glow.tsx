"use client";

import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Wraps card content with a tasteful brand-tinted radial glow that follows the
 * cursor. Implementation is CSS-driven: on pointermove we only update two CSS
 * custom properties (`--mx`/`--my`) on the element; the visual is the
 * `cursor-glow` utility's `::before` (see globals.css). Cheap — no React state,
 * no re-renders, no layout.
 *
 * Disabled where it shouldn't run: fine-pointer only (skips touch), and the glow
 * itself is opacity-gated on `:hover` so it never shows on keyboard focus or
 * touch. Respects `prefers-reduced-motion` by simply not wiring the listener
 * (the static card is unchanged).
 */
export function CursorGlow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn(
        "cursor-glow h-full motion-reduce:[&::before]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
