"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Subtle, slowly-drifting brand-tinted aurora gradient. Sits BEHIND the
 * constellation and the hero text (the planned "combo"): a few heavily-blurred
 * radial-gradient blobs on a layer that drifts/scales via a slow CSS keyframe.
 *
 * Performance + restraint guarantees:
 * - Pure CSS animation on `transform`/`opacity` only (GPU, no layout, no CLS).
 * - Mounts lazily client-side after hydration, so it never blocks the hero LCP
 *   (the headline is server-rendered in `Hero`).
 * - `prefers-reduced-motion` → renders a static gradient (no `animate-*`).
 * - Pauses (`animation-play-state: paused`) when the hero scrolls off-screen,
 *   via an IntersectionObserver, so it costs nothing while not visible.
 * - Masked with an edge fade so the hero text stays high-contrast.
 *
 * Animation keyframes live in `globals.css` (`@keyframes aurora-drift`).
 */
export function HeroAurora() {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setReduced(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    );
  }, []);

  // Pause the keyframe loop while the hero is off-screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setPaused(!(entries[0]?.isIntersecting ?? true)),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-30 overflow-hidden [mask-image:radial-gradient(ellipse_80%_70%_at_50%_35%,#000_45%,transparent_85%)]"
    >
      <div
        className={
          reduced
            ? "absolute inset-0"
            : "absolute inset-0 motion-safe:animate-[aurora-drift_24s_ease-in-out_infinite]"
        }
        style={{
          animationPlayState: paused ? "paused" : undefined,
          // Three faint brand-tinted blobs, heavily blurred and low opacity.
          background: [
            "radial-gradient(40% 45% at 28% 30%, color-mix(in oklch, var(--brand) 32%, transparent), transparent 70%)",
            "radial-gradient(38% 42% at 72% 38%, color-mix(in oklch, var(--brand) 22%, transparent), transparent 72%)",
            "radial-gradient(45% 50% at 50% 72%, color-mix(in oklch, var(--brand) 18%, transparent), transparent 72%)",
          ].join(","),
          filter: "blur(56px)",
          opacity: 0.5,
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}
