import { notFound } from "next/navigation";
import { QuestionList } from "@/components/investigation/QuestionList";
import { getInvestigationWorkspace } from "@/lib/data";

export default async function InvestigationQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getInvestigationWorkspace(id);
  if (!workspace) notFound();
  return (
    <div className="mt-6 max-w-3xl">
      <p className="mb-4 text-sm text-ink-muted">
        What Veyra asked before starting, and your answers. Update an answer if something turns out to be different.
      </p>
      <QuestionList initial={workspace.questions} />
    </div>
  );
}
