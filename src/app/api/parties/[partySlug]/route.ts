import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/current-user";

export const runtime = "nodejs";

type PartyRouteContext = {
  params: Promise<{
    partySlug: string;
  }>;
};

export async function GET(_request: Request, { params }: PartyRouteContext) {
  const { partySlug } = await params;
  const user = await getCurrentUser();

  const party = await prisma.party.findUnique({
    where: { slug: partySlug },
    include: {
      parent: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
      miniParties: {
        where: {
          OR: [
            { visibility: "PUBLIC" },
            user
              ? {
                  memberships: {
                    some: {
                      userId: user.id,
                      status: "ACTIVE",
                    },
                  },
                }
              : { id: "__never__" },
          ],
        },
        orderBy: { updatedAt: "desc" },
        include: {
          tags: { include: { tag: true } },
          _count: {
            select: {
              activities: true,
              memberships: true,
            },
          },
        },
      },
      tags: {
        include: { tag: true },
      },
      memberships: {
        where: { status: "ACTIVE" },
        include: {
          user: {
            select: {
              id: true,
              image: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
      profiles: true,
      repositories: {
        include: {
          repository: true,
          addedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          repository: true,
          comments: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      _count: {
        select: {
          activities: true,
          memberships: true,
          repositories: true,
        },
      },
    },
  });

  if (!party) {
    return NextResponse.json({ error: "Party was not found." }, { status: 404 });
  }

  const viewerIsMember = Boolean(
    user &&
      party.memberships.some((membership) => membership.userId === user.id)
  );

  if (party.visibility === "PRIVATE" && !viewerIsMember) {
    return NextResponse.json({ error: "Party was not found." }, { status: 404 });
  }

  return NextResponse.json({ party, viewerIsMember });
}
