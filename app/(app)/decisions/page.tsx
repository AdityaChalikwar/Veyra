import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "Decision Log" };

export default function DecisionLogPage() {
  return <RouteStub title="Decision Log" milestone={8} next={{ href: routes.dashboard, label: "Go to dashboard" }} />;
}
