"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Tasteful scroll-reveal wrapper: fades and slides its children up as they enter
 * the viewport. GPU-friendly (transform + opacity only) and respects
 * `prefers-reduced-motion` — when reduced, it renders content immediately with no
 * animation so nothing is ever hidden behind motion.
 *
 * Uses `whileInView` with `once: true` so each element animates a single time.
 */
export function Reveal({
  children,
  delay = 0,
  as = "div",
  className,
}: {
  children: ReactNode;
  /** Stagger delay in seconds. */
  delay?: number;
  as?: "div" | "li" | "section";
  className?: string;
}) {
  const reduce = useReducedMotion();

  const MotionTag = motion[as];

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
