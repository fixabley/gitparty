import { NextResponse } from "next/server";

import { createGitHubIssueComment } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/server/auth/current-user";
import { formatPlatformAuthoredGitHubComment } from "@/server/study/domain/github-comment";
import type { CreatePlatformActivityCommentRequestBody } from "@/types/study";

export const runtime = "nodejs";

type ActivityCommentRouteContext = {
  params: Promise<{
    partySlug: string;
    activityId: string;
  }>;
};

function requiredBody(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("body is required.");
  }

  return value.trim();
}

function buildPlatformActivityUrl({
  partySlug,
  activityId,
}: {
  partySlug: string;
  activityId: string;
}) {
  const baseUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    return `/parties/${partySlug}#${activityId}`;
  }

  return `${baseUrl.replace(/\/$/, "")}/parties/${partySlug}#${activityId}`;
}

export async function POST(
  request: Request,
  { params }: ActivityCommentRouteContext
) {
  const user = await requireCurrentUser();
  const { partySlug, activityId } = await params;
  const body = (await request.json()) as CreatePlatformActivityCommentRequestBody;

  try {
    const bodyMarkdown = requiredBody(body.body);

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
        profiles: {
          where: { userId: user.id },
          select: { nickname: true },
        },
      },
    });

    if (!party || party.memberships.length === 0) {
      return NextResponse.json(
        { error: "Active party membership is required." },
        { status: 403 }
      );
    }

    const activity = await prisma.partyActivity.findFirst({
      where: {
        id: activityId,
        partyId: party.id,
      },
      include: {
        repository: true,
      },
    });

    if (!activity || !activity.repository || !activity.githubNumber) {
      return NextResponse.json(
        { error: "This activity cannot be commented on through GitHub yet." },
        { status: 400 }
      );
    }

    const partyRepository = await prisma.partyRepository.findUnique({
      where: {
        partyId_repositoryId: {
          partyId: party.id,
          repositoryId: activity.repository.id,
        },
      },
    });

    if (
      !partyRepository ||
      partyRepository.status !== "ACTIVE" ||
      !partyRepository.appInstallationId
    ) {
      return NextResponse.json(
        { error: "GitHub App installation is required before commenting." },
        { status: 409 }
      );
    }

    const nickname = party.profiles[0]?.nickname ?? user.name ?? "anonymous";
    const platformUrl = buildPlatformActivityUrl({ partySlug, activityId });
    const githubBody = formatPlatformAuthoredGitHubComment({
      nickname,
      platformUrl,
      bodyMarkdown,
    });
    const githubComment = await createGitHubIssueComment({
      owner: activity.repository.owner,
      repo: activity.repository.name,
      issueNumber: activity.githubNumber,
      body: githubBody,
      installationId: partyRepository.appInstallationId,
    });

    const comment = await prisma.platformComment.create({
      data: {
        partyId: party.id,
        activityId: activity.id,
        authorUserId: user.id,
        nicknameSnapshot: nickname,
        bodyMarkdown,
        platformUrl,
        githubUrl: githubComment.html_url,
        githubCommentId: String(githubComment.id),
      },
    });

    return NextResponse.json({ comment, githubComment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}
