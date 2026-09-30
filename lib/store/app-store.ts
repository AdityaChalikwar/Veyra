"use client";

import { useSyncExternalStore } from "react";
import type { Company, InvestigationDraft, User } from "@/lib/types";

/**
 * Client-side app state, saved in localStorage so a refresh keeps you signed in.
 * This is a stand-in for real sessions: when auth and a database exist, this
 * store only caches what the backend returns.
 */
export type AuthMethod = "google" | "email";

export type AppState = {
  user: User | null;
  authMethod: AuthMethod | null;
  company: Company | null;
  onboardingComplete: boolean;
  /** The new investigation being set up (problem → clarifying questions). */
  draft: InvestigationDraft | null;
};

const STORAGE_KEY = "veyra:app-state:v1";

const initialState: AppState = {
  user: null,
  authMethod: null,
  company: null,
  onboardingComplete: false,
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
    if (raw) state = { ...initialState, ...JSON.parse(raw) };
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
  signIn(user: User, method: AuthMethod) {
    setState({ user, authMethod: method });
  },
  signOut() {
    setState(initialState);
  },
  completeOnboarding(company: Company) {
    setState({ company, onboardingComplete: true });
  },
  saveDraft(draft: InvestigationDraft) {
    setState({ draft });
  },
  clearDraft() {
    setState({ draft: null });
  },
};
