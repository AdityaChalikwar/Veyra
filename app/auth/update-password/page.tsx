import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Choose a new password" };

/** Reached from a password reset email: the callback route has already signed the user in. */
export default async function UpdatePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/auth?mode=login&error=link");
  return <UpdatePasswordForm email={session.user.email} />;
}
