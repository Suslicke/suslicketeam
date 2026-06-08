import { ArrowRight } from "lucide-react";

import { iconMap } from "@/components/sections/icon-map";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

export interface ServiceCardProps {
  slug: string;
  icon: string;
  title: string;
  tagline: string;
  cta: string;
}

/**
 * Shared service card used on the home services-overview and the services
 * overview page. Links to the service detail page and renders localized copy
 * passed by the caller (so the component stays a pure presentational unit).
 */
export function ServiceCard({ slug, icon, title, tagline, cta }: ServiceCardProps) {
  const Icon = iconMap[icon] ?? ArrowRight;

  return (
    <Link
      href={`/services/${slug}`}
      className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-3 p-6 transition-all hover:-translate-y-1 hover:ring-brand/40">
        <div className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Icon className="size-5" />
        </div>
        <CardHeader className="gap-1.5 px-0">
          <h3 className="font-display text-lg leading-snug font-medium">{title}</h3>
          <CardDescription>{tagline}</CardDescription>
        </CardHeader>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-brand">
          {cta}
          <ArrowRight className="size-4 transition-transform group-hover/card:translate-x-0.5" />
        </span>
      </Card>
    </Link>
  );
}
