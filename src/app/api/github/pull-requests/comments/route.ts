import { NextResponse } from "next/server";

import { createGitHubPullRequestReviewComment } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import type { CreatePullRequestReviewCommentRequestBody } from "@/types/github";

export const runtime = "nodejs";

type RequiredStringParams = {
  value: unknown;
  label: string;
};

type RequiredNumberParams = RequiredStringParams;

function stringValue({ value, label }: RequiredStringParams) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function numberValue({ value, label }: RequiredNumberParams) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return value;
}

export async function POST(request: Request) {
  const body =
    (await request.json()) as CreatePullRequestReviewCommentRequestBody;

  try {
    const repositoryId = stringValue({
      value: body.repositoryId,
      label: "repositoryId",
    });
    const pullNumber = numberValue({
      value: body.pullNumber,
      label: "pullNumber",
    });
    const commentBody = stringValue({ value: body.body, label: "body" });
    const commitId = stringValue({ value: body.commitId, label: "commitId" });
    const path = stringValue({ value: body.path, label: "path" });
    const line = numberValue({ value: body.line, label: "line" });
    const side = body.side ?? "RIGHT";

    const repository = await prisma.gitHubRepository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      return NextResponse.json(
        { error: "Repository was not found." },
        { status: 404 }
      );
    }

    const draft = await prisma.gitHubDraft.create({
      data: {
        repositoryId,
        type: "COMMENT",
        body: commentBody,
        targetNumber: pullNumber,
        targetSha: commitId,
        path,
      },
    });

    try {
      const comment = await createGitHubPullRequestReviewComment({
        owner: repository.owner,
        repo: repository.name,
        pullNumber,
        body: commentBody,
        commitId,
        path,
        line,
        side,
        startLine: body.startLine,
        startSide: body.startSide,
      });

      const sent = await prisma.gitHubDraft.update({
        where: { id: draft.id },
        data: {
          status: "SENT",
          githubUrl: comment.html_url,
        },
      });

      return NextResponse.json(
        {
          comment,
          draft: sent,
        },
        { status: 201 }
      );
    } catch (error) {
      const failed = await prisma.gitHubDraft.update({
        where: { id: draft.id },
        data: {
          status: "FAILED",
          error:
            error instanceof Error
              ? error.message
              : "Failed to create pull request comment.",
        },
      });

      return NextResponse.json(
        {
          error: failed.error,
          draft: failed,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid request.",
      },
      { status: 400 }
    );
  }
}
