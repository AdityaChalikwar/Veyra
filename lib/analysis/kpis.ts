import type { EvidenceItem, Finding, Kpi } from "@/lib/types";

/**
 * Headline cards for a real investigation, built in code from the findings'
 * observed values ("13,717 → 8,587"). The change shown big ("−37%", "×2.8",
 * "+5.7 pts") is worked out here from those two figures, never by the AI.
 */

const MAX_CARDS = 3;

function parseFigure(text: string): { n: number; percent: boolean } | null {
  const m = text.trim().match(/^[^\d-]*(-?\d[\d,]*(?:\.\d+)?)\s*(%)?/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? { n, percent: !!m[2] } : null;
}

/** "6,620 → 4,243 → 1,334" → "6,620 → 1,334". */
const firstAndLast = (values: string) => {
  const parts = values.split(/→|->/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 2 ? `${parts[0]} → ${parts[parts.length - 1]}` : values.trim();
};

const fmt = (n: number, digits = 0) => n.toLocaleString("en", { maximumFractionDigits: digits });

/** The change between two figures, or null when the values aren't "start → end". */
export function describeChange(values: string): { value: string; direction: "up" | "down" | "flat" } | null {
  const parts = values.split(/→|->/).filter((p) => p.trim());
  if (parts.length < 2) return null;
  const a = parseFigure(parts[0]);
  const b = parseFigure(parts[parts.length - 1]);
  if (!a || !b) return null;
  const direction = b.n > a.n ? "up" : b.n < a.n ? "down" : "flat";
  if (a.percent && b.percent) {
    const pts = b.n - a.n;
    return { value: `${pts > 0 ? "+" : pts < 0 ? "−" : ""}${fmt(Math.abs(pts), 1)} pts`, direction };
  }
  if (a.n === 0) return null;
  const ratio = b.n / a.n;
  if (ratio >= 2) return { value: `×${fmt(ratio, 1)}`, direction };
  const pct = (ratio - 1) * 100;
  return { value: `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${fmt(Math.abs(pct))}%`, direction };
}

export function buildKpis(findings: Finding[], evidence: EvidenceItem[]): Kpi[] {
  // Only findings with one clear change make a card; lists and several measures stay in the findings.
  const cards: Kpi[] = findings
    .filter((f) => f.observed?.values && !f.observed.values.includes(";"))
    .sort((a, b) => Number(b.kind === "observation") - Number(a.kind === "observation"))
    .flatMap((f) => {
      const o = f.observed!;
      const change = describeChange(o.values);
      if (!change) return [];
      const kpi: Kpi = {
        id: `kpi-${f.id}`,
        label: o.measure || f.title || f.statement,
        value: change.value,
        detail: `${firstAndLast(o.values)}${o.period ? ` · ${o.period}` : ""}`,
        kind: o.effect === "worse" ? "decline" : o.effect === "better" ? "stable" : "neutral",
        icon: "metric",
        direction: change.direction,
        findingId: f.id,
        sourceEvidenceId: f.evidenceIds[0],
      };
      return [kpi];
    })
    .slice(0, MAX_CARDS);

  if (cards.length && evidence.length) {
    const kinds = new Map<string, number>();
    for (const e of evidence) kinds.set(e.source, (kinds.get(e.source) ?? 0) + 1);
    cards.push({
      id: "kpi-evidence",
      label: "Evidence",
      value: `${evidence.length} ${evidence.length === 1 ? "source" : "sources"}`,
      detail: [...kinds].map(([source, n]) => (n > 1 ? `${n} from ${source}` : source)).join(" · "),
      kind: "neutral",
      icon: "evidence",
    });
  }
  // The evidence card alone isn't worth a row.
  return cards.length ? cards : [];
}
