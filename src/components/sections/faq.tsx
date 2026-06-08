import { getTranslations } from "next-intl/server";

import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqLd } from "@/lib/structured-data";

const ITEMS = [
  "cost",
  "time",
  "support",
  "tech",
  "rights",
  "remote",
] as const;

/**
 * FAQ accordion + emitted FAQPage JSON-LD. Q&A copy lives under `faq.items.<key>`.
 */
export async function Faq() {
  const t = await getTranslations("home.faq");
  const tf = await getTranslations("faq");

  const qa = ITEMS.map((key) => ({
    question: tf(`items.${key}.question`),
    answer: tf(`items.${key}.answer`),
  }));

  return (
    <section className="border-t border-border/60 py-20 sm:py-28">
      <JsonLd data={faqLd(qa)} />
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <Reveal className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {ITEMS.map((key, i) => (
              <AccordionItem key={key} value={`item-${i}`}>
                <AccordionTrigger className="py-4 text-base">
                  {tf(`items.${key}.question`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>{tf(`items.${key}.answer`)}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
