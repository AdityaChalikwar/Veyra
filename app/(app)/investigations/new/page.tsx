import { Suspense } from "react";
import { ProblemForm } from "@/components/new-investigation/ProblemForm";

export const metadata = { title: "New Investigation" };

export default function NewInvestigationPage() {
  return (
    // ProblemForm reads ?problem= from the dashboard, which needs a Suspense boundary.
    <Suspense>
      <ProblemForm />
    </Suspense>
  );
}
