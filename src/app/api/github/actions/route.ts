import { NextResponse } from "next/server";

import {
  createGitHubCommitComment,
  createGitHubIssue,
  createGitHubIssueComment,
  createGitHubPullRequest,
  createOrUpdateMarkdownFile,
} from "@/lib/github";
import { prisma } from "@/lib/prisma";
import type { PublishGitHubActionRequestBody } from "@/types/github";

export const runtime = "nodejs";

type RequiredStringParams = {
  value: unknown;
  label: string;
};

type RequiredNumberParams = RequiredStringParams;

function required({ value, label }: RequiredStringParams) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function requiredNumber({ value, label }: RequiredNumberParams) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return value;
}

export async function POST(request: Request) {
  const body = (await request.json()) as PublishGitHubActionRequestBody;

  try {
    const repositoryId = required({
      value: body.repositoryId,
      label: "repositoryId",
    });
    const type = required(
      {
        value: body.type,
        label: "type",
      }
    ) as NonNullable<PublishGitHubActionRequestBody["type"]>;

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
        type,
        title: body.title,
        body: body.body,
        targetNumber: body.targetNumber,
        targetSha: body.targetSha,
        baseBranch: body.baseBranch,
        headBranch: body.headBranch,
        path: body.path,
        commitMessage: body.commitMessage,
        fileContent: body.fileContent,
      },
    });

    let githubUrl: string | undefined;

    try {
      if (type === "ISSUE") {
        const issue = await createGitHubIssue({
          owner: repository.owner,
          repo: repository.name,
          title: required({ value: body.title, label: "title" }),
          body: body.body ?? "",
        });

        githubUrl = issue.html_url;
      }

      if (type === "PULL_REQUEST") {
        const pullRequest = await createGitHubPullRequest({
          owner: repository.owner,
          repo: repository.name,
          title: required({ value: body.title, label: "title" }),
          body: body.body ?? "",
          head: required({ value: body.headBranch, label: "headBranch" }),
          base: required({ value: body.baseBranch, label: "baseBranch" }),
        });

        githubUrl = pullRequest.html_url;
      }

      if (type === "COMMENT") {
        if (body.commentTarget === "commit") {
          const comment = await createGitHubCommitComment({
            owner: repository.owner,
            repo: repository.name,
            sha: required({ value: body.targetSha, label: "targetSha" }),
            body: required({ value: body.body, label: "body" }),
          });

          githubUrl = comment.html_url;
        } else {
          const comment = await createGitHubIssueComment({
            owner: repository.owner,
            repo: repository.name,
            issueNumber: requiredNumber({
              value: body.targetNumber,
              label: "targetNumber",
            }),
            body: required({ value: body.body, label: "body" }),
          });

          githubUrl = comment.html_url;
        }
      }

      if (type === "COMMIT") {
        const commit = await createOrUpdateMarkdownFile({
          owner: repository.owner,
          repo: repository.name,
          branch:
            body.headBranch?.trim() ||
            repository.defaultBranch ||
            body.baseBranch?.trim() ||
            "main",
          path: required({ value: body.path, label: "path" }),
          message: required({
            value: body.commitMessage,
            label: "commitMessage",
          }),
          content: required({ value: body.fileContent, label: "fileContent" }),
        });

        githubUrl = commit.commit?.html_url ?? commit.content?.html_url;
      }

      const sent = await prisma.gitHubDraft.update({
        where: { id: draft.id },
        data: {
          status: "SENT",
          githubUrl,
        },
      });

      return NextResponse.json({ draft: sent, githubUrl }, { status: 201 });
    } catch (error) {
      const failed = await prisma.gitHubDraft.update({
        where: { id: draft.id },
        data: {
          status: "FAILED",
          error:
            error instanceof Error
              ? error.message
              : "Failed to publish GitHub action.",
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
