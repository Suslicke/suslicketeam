import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RepairStatus } from "@/components/sites/repair-status";

// ponytail: one public demo order for the auto-service reel; real orders would come from the shop's system.
const ORDERS = [{ slug: "demo-auto", order: "demo" }];

export const dynamicParams = false;

export function generateStaticParams() {
  return ORDERS;
}

export const metadata: Metadata = {
  title: "Заказ №1042 · Bolt & Box — демо статуса ремонта",
  description: "Демонстрация: статус ремонта и согласование дополнительных работ по ссылке.",
  // Demo sales drafts: never index, never follow.
  robots: { index: false, follow: false },
};

export default async function StatusPage({ params }: { params: Promise<{ slug: string; order: string }> }) {
  const { slug, order } = await params;
  if (!ORDERS.some((o) => o.slug === slug && o.order === order)) notFound();
  return <RepairStatus />;
}
