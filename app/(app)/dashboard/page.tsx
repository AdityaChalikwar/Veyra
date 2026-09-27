import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "Home" };

export default function DashboardPage() {
  return <RouteStub title="Dashboard" milestone={4} next={{ href: routes.newInvestigation, label: "Start Investigation" }} />;
}
