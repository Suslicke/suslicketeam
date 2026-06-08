"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * Count-up display for a fact value. Parses a leading number and keeps any
 * trailing/leading non-digit suffix or prefix (e.g. "8+" → counts 0→8, then "+";
 * "~12k" keeps "~" and "k"). Purely numeric-free values (e.g. "Недели", "Фикс")
 * are rendered as-is with a gentle fade — there's nothing to count.
 *
 * - Animates only once, when scrolled into view (`useInView`, `once`).
 * - `prefers-reduced-motion` → shows the final value instantly, no animation.
 * - No layout shift: the element reserves its final text from the first paint
 *   only via opacity (the number text width changes are within the same line).
 */
export function CountUp({
  value,
  className,
  duration = 1.4,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  // Split "8+" → { prefix: "", number: 8, suffix: "+" }. If no number is found,
  // `number` is null and we just render the original string.
  const match = value.match(/^(\D*?)(\d[\d\s.,]*)(.*)$/);
  const prefix = match?.[1] ?? "";
  const numericRaw = match?.[2] ?? "";
  const suffix = match?.[3] ?? "";
  const target = numericRaw ? Number(numericRaw.replace(/[\s,]/g, "")) : null;
  const decimals = numericRaw.includes(".")
    ? numericRaw.split(".")[1]?.length ?? 0
    : 0;

  const [display, setDisplay] = useState<string>(() =>
    target !== null && !reduce ? formatNumber(0, decimals) : numericRaw,
  );

  useEffect(() => {
    if (target === null || reduce || !inView) return;
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(formatNumber(v, decimals)),
    });
    return () => controls.stop();
  }, [target, reduce, inView, duration, decimals]);

  // Non-numeric value: render verbatim (fade handled by the wrapping reveal).
  if (target === null) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      <span className="tabular-nums">{display}</span>
      {suffix}
    </span>
  );
}

function formatNumber(v: number, decimals: number): string {
  return decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
}
