import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "Business Context" };

export default function BusinessContextPage() {
  return <RouteStub title="Business Context" milestone={8} next={{ href: routes.dashboard, label: "Go to dashboard" }} />;
}
