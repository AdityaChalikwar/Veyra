/**
 * A hypothesis the team has validated keeps its validation when a later
 * analysis states it again. Matching is in code: the same headline, or
 * statements that share most of their words.
 */

const STOP = new Set(["the", "and", "for", "are", "was", "were", "that", "this", "with", "from", "than", "they", "their", "has", "have", "had", "not", "but", "its", "into", "after", "more", "less", "some", "since"]);

const words = (text: string) => new Set(text.toLowerCase().replace(/[^a-z0-9%.\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Share of words two statements have in common (0–1). */
export function overlap(a: string, b: string): number {
  const x = words(a);
  const y = words(b);
  if (!x.size || !y.size) return 0;
  let shared = 0;
  for (const w of x) if (y.has(w)) shared++;
  return shared / (x.size + y.size - shared);
}

const SAME = 0.5;

/** New hypothesis ref → the validation it continues. Each validation goes to one hypothesis at most, best match first. */
export function matchValidations(
  validations: { id: string; title: string; statement: string }[],
  hypotheses: { ref: string; title: string; statement: string }[],
): Map<string, string> {
  const pairs: { ref: string; id: string; score: number }[] = [];
  for (const v of validations) {
    for (const h of hypotheses) {
      const sameTitle = !!v.title && !!h.title && norm(v.title) === norm(h.title);
      const score = sameTitle ? 1 : overlap(v.statement, h.statement);
      if (score >= SAME) pairs.push({ ref: h.ref, id: v.id, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const p of pairs) {
    if (out.has(p.ref) || used.has(p.id)) continue;
    out.set(p.ref, p.id);
    used.add(p.id);
  }
  return out;
}
