import { FileSpreadsheet, FileText, Link2, StickyNote, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EvidenceFormat } from "@/lib/types";

const config: Record<EvidenceFormat, { icon: LucideIcon; tint: string }> = {
  csv: { icon: FileSpreadsheet, tint: "bg-confirmed-50 text-confirmed-600" },
  xlsx: { icon: FileSpreadsheet, tint: "bg-confirmed-50 text-confirmed-600" },
  pdf: { icon: FileText, tint: "bg-violet-50 text-violet-700" },
  doc: { icon: FileText, tint: "bg-brand-50 text-brand-600" },
  link: { icon: Link2, tint: "bg-brand-50 text-brand-600" },
  text: { icon: StickyNote, tint: "bg-slate-100 text-slate-600" },
};

export function EvidenceFormatIcon({ format, className }: { format: EvidenceFormat; className?: string }) {
  const { icon: Icon, tint } = config[format];
  return (
    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", tint, className)} aria-hidden="true">
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}
