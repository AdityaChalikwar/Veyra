import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "New Investigation" };

export default function NewInvestigationPage() {
  return <RouteStub title="What are you trying to solve?" milestone={5} next={{ href: routes.clarifyingQuestions, label: "Continue" }} />;
}
