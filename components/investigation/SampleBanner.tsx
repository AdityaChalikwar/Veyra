import { FlaskConical } from "lucide-react";
import { DeleteInvestigationButton } from "./DeleteInvestigationButton";

/** Marks the demo investigation, so its fictional data is never mistaken for the team's own. */
export function SampleBanner({ investigationId }: { investigationId: string }) {
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex gap-2 text-[13px] text-violet-700">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <b className="font-semibold">Sample investigation.</b> A real run of Veyra on Northwind Home, the fictional retailer behind the
          Demo ERP: from the problem through validation and research to the decision. It stays as it is; try the full demo from Home to run it
          yourself.
        </span>
      </p>
      <DeleteInvestigationButton investigationId={investigationId} title="the sample investigation" label="Remove sample" />
    </div>
  );
}
