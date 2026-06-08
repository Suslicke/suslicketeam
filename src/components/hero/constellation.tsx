"use client";

import { useEffect, useRef } from "react";

/**
 * Performance-safe animated node/line constellation rendered on a 2D canvas and
 * positioned behind the hero content. Designed to never compromise the hero LCP:
 * it is meant to be lazy-mounted via `next/dynamic({ ssr: false })`, so the hero
 * text + CTA are server-rendered and paint first.
 *
 * Guards:
 * - Honors `prefers-reduced-motion`: renders a single static frame, no RAF loop.
 * - Pauses the RAF loop when off-screen (IntersectionObserver) or when the tab is
 *   hidden (`document.hidden` / visibilitychange).
 * - Downgrades particle count on low-end devices (few cores / little memory) and
 *   on small viewports.
 * - DPR-aware sizing, debounced resize, and full cleanup of RAF + listeners.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// Connection + interaction radii (CSS px). Lines fade with distance.
const LINK_DISTANCE = 130;
const MOUSE_DISTANCE = 170;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** Particle budget based on viewport area and device capability. */
function targetNodeCount(width: number, height: number): number {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowEnd =
    (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;

  // ~1 node per 14k px², clamped. Halve on low-end / small screens.
  const area = width * height;
  let count = Math.round(area / 14000);
  count = Math.min(count, 90);
  if (lowEnd || width < 640) count = Math.round(count / 2);
  return Math.max(18, count);
}

export default function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = prefersReducedMotion();

    // Resolve the brand accent from CSS so the canvas matches the theme. Falls
    // back to a violet close to --brand if the computed value can't be read.
    const brand =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--brand")
        .trim() || "oklch(0.7 0.18 285)";

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let rafId = 0;
    let running = false;
    let visible = true;

    const mouse = { x: -9999, y: -9999, active: false };

    function buildNodes() {
      const count = targetNodeCount(width, height);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNodes();
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];

        // Node dot.
        ctx!.beginPath();
        ctx!.arc(a.x, a.y, 1.6, 0, Math.PI * 2);
        ctx!.fillStyle = `color-mix(in oklch, ${brand} 70%, transparent)`;
        ctx!.fill();

        // Links to nearby nodes.
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            const opacity = (1 - dist / LINK_DISTANCE) * 0.28;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `color-mix(in oklch, ${brand} ${Math.round(
              opacity * 100,
            )}%, transparent)`;
            ctx!.lineWidth = 1;
            ctx!.stroke();
          }
        }

        // Link to cursor for a subtle reactive feel.
        if (mouse.active) {
          const dx = a.x - mouse.x;
          const dy = a.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_DISTANCE) {
            const opacity = (1 - dist / MOUSE_DISTANCE) * 0.45;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(mouse.x, mouse.y);
            ctx!.strokeStyle = `color-mix(in oklch, ${brand} ${Math.round(
              opacity * 100,
            )}%, transparent)`;
            ctx!.lineWidth = 1;
            ctx!.stroke();
          }
        }
      }
    }

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }
      draw();
      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (running || reduced) return;
      if (!visible || document.hidden) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    // --- wiring ---
    resize();
    if (reduced) {
      // Single static frame; no animation loop.
      draw();
    } else {
      start();
    }

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (reduced) draw();
      }, 200);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }
    function onMouseLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduced) {
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
      stop();
      clearTimeout(resizeTimer);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
