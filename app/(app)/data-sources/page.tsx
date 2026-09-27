import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "Data Sources" };

export default function DataSourcesPage() {
  return <RouteStub title="Data Sources" milestone={8} next={{ href: routes.dashboard, label: "Go to dashboard" }} />;
}
