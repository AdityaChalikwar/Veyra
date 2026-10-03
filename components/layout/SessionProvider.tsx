"use client";

import { createContext, useContext } from "react";
import type { Company, User } from "@/lib/types";

export type ClientSession = { user: User; company: Company; method: "email" | "google" };

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
