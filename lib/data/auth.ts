/**
 * Simulated authentication. Replace these with real OAuth / email auth later;
 * the screens only rely on the returned `User`.
 */
import { mockUser } from "@/mocks/user";
import type { User } from "@/lib/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function signInWithGoogle(): Promise<User> {
  await delay(700);
  return mockUser;
}

export async function signInWithEmail(input: { email: string; name?: string }): Promise<User> {
  await delay(700);
  const name = input.name?.trim() || mockUser.name;
  return {
    ...mockUser,
    email: input.email.trim(),
    name,
    avatarInitial: name.charAt(0).toUpperCase(),
  };
}
