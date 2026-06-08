import type { LeadInput } from "./lead-schema";

/**
 * Format a validated lead into a plain-text Telegram message.
 *
 * We deliberately send WITHOUT a `parse_mode` (plain text). That means user
 * input is rendered verbatim and cannot break Telegram's Markdown/HTML parser
 * or be used for injection — no escaping required. Optional fields are omitted
 * entirely rather than rendered as empty/`undefined` rows.
 */
export function formatTelegramMessage(lead: LeadInput): string {
  const lines: string[] = [
    "🦫 Новая заявка с сайта",
    "",
    `Имя: ${lead.name}`,
    `Контакт: ${lead.contact}`,
    `Тип проекта: ${lead.projectType}`,
  ];

  if (lead.message && lead.message.trim().length > 0) {
    lines.push(`Сообщение: ${lead.message}`);
  }

  if (lead.page) {
    lines.push(`Страница: ${lead.page}`);
  }

  const source = lead.utm?.utm_source;
  const campaign = lead.utm?.utm_campaign;
  if (source) {
    lines.push(`UTM source: ${source}`);
  }
  if (campaign) {
    lines.push(`UTM campaign: ${campaign}`);
  }

  return lines.join("\n");
}
