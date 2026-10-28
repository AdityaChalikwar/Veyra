import { ExternalLink, Globe } from "lucide-react";
import { useId } from "react";
import type { WebResearch } from "@/lib/types";

/** Veyra's web research: the answer, facts and views kept apart, each with numbered sources. */
export function WebResearchResult({ research: r }: { research: WebResearch }) {
  // Several results can share a page, so source anchors are unique per result.
  const id = useId();
  const refs = (ids: number[]) => (
    <span className="ml-1 text-[11px] text-ink-faint">
      {ids.map((i) => (
        <a key={i} href={`#${id}-src-${i}`} className="ml-0.5 hover:text-brand-600">
          [{i + 1}]
        </a>
      ))}
    </span>
  );
  return (
    <div className="rounded-lg border border-line bg-canvas/60 p-3 text-[13px]">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        <Globe className="h-3.5 w-3.5" /> Public web research by Veyra · weaker evidence than your own data
      </p>
      <p className="mt-1.5 text-ink">{r.answer}</p>
      {r.facts.length > 0 && (
        <>
          <p className="mt-2.5 text-xs font-semibold text-ink-muted">What sources state</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink">
            {r.facts.map((f) => (
              <li key={f.text}>
                {f.text}
                {refs(f.sources)}
              </li>
            ))}
          </ul>
        </>
      )}
      {r.views.length > 0 && (
        <>
          <p className="mt-2.5 text-xs font-semibold text-ink-muted">Views and claims (opinions, not facts)</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink-muted">
            {r.views.map((v) => (
              <li key={v.text}>
                {v.text}
                {refs(v.sources)}
              </li>
            ))}
          </ul>
        </>
      )}
      {r.unknowns && (
        <p className="mt-2.5 text-xs text-ink-subtle">
          <span className="font-semibold">What the web can&rsquo;t tell:</span> {r.unknowns}
        </p>
      )}
      <ol className="mt-2.5 space-y-0.5 border-t border-line pt-2">
        {r.sources.map((s, i) => (
          <li key={s.url} id={`${id}-src-${i}`} className="text-xs">
            <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-start gap-1 text-brand-600 hover:text-brand-700">
              [{i + 1}] {s.title || s.url} <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
