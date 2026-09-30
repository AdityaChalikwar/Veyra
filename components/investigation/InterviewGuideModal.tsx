"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getInterviewGuide } from "@/lib/data/research";

/** A draft interview guide Veyra generates from the open questions. */
export function InterviewGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const guide = getInterviewGuide();
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = [
      `Goal: ${guide.goal}`,
      "",
      "Who to recruit:",
      ...guide.recruit.map((r) => `- ${r}`),
      "",
      ...guide.questions.flatMap((s) => [s.section, ...s.items.map((q) => `- ${q}`), ""]),
      "Avoid:",
      ...guide.avoid.map((a) => `- ${a}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the guide is still on screen.
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Interview guide" description="Draft generated from this investigation's open questions. Edit it to fit your team.">
      <div className="space-y-5 text-[13.5px]">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Goal</h3>
          <p className="mt-1 text-ink">{guide.goal}</p>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Who to recruit</h3>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink">
            {guide.recruit.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
        {guide.questions.map((s) => (
          <section key={s.section}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{s.section}</h3>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-ink">
              {s.items.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </section>
        ))}
        <section className="rounded-lg bg-uncertain-50 px-3 py-2 text-uncertain-600">
          <h3 className="text-xs font-semibold uppercase tracking-wider">Avoid</h3>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {guide.avoid.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy guide"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
