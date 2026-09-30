"use client";

import { ChevronsUpDown, LogIn, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { routes } from "@/lib/routes";
import { appActions, useAppState } from "@/lib/store/app-store";

export function UserMenu() {
  const router = useRouter();
  const { user, company } = useAppState();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link
        href={routes.login}
        className="flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm text-navy-200 hover:bg-navy-800 hover:text-white"
      >
        <LogIn className="h-4 w-4" /> Log in
      </Link>
    );
  }

  function signOut() {
    appActions.signOut();
    router.push(routes.home);
  }

  return (
    <div className="relative">
      {open && (
        <>
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-lg border border-navy-700 bg-navy-800 p-1 shadow-raised">
            <p className="truncate px-2.5 py-2 text-xs text-navy-300">{user.email}</p>
            <Link
              href={routes.settings}
              onClick={() => setOpen(false)}
              className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm text-navy-200 hover:bg-navy-700 hover:text-white"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-sm text-navy-200 hover:bg-navy-700 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-navy-800"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {user.avatarInitial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">{user.name}</span>
          {company && <span className="block truncate text-xs text-navy-300">{company.name}</span>}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-navy-300" />
      </button>
    </div>
  );
}
