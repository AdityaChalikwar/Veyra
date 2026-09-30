import { notFound } from "next/navigation";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { getInvestigationSummary } from "@/lib/data";

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const investigation = await getInvestigationSummary(id);
  if (!investigation) notFound();

  return <PagePlaceholder title={`${investigation.title} Investigation`} description={investigation.headline} milestone={6} />;
}
