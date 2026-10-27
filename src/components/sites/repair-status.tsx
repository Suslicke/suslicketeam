"use client";

import { Golos_Text, JetBrains_Mono, Oswald } from "next/font/google";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useState, type CSSProperties } from "react";

/**
 * Repair-status page of a fictional car service (/sites/demo-auto/status/demo).
 *
 * Direction: a work order you can hold — paper, graphite, signal orange, steel.
 * Oswald (narrow garage grotesk) for headings, Golos Text for reading, mono for
 * order numbers and times. Signature: a tachometer in the dark header whose
 * needle sweeps to the current stage; approving the extra work presses an
 * «СОГЛАСОВАНО» stamp onto the offer, like on a paper заказ-наряд.
 *
 * All data is a local demo order (no backend). Approving does NOT move the
 * stage: the staff member changes it (see creatives/03-autoservice.md).
 */

const display = Oswald({ subsets: ["latin", "cyrillic"], weight: ["500", "600", "700"], variable: "--rs-display" });
const body = Golos_Text({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--rs-body" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["500"], variable: "--rs-mono" });

const C = { paper: "#F4F2EE", graphite: "#1C1F24", orange: "#F26A1B", steel: "#8A949E", line: "#E2DED6" };

const STAGES = ["Принята", "Диагностика", "Согласование", "В работе", "Готова"];
const CURRENT = 2;
const APPROVED_AT = "11:12";

const HISTORY = [
  { time: "10:05", text: "Машина принята, заказ создан" },
  { time: "10:50", text: "Диагностика завершена" },
];

const vars = { "--paper": C.paper, "--graphite": C.graphite, "--orange": C.orange, "--steel": C.steel, "--line": C.line } as CSSProperties;
const ease = [0.22, 1, 0.36, 1] as const;

export function RepairStatus() {
  const [approved, setApproved] = useState(false);
  const [askNote, setAskNote] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={vars}
        className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen bg-[#E9E6DF] font-[family-name:var(--rs-body)] text-[var(--graphite)] selection:bg-[var(--orange)]/20`}
      >
        <main className="mx-auto min-h-screen max-w-[440px] bg-[var(--paper)] pb-10 shadow-[0_0_60px_-20px_rgba(28,31,36,.25)]">
          <Header />
          <Gauge approved={approved} />

          <section className="px-4 pt-5" aria-labelledby="offer-title">
            <div id="offer" className="relative overflow-hidden rounded-[28px] bg-white ring-1 ring-[var(--line)]">
              <BrakeFigure />
              <div className="px-5 pt-4 pb-5">
                <p className="font-[family-name:var(--rs-mono)] text-[11px] tracking-[0.18em] text-[var(--orange)] uppercase">Нужно согласовать</p>
                <h2 id="offer-title" className="mt-1.5 font-[family-name:var(--rs-display)] text-[26px] leading-[1.1] font-semibold tracking-[-0.01em] uppercase">
                  Замена передних тормозных колодок
                </h2>
                <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--graphite)]/75">
                  Колодки стёрлись до индикатора износа. Мастер рекомендует заменить их, чтобы тормоза работали как положено.
                </p>
                <ul className="mt-4 space-y-2 text-[15px]">
                  {["Передние колодки, комплект", "Работа по замене"].map((item) => (
                    <li key={item} className="flex items-center justify-between gap-3 border-b border-dashed border-[var(--line)] pb-2">
                      <span>{item}</span>
                      <span className="font-[family-name:var(--rs-mono)] text-[11px] tracking-wider text-[var(--steel)] uppercase">включено</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[13px] text-[var(--steel)]">Допработы</p>
                    <p className="font-[family-name:var(--rs-display)] text-[40px] leading-none font-bold tracking-tight">28&nbsp;000&nbsp;₸</p>
                  </div>
                  <div className="text-right text-[13px] leading-snug text-[var(--steel)]">
                    Готовность
                    <br />
                    <span className="font-semibold text-[var(--graphite)]">сегодня к 18:00</span>
                  </div>
                </div>
              </div>
              <AnimatePresence>{approved && <Stamp />}</AnimatePresence>
            </div>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                disabled={approved}
                onClick={() => setApproved(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[17px] font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange)] disabled:cursor-default"
                style={{ background: approved ? C.graphite : C.orange, boxShadow: approved ? "none" : `0 14px 30px -12px ${C.orange}` }}
              >
                {approved ? (
                  <>
                    <Check /> Согласие сохранено · {APPROVED_AT}
                  </>
                ) : (
                  <>Согласовать · 28&nbsp;000&nbsp;₸</>
                )}
              </button>
              {/* hidden, not removed, after approval — so the page doesn't shrink and jump */}
              <button
                type="button"
                onClick={() => setAskNote(true)}
                className={`w-full rounded-2xl bg-transparent py-3.5 text-[15px] font-semibold ring-1 ring-[var(--graphite)]/15 focus-visible:outline-2 focus-visible:outline-[var(--orange)] ${approved ? "invisible" : ""}`}
              >
                Обсудить с приёмщиком
              </button>
              {askNote && !approved && <p className="text-center text-[13px] text-[var(--steel)]">В демо-версии звонок не совершается.</p>}
            </div>
          </section>

          <History approved={approved} />

          <footer className="mt-8 px-6 text-center text-[12px] leading-relaxed text-[var(--steel)]">
            Демонстрация сценария. Bolt & Box — вымышленный автосервис, данные условные.
            <br />
            Сделано{" "}
            <a href="https://suslicketeam.com" className="font-semibold text-[var(--graphite)] underline-offset-2 hover:underline">
              suslicketeam
            </a>
          </footer>
        </main>
      </div>
    </MotionConfig>
  );
}

function Header() {
  return (
    <header data-rs-header className="sticky top-0 z-20 flex items-center justify-between bg-[var(--paper)]/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
          <rect width="34" height="34" rx="9" fill={C.graphite} />
          <path d="M17 7.5l8.2 4.75v9.5L17 26.5l-8.2-4.75v-9.5z" fill="none" stroke={C.orange} strokeWidth="2.6" strokeLinejoin="round" />
          <circle cx="17" cy="17" r="3.6" fill={C.orange} />
        </svg>
        <span className="font-[family-name:var(--rs-display)] text-[19px] font-bold tracking-[0.06em] uppercase">Bolt &amp; Box</span>
      </div>
      <span className="rounded-full bg-[var(--graphite)]/[0.07] px-2.5 py-1 font-[family-name:var(--rs-mono)] text-[10px] tracking-[0.16em] text-[var(--steel)] uppercase">Демо</span>
    </header>
  );
}

/** Dark "dashboard" block: order, car, and a tachometer whose needle sweeps to the current stage. */
function Gauge({ approved }: { approved: boolean }) {
  const R = 112;
  const at = (i: number, r = R) => {
    const a = Math.PI - (i * Math.PI) / (STAGES.length - 1);
    return { x: 150 + r * Math.cos(a), y: 140 - r * Math.sin(a) };
  };
  const minor = Array.from({ length: 17 }, (_, k) => k / 4);
  return (
    <section className="mx-4 mt-1 overflow-hidden rounded-[28px] bg-[var(--graphite)] px-5 pt-5 pb-5 text-white">
      <div className="flex items-baseline justify-between">
        <p className="font-[family-name:var(--rs-mono)] text-[12px] tracking-[0.16em] text-white/55 uppercase">Заказ №1042</p>
        <p className="font-[family-name:var(--rs-mono)] text-[12px] text-white/55">принята 10:05</p>
      </div>
      <h1 className="mt-1 font-[family-name:var(--rs-display)] text-[30px] leading-none font-semibold tracking-[0.01em] uppercase">Toyota Camry</h1>
      <p className="mt-1 text-[13px] text-white/50">Госномер скрыт · Нурлан</p>

      <svg viewBox="0 0 300 160" className="mx-auto mt-3 block w-full max-w-[320px]" role="img" aria-label={`Этап ${CURRENT + 1} из ${STAGES.length}: ${STAGES[CURRENT]}`}>
        <path d="M38 140 A112 112 0 0 1 262 140" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="10" strokeLinecap="round" />
        <motion.path
          d="M38 140 A112 112 0 0 1 262 140"
          fill="none"
          stroke={C.orange}
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: CURRENT / (STAGES.length - 1) }}
          transition={{ duration: 1.2, delay: 0.3, ease }}
        />
        {minor.map((k) => {
          const a = at(k, R - 16);
          const b = at(k, R - (Number.isInteger(k) ? 28 : 22));
          return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,.35)" strokeWidth={Number.isInteger(k) ? 2.4 : 1.2} />;
        })}
        {STAGES.map((_, i) => {
          const p = at(i, R + 0.5);
          return <circle key={i} cx={p.x} cy={p.y} r="3.4" fill={i <= CURRENT ? C.graphite : "rgba(255,255,255,.5)"} />;
        })}
        {/* motion rotates around the group's bbox centre — the invisible circle puts that centre on the hub */}
        <motion.g initial={{ rotate: 0 }} animate={{ rotate: (CURRENT * 180) / (STAGES.length - 1) }} transition={{ duration: 1.2, delay: 0.3, ease }}>
          <circle cx="150" cy="140" r="90" fill="none" />
          <path d="M150 136.5 L62 140 L150 143.5 Z" fill={C.orange} />
        </motion.g>
        <circle cx="150" cy="140" r="11" fill={C.graphite} stroke={C.orange} strokeWidth="3" />
        <circle cx="150" cy="140" r="3" fill={C.orange} />
      </svg>

      <div className="-mt-1 text-center">
        <p className="font-[family-name:var(--rs-display)] text-[28px] leading-none font-semibold tracking-[0.04em] text-[var(--orange)] uppercase">{STAGES[CURRENT]}</p>
        <p className="mt-1.5 text-[13px] text-white/60">
          Этап {CURRENT + 1} из {STAGES.length} · {approved ? "допработы согласованы" : "ждём вашего решения"}
        </p>
      </div>

      <ol className="-mx-3 mt-4 grid grid-cols-5">
        {STAGES.map((s, i) => (
          <li key={s} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className="grid size-6 place-items-center rounded-full text-[11px] font-semibold"
              style={i < CURRENT ? { background: "white", color: C.graphite } : i === CURRENT ? { boxShadow: `inset 0 0 0 2px ${C.orange}`, color: C.orange } : { boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.25)", color: "rgba(255,255,255,.4)" }}
            >
              {i < CURRENT ? <Check size={12} /> : i + 1}
            </span>
            <span className={`text-[9.5px] leading-tight tracking-[-0.01em] ${i === CURRENT ? "text-white" : "text-white/45"}`}>{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Schematic, not a photo: brake disc + a new pad next to the worn one. Labelled as an illustration. */
function BrakeFigure() {
  return (
    <figure className="relative bg-[linear-gradient(160deg,#F7F6F3,#ECE9E2)] px-4 pt-4 pb-2">
      <svg viewBox="0 0 320 170" className="block w-full" role="img" aria-label="Схема: тормозной диск, новая колодка и изношенная колодка">
        <defs>
          <radialGradient id="rs-disc" cx="45%" cy="40%">
            <stop offset="0" stopColor="#D7DADE" />
            <stop offset="1" stopColor="#9BA2AA" />
          </radialGradient>
          <pattern id="rs-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill="#F9D9C6" />
            <line x1="0" y1="0" x2="0" y2="5" stroke={C.orange} strokeWidth="2" />
          </pattern>
        </defs>
        {/* disc */}
        <circle cx="86" cy="86" r="70" fill="url(#rs-disc)" />
        {Array.from({ length: 24 }, (_, k) => {
          const a = (k / 24) * Math.PI * 2;
          return <line key={k} x1={86 + 40 * Math.cos(a)} y1={86 + 40 * Math.sin(a)} x2={86 + 64 * Math.cos(a)} y2={86 + 64 * Math.sin(a)} stroke="rgba(28,31,36,.12)" strokeWidth="1" />;
        })}
        <circle cx="86" cy="86" r="34" fill="#7E858D" />
        <circle cx="86" cy="86" r="12" fill="#5D646C" />
        {Array.from({ length: 5 }, (_, k) => {
          const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
          return <circle key={k} cx={86 + 23 * Math.cos(a)} cy={86 + 23 * Math.sin(a)} r="3.6" fill={C.graphite} />;
        })}
        {/* caliper */}
        <path d="M118 28 Q160 46 160 86 Q160 126 118 144 L108 128 Q138 112 138 86 Q138 60 108 44 Z" fill={C.graphite} />
        <rect x="140" y="74" width="12" height="24" rx="3" fill={C.orange} />

        {/* new pad */}
        <text x="188" y="34" fontFamily="var(--rs-mono)" fontSize="9" letterSpacing="1.5" fill={C.steel}>
          НОВАЯ
        </text>
        <rect x="188" y="42" width="112" height="9" rx="2" fill={C.graphite} />
        <rect x="192" y="51" width="104" height="24" rx="3" fill="#6B5B4E" />

        {/* worn pad */}
        <text x="188" y="104" fontFamily="var(--rs-mono)" fontSize="9" letterSpacing="1.5" fill={C.orange}>
          ВАША · ИЗНОС
        </text>
        <rect x="188" y="112" width="112" height="9" rx="2" fill={C.graphite} />
        <rect x="192" y="121" width="104" height="5" rx="1.5" fill="url(#rs-hatch)" stroke={C.orange} strokeWidth="1.2" />
        {/* wear indicator touching */}
        <path d="M282 121 L282 131 L276 131" fill="none" stroke={C.graphite} strokeWidth="2" />
        <circle cx="276" cy="131" r="6.5" fill="none" stroke={C.orange} strokeWidth="1.5" strokeDasharray="2 2" />
        <text x="188" y="150" fontFamily="var(--rs-body)" fontSize="10.5" fill={C.graphite}>
          Сработал индикатор
        </text>
      </svg>
      <figcaption className="pb-1 text-right font-[family-name:var(--rs-mono)] text-[9.5px] tracking-[0.12em] text-[var(--steel)] uppercase">
        Иллюстрация для демо · в заказе — фото мастера
      </figcaption>
    </figure>
  );
}

/** Pressed onto the illustration (never over the offer text), like a stamp on a paper work order. */
function Stamp() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center" aria-hidden>
      <motion.div
        initial={{ opacity: 0, scale: 1.9, rotate: -3 }}
        animate={{ opacity: 1, scale: 1, rotate: -9 }}
        transition={{ duration: 0.38, ease: [0.3, 1.4, 0.5, 1] }}
        className="rounded-xl border-[3px] border-[var(--orange)] bg-white/90 px-5 py-2.5 text-center text-[var(--orange)] shadow-[0_10px_30px_-12px_rgba(28,31,36,.35)]"
        style={{ boxShadow: `inset 0 0 0 2px #fff, inset 0 0 0 4px ${C.orange}` }}
      >
        <p className="font-[family-name:var(--rs-display)] text-[30px] leading-none font-bold tracking-[0.1em] uppercase">Согласовано</p>
        <p className="mt-1.5 font-[family-name:var(--rs-mono)] text-[11px] tracking-wider">{APPROVED_AT} · Нурлан · 28 000 ₸</p>
      </motion.div>
    </div>
  );
}

function History({ approved }: { approved: boolean }) {
  const rows = approved ? [...HISTORY, { time: APPROVED_AT, text: "Согласованы допработы: замена передних колодок, 28 000 ₸" }] : HISTORY;
  return (
    <section className="mx-4 mt-7" aria-labelledby="history-title">
      <h2 id="history-title" className="font-[family-name:var(--rs-mono)] text-[11px] tracking-[0.18em] text-[var(--steel)] uppercase">
        История заказа
      </h2>
      <ol className="mt-3 border-l-2 border-[var(--line)] pl-4">
        <AnimatePresence initial={false}>
          {rows.map((r) => (
            <motion.li
              key={r.time}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, ease }}
              className="relative pb-3 text-[14px] leading-snug"
            >
              <span className="absolute top-1.5 -left-[21px] size-2 rounded-full" style={{ background: r.time === APPROVED_AT ? C.orange : C.graphite }} />
              <span className="font-[family-name:var(--rs-mono)] text-[12px] text-[var(--steel)]">{r.time}</span> {r.text}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}

function Check({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
