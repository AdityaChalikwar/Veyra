import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceSetup } from "@/components/data-sources/SourceSetup";
import { PageContainer, PageHeader } from "@/components/org/PageHeader";
import { getConnectedSource } from "@/lib/data/sources";
import { routes } from "@/lib/routes";

/** Syncing reads and checks every row of the chosen datasets; give it room. */
export const maxDuration = 120;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = UUID.test(id) ? await getConnectedSource(id) : undefined;
  return { title: source?.name ?? "Data source" };
}

export default async function DataSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = UUID.test(id) ? await getConnectedSource(id) : undefined;
  if (!source) notFound();

  return (
    <PageContainer>
      <Link href={routes.dataSources} className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Data Sources
      </Link>
      <div className="mt-4">
        <PageHeader
          title={source.name}
          description={
            source.connector === "demo-erp"
              ? "A fictional retailer's ERP, set up exactly as a real one would be. Its data is generated, not your company's."
              : undefined
          }
        />
      </div>
      <SourceSetup source={source} />
    </PageContainer>
  );
}
