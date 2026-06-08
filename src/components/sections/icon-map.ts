import {
  Gauge,
  Headset,
  LayoutDashboard,
  type LucideIcon,
  Rocket,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

/**
 * Maps the icon-name strings stored in the content model (`services.ts`) and the
 * benefit grid to concrete lucide-react components. Keeping the lookup explicit
 * (rather than dynamic) keeps tree-shaking predictable and the bundle small.
 */
export const iconMap: Record<string, LucideIcon> = {
  Rocket,
  LayoutDashboard,
  Sparkles,
  Smartphone,
  Search,
  // why-us benefits
  Gauge,
  Headset,
  ShieldCheck,
};
