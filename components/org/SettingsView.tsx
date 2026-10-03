"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { useSession } from "@/components/layout/SessionProvider";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

export function SettingsView() {
  const { user, company, method } = useSession();

  return (
    <div className="mt-8 max-w-2xl space-y-4">
      <Section title="Profile">
        <Row label="Name" value={user.name} />
        <Row label="Email" value={user.email} />
        <Row label="Signed in with" value={method === "google" ? "Google" : "Email and password"} />
      </Section>
      <Section title="Workspace">
        <Row label="Company" value={company.name} />
        <Row label="Members" value="Just you — inviting teammates comes later." />
        <p className="mt-3 text-[13px]">
          <Link href={routes.onboarding} className="font-medium text-brand-600 hover:text-brand-700">
            Update company profile
          </Link>
        </p>
      </Section>
      <Section title="Session">
        <form action={signOut}>
          <Button type="submit" variant="secondary" size="sm">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </form>
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
