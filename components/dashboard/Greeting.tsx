"use client";

import { useAppState } from "@/lib/store/app-store";

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Greeting() {
  const { user } = useAppState();
  const firstName = user?.name.split(" ")[0];
  return (
    // The hour depends on the viewer's clock, so the server's guess may differ.
    <h1 suppressHydrationWarning className="text-2xl font-semibold tracking-tight sm:text-[28px]">
      {greetingFor(new Date().getHours())}
      {firstName ? `, ${firstName}` : ""}.
    </h1>
  );
}
