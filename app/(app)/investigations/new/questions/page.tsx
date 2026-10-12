import { ClarifyingQuestions } from "@/components/new-investigation/ClarifyingQuestions";
import { listDataSources } from "@/lib/data";

export const metadata = { title: "Contextual Questions" };

/** Questions are written by an AI call from this page; give it room to finish. */
export const maxDuration = 120;

export default async function ClarifyingQuestionsPage() {
  const sources = await listDataSources();
  return <ClarifyingQuestions sourceNames={Object.fromEntries(sources.map((s) => [s.id, s.name]))} />;
}
