import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <p>© 2026 Veyra. Give us the problem. We&rsquo;ll figure out what to do next.</p>
      </div>
    </footer>
  );
}
