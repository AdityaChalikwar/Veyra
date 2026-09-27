import { RouteStub } from "@/components/dev/RouteStub";
import { routes } from "@/lib/routes";

export const metadata = { title: "Clarifying Questions" };

export default function ClarifyingQuestionsPage() {
  return (
    <RouteStub
      title="Before I investigate, I need to understand a few things."
      milestone={5}
      next={{ href: routes.investigation("dau-decline"), label: "Start Investigation" }}
    />
  );
}
