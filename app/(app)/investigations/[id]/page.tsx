import { notFound } from "next/navigation";
import { RouteStub } from "@/components/dev/RouteStub";
import { getInvestigationSummary } from "@/lib/data";
import { routes } from "@/lib/routes";

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const investigation = await getInvestigationSummary(id);
  if (!investigation) notFound();

  return (
    <RouteStub
      title={`${investigation.title} Investigation`}
      milestone={6}
      next={{ href: routes.memory, label: "Business Memory" }}
    />
  );
}
