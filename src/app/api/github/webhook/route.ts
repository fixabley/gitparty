import { NextResponse } from "next/server";

import { verifyGitHubSignature } from "@/lib/github";
import { summarizeGitHubWebhook } from "@/lib/github-webhook";
import { prisma } from "@/lib/prisma";
import type { GitHubWebhookPayload } from "@/types/github";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "GITHUB_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyGitHubSignature({ rawBody, signature, secret })) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = request.headers.get("x-github-event") ?? "unknown";
  const deliveryId = request.headers.get("x-github-delivery");

  if (!deliveryId) {
    return NextResponse.json(
      { error: "x-github-delivery header is required." },
      { status: 400 }
    );
  }

  const payload = JSON.parse(rawBody) as GitHubWebhookPayload;
  const fullName = payload.repository?.full_name;
  const owner = payload.repository?.owner?.login;
  const name = payload.repository?.name;
  const summary = summarizeGitHubWebhook({ event, payload });

  let repositoryId: string | undefined;

  if (fullName && owner && name) {
    const repository = await prisma.gitHubRepository.upsert({
      where: { fullName },
      update: {
        owner,
        name,
        htmlUrl: payload.repository?.html_url,
        defaultBranch: payload.repository?.default_branch,
      },
      create: {
        owner,
        name,
        fullName,
        htmlUrl: payload.repository?.html_url,
        defaultBranch: payload.repository?.default_branch,
      },
    });

    repositoryId = repository.id;
  }

  const stored = await prisma.gitHubWebhookEvent.upsert({
    where: { deliveryId },
    update: {
      repositoryId,
      event,
      action: payload.action,
      sender: payload.sender?.login,
      title: summary.title,
      summary: summary.summary,
      ref: summary.ref,
      sha: summary.sha,
      htmlUrl: summary.htmlUrl,
      rawPayload: rawBody,
    },
    create: {
      repositoryId,
      deliveryId,
      event,
      action: payload.action,
      sender: payload.sender?.login,
      title: summary.title,
      summary: summary.summary,
      ref: summary.ref,
      sha: summary.sha,
      htmlUrl: summary.htmlUrl,
      rawPayload: rawBody,
    },
  });

  return NextResponse.json({
    ok: true,
    id: stored.id,
  });
}
