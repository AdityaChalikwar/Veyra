import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return <RouteStub title="Settings" milestone={8} next={{ href: routes.dashboard, label: "Go to dashboard" }} />;
}
