import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-ink-muted md:flex" aria-label="Main">
          <a href="#how-it-works" className="hover:text-ink">How it works</a>
          <a href="#why-veyra" className="hover:text-ink">Why Veyra</a>
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href={routes.login} variant="ghost" size="sm" className="hidden sm:inline-flex">
            Log in
          </ButtonLink>
          <ButtonLink href={routes.signup} size="sm">
            Start an Investigation
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
