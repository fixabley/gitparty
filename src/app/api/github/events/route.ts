import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repositoryId = searchParams.get("repositoryId") ?? undefined;
  const take = Math.min(Number(searchParams.get("take") ?? 25), 100);

  const events = await prisma.gitHubWebhookEvent.findMany({
    where: repositoryId ? { repositoryId } : undefined,
    orderBy: { receivedAt: "desc" },
    take,
    include: {
      repository: {
        select: {
          fullName: true,
          htmlUrl: true,
        },
      },
    },
  });

  return NextResponse.json({ events });
}
