"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

/** Right-hand slide-over panel. Closes on Escape or a click outside. */
export function Drawer({
  open,
  onClose,
  title,
  width = "w-[380px]",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-navy-950/40" onClick={onClose} />
      <div className={cn("absolute inset-y-0 right-0 flex max-w-[92vw] flex-col bg-surface shadow-raised", width)}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-subtle hover:bg-canvas hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
