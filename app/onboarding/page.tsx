import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "Onboarding" };

export default function OnboardingPage() {
  return <RouteStub title="Let's understand your business." milestone={3} next={{ href: routes.dashboard, label: "Enter Veyra" }} />;
}
