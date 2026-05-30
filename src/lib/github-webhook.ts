import "server-only";

import type {
  GitHubWebhookPayload,
  GitHubWebhookSummary,
  RepositorySlug,
} from "@/types/github";

type SummarizeGitHubWebhookParams = {
  event: string;
  payload: GitHubWebhookPayload;
};

type ParseRepositorySlugParams = {
  input: string;
};

type FirstLineParams = {
  value?: string;
};

function firstLine({ value }: FirstLineParams) {
  return value?.split(/\r?\n/)[0]?.trim();
}

export function summarizeGitHubWebhook({
  event,
  payload,
}: SummarizeGitHubWebhookParams): GitHubWebhookSummary {
  if (event === "push") {
    const commitCount = payload.commits?.length ?? 0;
    return {
      title: firstLine({ value: payload.head_commit?.message }) ?? "Push",
      summary: `${commitCount} commit${commitCount === 1 ? "" : "s"} pushed to ${
        payload.ref ?? "unknown ref"
      }`,
      ref: payload.ref,
      sha: payload.after ?? payload.head_commit?.id,
      htmlUrl: payload.head_commit?.url ?? payload.repository?.html_url,
    };
  }

  if (event === "pull_request") {
    return {
      title: payload.pull_request?.title ?? "Pull request",
      summary: `PR #${payload.pull_request?.number ?? "?"} ${
        payload.action ?? "updated"
      }`,
      number: payload.pull_request?.number,
      htmlUrl: payload.pull_request?.html_url,
    };
  }

  if (event === "issues") {
    return {
      title: payload.issue?.title ?? "Issue",
      summary: `Issue #${payload.issue?.number ?? "?"} ${
        payload.action ?? "updated"
      }`,
      number: payload.issue?.number,
      htmlUrl: payload.issue?.html_url,
    };
  }

  if (event === "issue_comment") {
    const subject = payload.issue?.pull_request ? "PR" : "Issue";

    return {
      title: firstLine({ value: payload.comment?.body }) ?? `${subject} comment`,
      summary: `${subject} #${payload.issue?.number ?? "?"} comment ${
        payload.action ?? "updated"
      }`,
      number: payload.issue?.number,
      htmlUrl: payload.comment?.html_url ?? payload.issue?.html_url,
    };
  }

  if (event === "commit_comment") {
    return {
      title: firstLine({ value: payload.comment?.body }) ?? "Commit comment",
      summary: `Commit comment ${payload.action ?? "updated"}`,
      htmlUrl: payload.comment?.html_url,
    };
  }

  if (event === "pull_request_review_comment") {
    return {
      title: firstLine({ value: payload.comment?.body }) ?? "Review comment",
      summary: `PR review comment ${payload.action ?? "updated"}`,
      htmlUrl: payload.comment?.html_url,
    };
  }

  return {
    title: event,
    summary: payload.action ?? "received",
    htmlUrl: payload.repository?.html_url,
  };
}

export function parseRepositorySlug({
  input,
}: ParseRepositorySlugParams): RepositorySlug {
  const normalized = input
    .trim()
    .replace(/^https:\/\/github\.com\//, "")
    .replace(/^git@github\.com:/, "")
    .replace(/\.git$/, "")
    .replace(/^\/+|\/+$/g, "");

  const [owner, repo] = normalized.split("/");

  if (!owner || !repo || normalized.split("/").length !== 2) {
    throw new Error("Repository must be formatted as owner/repo or a GitHub URL.");
  }

  return { owner, repo };
}
