import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { getSession, homeFor } from "@/lib/auth";

export const metadata = { title: "Welcome" };

export default async function AuthPage() {
  // Already signed in: skip straight to the app.
  if (await getSession()) redirect(await homeFor());

  return (
    <div className="grid grid-cols-1 min-h-screen bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <AuthShowcase />
      {/* AuthForm reads ?mode= from the URL, which needs a Suspense boundary. */}
      <Suspense>
        <AuthForm />
      </Suspense>
    </div>
  );
}
