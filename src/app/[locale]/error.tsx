"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Localized, branded error boundary for the `[locale]` segment. Client
 * component (required by Next.js error boundaries) — uses `useTranslations`
 * from the client provider mounted in the locale layout.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Surface the error for client-side monitoring (PostHog/console).
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-24">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {t("error_title")}
        </h1>
        <p className="max-w-md text-pretty text-muted-foreground">
          {t("error_message")}
        </p>
        <Button
          size="lg"
          onClick={reset}
          className="h-11 bg-brand px-6 text-base text-brand-foreground hover:bg-brand/90"
        >
          {t("retry")}
        </Button>
      </div>
    </main>
  );
}
