import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "Welcome" };

export default function AuthPage() {
  return <RouteStub title="Welcome to Veyra" milestone={2} next={{ href: routes.onboarding, label: "Continue" }} />;
}
