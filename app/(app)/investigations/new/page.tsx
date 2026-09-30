import { Suspense } from "react";
import { NewInvestigationFlow } from "@/components/new-investigation/NewInvestigationFlow";
import { getBusinessContext, listDataSources } from "@/lib/data";
import { listExampleProblems } from "@/lib/data/investigations";

export const metadata = { title: "New Investigation" };

export default async function NewInvestigationPage() {
  const [dataSources, context] = await Promise.all([listDataSources(), getBusinessContext()]);
  return (
    // The flow reads ?problem= from the dashboard, which needs a Suspense boundary.
    <Suspense>
      <NewInvestigationFlow dataSources={dataSources} context={context} examples={listExampleProblems()} />
    </Suspense>
  );
}
