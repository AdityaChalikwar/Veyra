"use client";

import { createContext, useContext } from "react";
import type { Company, User } from "@/lib/types";

export type ClientSession = {
  user: User;
  company: Company;
  method: "email" | "google";
  /** Set while the Demo ERP is connected: its data source, for the sidebar's "Demo data" label. */
  demo?: { sourceId: string; name: string };
};

const SessionContext = createContext<ClientSession | null>(null);

/** Makes the signed-in user and their workspace available to client components inside the app. */
export function SessionProvider({ value, children }: { value: ClientSession; children: React.ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): ClientSession {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside the signed-in app");
  return ctx;
}
