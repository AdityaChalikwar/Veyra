"use client";

import { ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { KindBadge } from "@/components/ui/KindBadge";
import { cn } from "@/lib/cn";
import type { ArtifactRef, ChatMessage as Message } from "@/lib/types";

const refKind: Partial<Record<ArtifactRef["kind"], "finding" | "hypothesis" | "recommendation" | "unknown">> = {
  finding: "finding",
  hypothesis: "hypothesis",
  recommendation: "recommendation",
};

/** One chat turn. Assistant turns link to the structured artifacts they talk about. */
export function ChatMessage({ message, onOpenRef }: { message: Message; onOpenRef: (ref: ArtifactRef) => void }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[88%] rounded-2xl rounded-br-md bg-brand-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
          {message.text}
        </p>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-surface">
        <LogoMark className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-line bg-canvas/70 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
        <p>{message.text}</p>
        {message.list && (
          <ol className="mt-2 list-decimal space-y-1 pl-4 marker:text-ink-faint">
            {message.list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        )}
        {message.refs && message.refs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {message.refs.map((ref) => {
              const badge = refKind[ref.kind];
              return (
                <button
                  key={`${ref.kind}-${ref.id}`}
                  type="button"
                  onClick={() => onOpenRef(ref)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-brand-700",
                    "hover:border-brand-300 hover:bg-brand-50",
                  )}
                >
                  {badge && <KindBadge kind={badge} />}
                  {ref.label} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
