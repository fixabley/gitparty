import { NextResponse } from "next/server";

import {
  getGitHubPullRequest,
  listGitHubPullRequestFiles,
} from "@/lib/github";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repositoryId = searchParams.get("repositoryId");
  const number = Number(searchParams.get("number"));

  if (!repositoryId || !Number.isInteger(number) || number < 1) {
    return NextResponse.json(
      { error: "repositoryId and positive PR number are required." },
      { status: 400 }
    );
  }

  const repository = await prisma.gitHubRepository.findUnique({
    where: { id: repositoryId },
  });

  if (!repository) {
    return NextResponse.json(
      { error: "Repository was not found." },
      { status: 404 }
    );
  }

  const [pullRequest, files] = await Promise.all([
    getGitHubPullRequest({
      owner: repository.owner,
      repo: repository.name,
      pullNumber: number,
    }),
    listGitHubPullRequestFiles({
      owner: repository.owner,
      repo: repository.name,
      pullNumber: number,
    }),
  ]);

  return NextResponse.json({
    repository,
    pullRequest,
    files,
  });
}
