"use client";

import { Files } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import { EvidencePanel } from "@/components/evidence/EvidencePanel";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import type { EvidenceItem } from "@/lib/types";

const EvidenceDrawerContext = createContext<{ open: () => void; count: number } | null>(null);

/**
 * Workspace layout: main column plus the Evidence & Data panel. From `xl` the
 * panel sits on the right; below that it opens as a drawer.
 */
export function WorkspaceFrame({ evidence, children }: { evidence: EvidenceItem[]; children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const open = useCallback(() => setDrawerOpen(true), []);
  const close = useCallback(() => setDrawerOpen(false), []);

  return (
    <EvidenceDrawerContext.Provider value={{ open, count: evidence.length }}>
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_336px]">
        <div className="min-w-0 px-4 pb-12 sm:px-8">{children}</div>
        <aside
          aria-label="Evidence and data"
          className="sticky top-0 hidden h-screen overflow-y-auto border-l border-line bg-surface xl:block"
        >
          <h2 className="px-5 pt-6 text-[15px] font-semibold">Evidence &amp; Data</h2>
          <EvidencePanel evidence={evidence} />
        </aside>
      </div>
      <Drawer open={drawerOpen} onClose={close} title="Evidence & Data">
        <EvidencePanel evidence={evidence} />
      </Drawer>
    </EvidenceDrawerContext.Provider>
  );
}

/** Opens the evidence drawer on screens where the side panel is hidden. */
export function EvidenceToggle() {
  const ctx = useContext(EvidenceDrawerContext);
  if (!ctx) return null;
  return (
    <Button type="button" variant="secondary" size="sm" onClick={ctx.open} className="xl:hidden">
      <Files className="h-3.5 w-3.5" /> Evidence <span className="text-ink-faint">({ctx.count})</span>
    </Button>
  );
}
