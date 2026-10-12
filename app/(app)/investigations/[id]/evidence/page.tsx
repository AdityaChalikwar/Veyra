import { EvidenceLibrary } from "@/components/evidence/EvidenceLibrary";
import { listAvailableSnapshots } from "@/lib/data/sources";

export default async function Page() {
  return <EvidenceLibrary availableSnapshots={await listAvailableSnapshots()} />;
}
