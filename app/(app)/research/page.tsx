import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "Research Library" };

export default function ResearchLibraryPage() {
  return <RouteStub title="Research Library" milestone={8} next={{ href: routes.dashboard, label: "Go to dashboard" }} />;
}
