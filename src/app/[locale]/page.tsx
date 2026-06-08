import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/routing";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("common");
  const meta = await getTranslations("meta");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16">
      <h1 className="font-display text-4xl font-bold">{meta("site_name")}</h1>
      <p className="text-lg text-muted-foreground">
        {meta("default_description")}
      </p>
      <nav className="flex flex-wrap gap-4">
        <Link href="/services" className="hover:text-brand">
          {t("services")}
        </Link>
        <Link href="/cases" className="hover:text-brand">
          {t("cases")}
        </Link>
        <Link href="/about" className="hover:text-brand">
          {t("about")}
        </Link>
        <Link href="/contact" className="hover:text-brand">
          {t("contact")}
        </Link>
      </nav>
    </main>
  );
}
