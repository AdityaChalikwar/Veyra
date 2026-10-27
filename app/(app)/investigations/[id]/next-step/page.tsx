import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/** The Next Step tab was replaced by the "Next" bar on every tab; old links land on the Overview. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(routes.investigation(id));
}
