import { NextResponse } from "next/server";

import {
  buildWebhookUrl,
  createRepositoryWebhook,
  getGitHubRepository,
} from "@/lib/github";
import { parseRepositorySlug } from "@/lib/github-webhook";
import { prisma } from "@/lib/prisma";
import { registerPartyRepository } from "@/lib/study/activity";
import type { RegisterRepositoryRequestBody } from "@/types/github";

export const runtime = "nodejs";

export async function GET() {
  const repositories = await prisma.gitHubRepository.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          events: true,
          drafts: true,
        },
      },
    },
  });

  return NextResponse.json({ repositories });
}

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterRepositoryRequestBody;

  if (!body.repository) {
    return NextResponse.json(
      { error: "repository is required. Use owner/repo or a GitHub URL." },
      { status: 400 }
    );
  }

  if (body.partyId) {
    const party = await prisma.party.findUnique({
      where: { id: body.partyId },
      select: { id: true },
    });

    if (!party) {
      return NextResponse.json(
        { error: "partyId does not reference an existing party." },
        { status: 404 }
      );
    }
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

  let repository = await prisma.gitHubRepository.upsert({
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

  let webhook:
    | Awaited<ReturnType<typeof createRepositoryWebhook>>
    | undefined = undefined;
  let webhookError: string | undefined;

  if (body.installWebhook !== false) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    const webhookUrl = body.webhookUrl || buildWebhookUrl();

    if (!process.env.GITHUB_TOKEN || !secret || !webhookUrl) {
      webhookError =
        "GITHUB_TOKEN, GITHUB_WEBHOOK_SECRET, and APP_URL are required to install the webhook automatically.";
    } else {
      try {
        webhook = await createRepositoryWebhook({
          owner,
          repo,
          webhookUrl,
          secret,
        });

        repository = await prisma.gitHubRepository.update({
          where: { id: repository.id },
          data: {
            webhookId: webhook.id,
            webhookUrl: webhook.config?.url ?? webhookUrl,
            webhookActive: webhook.active,
          },
        });
      } catch (error) {
        webhookError =
          error instanceof Error ? error.message : "Failed to create webhook.";
      }
    }
  }

  const partyRepository = body.partyId
    ? await registerPartyRepository({
        partyId: body.partyId,
        repositoryId: repository.id,
      })
    : undefined;

  return NextResponse.json(
    {
      repository,
      partyRepository,
      webhook,
      webhookError,
    },
    { status: 201 }
  );
}
