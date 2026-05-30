import { NextResponse } from "next/server";

import {
  buildGitHubAppInstallUrl,
  getGitHubRepository,
} from "@/lib/github";
import { parseRepositorySlug } from "@/lib/github-webhook";
import { prisma } from "@/lib/prisma";
import { createStudyServices } from "@/server/study/infrastructure/services";
import { requireCurrentUser } from "@/server/auth/current-user";
import type { RegisterPartyRepositoryRequestBody } from "@/types/study";

export const runtime = "nodejs";

type PartyRepositoryRouteContext = {
  params: Promise<{
    partySlug: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: PartyRepositoryRouteContext
) {
  const user = await requireCurrentUser();
  const { partySlug } = await params;
  const body = (await request.json()) as RegisterPartyRepositoryRequestBody;

  if (!body.repository) {
    return NextResponse.json(
      { error: "repository is required. Use owner/repo or a GitHub URL." },
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
        },
        select: { id: true },
      },
    },
  });

  if (!party || party.memberships.length === 0) {
    return NextResponse.json(
      { error: "Active party membership is required." },
      { status: 403 }
    );
  }

  const { owner, repo } = parseRepositorySlug({ input: body.repository });

  let metadata:
    | Awaited<ReturnType<typeof getGitHubRepository>>
    | undefined = undefined;

  try {
    metadata = await getGitHubRepository({ owner, repo });
  } catch {
    metadata = undefined;
  }

  const repository = await prisma.gitHubRepository.upsert({
    where: { fullName: `${owner}/${repo}` },
    update: {
      owner,
      name: repo,
      htmlUrl: metadata?.html_url ?? `https://github.com/${owner}/${repo}`,
      defaultBranch: metadata?.default_branch,
    },
    create: {
      owner,
      name: repo,
      fullName: `${owner}/${repo}`,
      htmlUrl: metadata?.html_url ?? `https://github.com/${owner}/${repo}`,
      defaultBranch: metadata?.default_branch,
    },
  });

  const installUrl = buildGitHubAppInstallUrl();
  const services = createStudyServices();
  const partyRepository = await services.activity.registerPartyRepository({
    partyId: party.id,
    repositoryId: repository.id,
    registeredByUserId: user.id,
    installUrl,
  });

  return NextResponse.json(
    {
      repository,
      partyRepository,
      installUrl,
    },
    { status: 201 }
  );
}
