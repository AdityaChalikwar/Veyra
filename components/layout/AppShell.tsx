"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { routes } from "@/lib/routes";
import type { InvestigationSummary } from "@/lib/types";
import { SessionProvider, type ClientSession } from "./SessionProvider";
import { Sidebar } from "./Sidebar";

/**
 * Signed-in frame: fixed navy sidebar on desktop, slide-in drawer below `lg`.
 */
export function AppShell({
  investigations,
  session,
  children,
}: {
  investigations: InvestigationSummary[];
  session: ClientSession;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const close = () => setDrawerOpen(false);

  return (
    <SessionProvider value={session}>
      <div data-app-shell className="min-h-screen bg-canvas">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block">
          <Sidebar investigations={investigations} />
        </aside>

        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="-ml-1.5 grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-canvas"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo href={routes.dashboard} />
        </header>

        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onKeyDown={(e) => e.key === "Escape" && close()}
          >
            <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-navy-950/50" onClick={close} />
            <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-raised">
              <Sidebar investigations={investigations} onNavigate={close} />
              <button
                type="button"
                onClick={close}
                aria-label="Close navigation"
                autoFocus
                className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg text-navy-300 hover:bg-navy-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="lg:pl-[248px]">{children}</div>
      </div>
    </SessionProvider>
  );
}
