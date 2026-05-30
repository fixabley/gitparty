import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/server/auth/current-user";
import { createStudyServices } from "@/server/study/infrastructure/services";
import type { ActivatePartyRepositoryRequestBody } from "@/types/study";

export const runtime = "nodejs";

type PartyRepositoryInstallationRouteContext = {
  params: Promise<{
    partySlug: string;
    repositoryId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: PartyRepositoryInstallationRouteContext
) {
  const user = await requireCurrentUser();
  const { partySlug, repositoryId } = await params;
  const body = (await request.json()) as ActivatePartyRepositoryRequestBody;

  const installationId = body.installationId;

  if (typeof installationId !== "number" || !Number.isInteger(installationId)) {
    return NextResponse.json(
      { error: "installationId must be an integer." },
      { status: 400 }
    );
  }

  const party = await prisma.party.findUnique({
    where: { slug: partySlug },
    include: {
      memberships: {
        where: {
          userId: user.id,
          status: "ACTIVE",
          role: {
            in: ["OWNER", "MODERATOR"],
          },
        },
        select: { id: true },
      },
    },
  });

  if (!party || party.memberships.length === 0) {
    return NextResponse.json(
      { error: "Party owner or moderator role is required." },
      { status: 403 }
    );
  }

  const services = createStudyServices();
  const partyRepository = await services.activity.activatePartyRepository({
    partyId: party.id,
    repositoryId,
    appInstallationId: installationId,
  });

  return NextResponse.json({ partyRepository });
}
