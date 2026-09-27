import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShowcase } from "@/components/auth/AuthShowcase";

export const metadata = { title: "Welcome" };

export default function AuthPage() {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <AuthShowcase />
      {/* AuthForm reads ?mode= from the URL, which needs a Suspense boundary. */}
      <Suspense>
        <AuthForm />
      </Suspense>
    </div>
  );
}
