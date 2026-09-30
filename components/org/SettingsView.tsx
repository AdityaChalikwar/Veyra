"use client";

import { LogOut, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { appActions, useAppState, useHydrated } from "@/lib/store/app-store";

export function SettingsView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { user, company, authMethod } = useAppState();

  function signOut() {
    appActions.signOut();
    router.push(routes.home);
  }

  function resetPreview() {
    appActions.signOut();
    router.push(routes.signup);
  }

  if (!hydrated) return <div className="min-h-[40vh]" />;

  return (
    <div className="mt-8 max-w-2xl space-y-4">
      <Section title="Profile">
        <Row label="Name" value={user?.name ?? "Not signed in"} />
        <Row label="Email" value={user?.email ?? "—"} />
        <Row label="Signed in with" value={authMethod === "google" ? "Google" : authMethod === "email" ? "Email" : "—"} />
      </Section>
      <Section title="Workspace">
        <Row label="Company" value={company?.name ?? "Not set up"} />
        <Row label="Members" value="Just you — team members and roles arrive with the backend." />
      </Section>
      <Section title="Preview data">
        <p className="text-[13px] text-ink-muted">
          This preview keeps your sign-in and company profile in this browser only. Resetting clears them so you can walk through
          sign-up and onboarding again.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={resetPreview}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset and start again
          </Button>
          {user && (
            <Button type="button" variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <h2 className="mb-3 text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-line py-2.5 first:border-t-0 first:pt-0 sm:flex-row sm:gap-4">
      <p className="w-36 shrink-0 text-[13px] text-ink-subtle">{label}</p>
      <p className="text-[13px] text-ink">{value}</p>
    </div>
  );
}
