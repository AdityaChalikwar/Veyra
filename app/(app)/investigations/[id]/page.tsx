import { notFound } from "next/navigation";
import { ChartCard } from "@/components/investigation/ChartCard";
import { DauTrendChart } from "@/components/investigation/DauTrendChart";
import { InvestigationMap } from "@/components/investigation/InvestigationMap";
import { KpiCard } from "@/components/investigation/KpiCard";
import { SegmentChart, SegmentLegend } from "@/components/investigation/SegmentChart";
import { getInvestigationWorkspace } from "@/lib/data";
import { formatChange } from "@/lib/format";

/** Overview tab. */
export default async function InvestigationOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getInvestigationWorkspace(id);
  if (!workspace) notFound();
  const { kpis, trend, segments, map, evidence } = workspace;
  const sourceName = (evidenceId?: string) => evidence.find((e) => e.id === evidenceId)?.name;

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={trend.title}
          source={sourceName(trend.sourceEvidenceId)}
          table={{
            caption: `${trend.metric} by month`,
            columns: ["Month", `DAU (${trend.unit})`, "Note"],
            rows: trend.points.map((p) => [p.period, p.value, p.annotation ?? ""]),
          }}
        >
          <DauTrendChart points={trend.points} unit={trend.unit} metric={trend.metric} />
        </ChartCard>

        <ChartCard
          title={segments.title}
          legend={<SegmentLegend beforeLabel={segments.beforeLabel} afterLabel={segments.afterLabel} />}
          source={sourceName(segments.sourceEvidenceId)}
          table={{
            caption: "Daily active users by acquisition segment",
            columns: ["Segment", segments.beforeLabel, segments.afterLabel, "Change"],
            rows: segments.rows.map((r) => [r.segment, `${r.before}K`, `${r.after}K`, formatChange(r.change)]),
          }}
        >
          <SegmentChart rows={segments.rows} beforeLabel={segments.beforeLabel} afterLabel={segments.afterLabel} unit="K" />
        </ChartCard>
      </div>

      <InvestigationMap map={map} />
    </div>
  );
}
