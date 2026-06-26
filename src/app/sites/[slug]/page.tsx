import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { ClinicSite } from "@/components/sites/clinic-site";
import { siteConfig } from "@/lib/config";
import { dentistLd } from "@/lib/structured-data";
import { getSite, sites } from "@/content/sites";

export function generateStaticParams() {
  return sites.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getSite(slug);
  if (!site) return {};

  const title = `${site.name} — ${site.kind.ru}, ${site.city.ru}`;
  const description = site.subhead.ru;

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    // Demo sales drafts: never index, never follow.
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${siteConfig.url}/sites/${site.slug}`,
      images: site.photos.length ? [{ url: site.photos[0] }] : undefined,
    },
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getSite(slug);
  if (!site) notFound();

  const url = `${siteConfig.url}/sites/${site.slug}`;

  return (
    <>
      <JsonLd
        data={dentistLd({
          name: site.name,
          url,
          telephone: site.phone,
          streetAddress: site.address.ru,
          addressLocality: site.city.ru,
          openingHours: site.hours.ru,
          rating: site.rating,
          reviewsCount: site.reviewsCount,
          image: site.photos.length ? `${siteConfig.url}${site.photos[0]}` : undefined,
          sameAs: [site.instagram, site.twogis].filter(Boolean) as string[],
        })}
      />
      <ClinicSite site={site} />
    </>
  );
}
