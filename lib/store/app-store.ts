"use client";

import { useSyncExternalStore } from "react";
import type { InvestigationDraft } from "@/lib/types";

/**
 * Browser-only state, saved in localStorage. Sign-in and the company profile
 * live in Supabase; this only keeps the unsaved New Investigation draft until
 * investigations are stored in the database.
 */
export type AppState = {
  /** The new investigation being set up (problem → clarifying questions → plan). */
  draft: InvestigationDraft | null;
};

const STORAGE_KEY = "veyra:app-state:v2";

const initialState: AppState = {
  draft: null,
};

let state: AppState = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = { draft: (JSON.parse(raw) as Partial<AppState>).draft ?? null };
    // The previous version also kept a simulated sign-in here; drop it.
    window.localStorage.removeItem("veyra:app-state:v1");
    // Drafts saved by an older version of the New Investigation flow have a different shape.
    if (state.draft && !Array.isArray(state.draft.dataSourceIds)) state = { ...state, draft: null };
  } catch {
    // Storage unavailable (private mode, blocked) — run without persistence.
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore — state still works for this tab.
  }
}

function setState(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return state;
}

function getServerSnapshot() {
  return initialState;
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const noopSubscribe = () => () => {};

/**
 * False during server render and hydration, true afterwards. Gate UI whose
 * initial state depends on saved data (e.g. forms seeded from a draft).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export const appActions = {
  saveDraft(draft: InvestigationDraft) {
    setState({ draft });
  },
  clearDraft() {
    setState({ draft: null });
  },
};
