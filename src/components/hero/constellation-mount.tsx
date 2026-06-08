"use client";

import dynamic from "next/dynamic";

/**
 * Client-only mount wrapper for the canvas constellation. `next/dynamic` with
 * `ssr: false` is only allowed in a Client Component, so this thin wrapper lets
 * the server `Hero` render its text + CTA immediately (the LCP element) while the
 * canvas is code-split and mounted after hydration — never blocking first paint.
 */
const Constellation = dynamic(() => import("./constellation"), { ssr: false });

export function ConstellationMount() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_30%,transparent_75%)]"
    >
      <div className="pointer-events-auto absolute inset-0">
        <Constellation />
      </div>
    </div>
  );
}
