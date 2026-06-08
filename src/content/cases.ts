/**
 * Structural data for portfolio cases. Translatable copy (title, summary, task,
 * solution, result) lives in the `cases` namespace in messages/{ru,kk,en}.json
 * keyed by `slug` (e.g. `cases.xaid.title`). `metrics` are structural keys whose
 * localized labels live under `cases.<slug>.metrics.<key>`.
 *
 * `url` is the live production link. `featured` flags the cases shown on the home
 * page preview. `tags` are tech/stack labels rendered as-is (not translated).
 */
export type CaseSlug =
  | "suslicke"
  | "animeenigma"
  | "xaid"
  | "python-guide"
  | "web-interview"
  | "loyrush"
  | "exchange-bridge"
  | "ai-diagnostic";

export interface CaseItem {
  slug: CaseSlug;
  /** Live production URL. */
  url: string;
  /** Tech/stack tags, rendered verbatim. */
  tags: readonly string[];
  featured: boolean;
  /** Structural metric keys; labels live in messages under cases.<slug>.metrics. */
  metrics: readonly string[];
  year: number;
}

export const cases: readonly CaseItem[] = [
  {
    slug: "suslicke",
    url: "https://suslicke.com",
    tags: ["Next.js", "TypeScript", "Tailwind", "Terminal UI"],
    metrics: ["ui", "performance"],
    featured: false,
    year: 2024,
  },
  {
    slug: "animeenigma",
    url: "https://animeenigma.ru",
    tags: ["Next.js", "PostgreSQL", "Стриминг", "Аниме"],
    metrics: ["load", "library"],
    featured: false,
    year: 2024,
  },
  {
    slug: "xaid",
    url: "https://xaid.ai",
    tags: ["HealthTech", "AI", "Web-портал", "Админ-панель", "DICOM/HL7"],
    metrics: ["admin", "international"],
    featured: true,
    year: 2025,
  },
  {
    slug: "python-guide",
    url: "https://python-guide.suslicke.com",
    tags: ["Next.js", "MDX", "Education", "Собеседования"],
    metrics: ["traffic", "seo"],
    featured: false,
    year: 2024,
  },
  {
    slug: "web-interview",
    url: "https://web-interview.suslicke.com",
    tags: ["React", "Education", "Собеседования"],
    metrics: ["engagement", "questions"],
    featured: false,
    year: 2024,
  },
  {
    slug: "loyrush",
    url: "https://loyrush.com",
    tags: ["SaaS", "Vue", "Лояльность", "Геймификация", "Дашборд"],
    metrics: ["subscription", "analytics"],
    featured: true,
    year: 2025,
  },
  {
    slug: "exchange-bridge",
    url: "https://exchange-bridge.com",
    tags: ["Fintech", "Money Transfer", "Real-time", "Дашборд"],
    metrics: ["realtime", "savings"],
    featured: true,
    year: 2025,
  },
  {
    slug: "ai-diagnostic",
    url: "https://ai-diagnostic.ru",
    tags: ["HealthTech", "AI", "PACS", "Рентгенология"],
    metrics: ["pacs", "pathologies"],
    featured: true,
    year: 2025,
  },
] as const;
