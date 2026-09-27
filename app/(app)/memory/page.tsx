import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "Business Memory" };

export default function BusinessMemoryPage() {
  return <RouteStub title="Business Memory" milestone={8} next={{ href: routes.dashboard, label: "Go to dashboard" }} />;
}
