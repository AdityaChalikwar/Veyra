import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export default function NotFound() {
  return <RouteStub title="We couldn't find that page" next={{ href: routes.dashboard, label: "Go to dashboard" }} />;
}
