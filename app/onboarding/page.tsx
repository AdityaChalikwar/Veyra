import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { getWorkspace, requireUser } from "@/lib/auth";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const session = await requireUser();
  // Running onboarding again updates the existing company profile.
  const company = await getWorkspace();
  return <OnboardingFlow firstName={session.user.name.split(" ")[0]} initial={company} />;
}
