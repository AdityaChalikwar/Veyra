import { ClarifyingQuestions } from "@/components/new-investigation/ClarifyingQuestions";
import { listDataSources } from "@/lib/data";

export const metadata = { title: "Contextual Questions" };

export default async function ClarifyingQuestionsPage() {
  const sources = await listDataSources();
  return <ClarifyingQuestions sourceNames={Object.fromEntries(sources.map((s) => [s.id, s.name]))} />;
}
