import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication is required.");
  }

  return user;
}
