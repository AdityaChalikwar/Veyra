import { CircleHelp } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { EmptyNote } from "@/components/ui/EmptyNote";

/** What Veyra doesn't know yet, across investigations. */
export function OpenQuestions({ items }: { items: { investigationId: string; investigationTitle: string; question: string }[] }) {
  if (!items.length) return <EmptyNote className="border-0 py-6">Open questions appear here as investigations raise them.</EmptyNote>;
  return (
    <ul className="divide-y divide-line">
      {items.map((q) => (
        <li key={q.question} className="flex gap-2.5 py-3">
          <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
          <div className="min-w-0">
            <p className="text-[13.5px] leading-snug text-ink">{q.question}</p>
            <Link href={routes.investigation(q.investigationId)} className="text-xs text-ink-subtle hover:text-brand-600">
              {q.investigationTitle}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
