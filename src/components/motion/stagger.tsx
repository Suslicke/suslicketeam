"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Stagger reveal for card grids. The parent orchestrates its direct
 * `StaggerItem` children so they fade/slide in sequence (not all at once) as the
 * grid enters the viewport. GPU-friendly (transform + opacity only), small
 * distances and short durations to stay restrained.
 *
 * `prefers-reduced-motion` → renders plain elements, no animation, nothing
 * hidden behind motion.
 */

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Stagger({
  children,
  as = "ul",
  className,
}: {
  children: ReactNode;
  as?: "ul" | "div";
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({
  children,
  as = "li",
  className,
}: {
  children: ReactNode;
  as?: "li" | "div";
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[as];
  return (
    <MotionTag className={className} variants={item}>
      {children}
    </MotionTag>
  );
}
