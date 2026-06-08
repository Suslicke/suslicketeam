import { getTranslations, setRequestLocale } from "next-intl/server";

import { ThemeToggle } from "@/components/theme-toggle";
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold">{meta("site_name")}</h1>
        <ThemeToggle />
      </div>
      <p className="text-lg">{meta("default_description")}</p>
      <nav className="flex flex-wrap gap-4">
        <Link href="/services">{t("services")}</Link>
        <Link href="/cases">{t("cases")}</Link>
        <Link href="/about">{t("about")}</Link>
        <Link href="/contact">{t("contact")}</Link>
      </nav>
    </main>
  );
}
