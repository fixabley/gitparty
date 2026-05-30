import "server-only";

import { createHmac, sign, timingSafeEqual } from "node:crypto";

import type {
  CreateGitHubCommitCommentParams,
  CreateGitHubIssueCommentParams,
  CreateGitHubIssueParams,
  CreateGitHubPullRequestParams,
  CreateGitHubPullRequestReviewCommentParams,
  CreateOrUpdateMarkdownFileParams,
  CreateRepositoryWebhookParams,
  GitHubApiRequestOptions,
  GitHubAppInstallationTokenResponse,
  GitHubCommentResponse,
  GitHubContentResponse,
  GitHubFileLookupParams,
  GitHubIssueResponse,
  GitHubPullRequestDetailsResponse,
  GitHubPullRequestFile,
  GitHubPullRequestLookupParams,
  GitHubPullRequestResponse,
  GitHubRepositoryCoordinates,
  GitHubRepositoryResponse,
  GitHubWebhookResponse,
  VerifyGitHubSignatureParams,
} from "@/types/github";

const API_VERSION = process.env.GITHUB_API_VERSION ?? "2026-03-10";
const API_BASE_URL = "https://api.github.com";

export const GITHUB_WEBHOOK_EVENTS = [
  "push",
  "pull_request",
  "issues",
  "issue_comment",
  "commit_comment",
  "pull_request_review_comment",
] as const;

function githubToken() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is required for GitHub write operations.");
  }

  return token;
}

function githubAppId() {
  const appId = process.env.GITHUB_APP_ID;

  if (!appId) {
    throw new Error("GITHUB_APP_ID is required for GitHub App operations.");
  }

  return appId;
}

function githubAppPrivateKey() {
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY is required for GitHub App operations."
    );
  }

  return privateKey.replace(/\\n/g, "\n");
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function createGitHubAppJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "RS256", typ: "JWT" });
  const payload = base64UrlJson({
    iat: now - 60,
    exp: now + 9 * 60,
    iss: githubAppId(),
  });
  const signingInput = `${header}.${payload}`;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput), {
    key: githubAppPrivateKey(),
  }).toString("base64url");

  return `${signingInput}.${signature}`;
}

async function getGitHubAppInstallationToken(installationId: number) {
  const response = await fetch(
    `${API_BASE_URL}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${createGitHubAppJwt()}`,
        "X-GitHub-Api-Version": API_VERSION,
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `GitHub App token ${response.status} ${response.statusText}: ${message}`
    );
  }

  return (await response.json()) as GitHubAppInstallationTokenResponse;
}

async function githubRequest<T>(
  path: string,
  init: GitHubApiRequestOptions = {}
) {
  const token = init.installationId
    ? (await getGitHubAppInstallationToken(init.installationId)).token
    : init.tokenRequired === false
      ? process.env.GITHUB_TOKEN
      : githubToken();
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/vnd.github+json");
  headers.set("X-GitHub-Api-Version", API_VERSION);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `GitHub API ${response.status} ${response.statusText}: ${message}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getGitHubRepository({
  owner,
  repo,
}: GitHubRepositoryCoordinates) {
  return githubRequest<GitHubRepositoryResponse>(`/repos/${owner}/${repo}`, {
    tokenRequired: false,
  });
}

export async function createRepositoryWebhook({
  owner,
  repo,
  webhookUrl,
  secret,
}: CreateRepositoryWebhookParams) {
  return githubRequest<GitHubWebhookResponse>(`/repos/${owner}/${repo}/hooks`, {
    method: "POST",
    body: JSON.stringify({
      name: "web",
      active: true,
      events: GITHUB_WEBHOOK_EVENTS,
      config: {
        url: webhookUrl,
        content_type: "json",
        secret,
        insecure_ssl: "0",
      },
    }),
  });
}

export async function createGitHubIssue({
  owner,
  repo,
  title,
  body,
  installationId,
}: CreateGitHubIssueParams) {
  return githubRequest<GitHubIssueResponse>(`/repos/${owner}/${repo}/issues`, {
    method: "POST",
    installationId,
    body: JSON.stringify({ title, body }),
  });
}

export async function createGitHubPullRequest({
  owner,
  repo,
  title,
  body,
  head,
  base,
  installationId,
}: CreateGitHubPullRequestParams) {
  return githubRequest<GitHubPullRequestResponse>(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    installationId,
    body: JSON.stringify({ title, body, head, base }),
  });
}

export async function getGitHubPullRequest({
  owner,
  repo,
  pullNumber,
}: GitHubPullRequestLookupParams) {
  return githubRequest<GitHubPullRequestDetailsResponse>(
    `/repos/${owner}/${repo}/pulls/${pullNumber}`
  );
}

export async function listGitHubPullRequestFiles({
  owner,
  repo,
  pullNumber,
}: GitHubPullRequestLookupParams) {
  return githubRequest<GitHubPullRequestFile[]>(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`
  );
}

export async function createGitHubIssueComment({
  owner,
  repo,
  issueNumber,
  body,
  installationId,
}: CreateGitHubIssueCommentParams) {
  return githubRequest<GitHubCommentResponse>(
    `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      installationId,
      body: JSON.stringify({ body }),
    }
  );
}

export async function createGitHubPullRequestReviewComment({
  owner,
  repo,
  pullNumber,
  body,
  commitId,
  path,
  line,
  side = "RIGHT",
  startLine,
  startSide,
  installationId,
}: CreateGitHubPullRequestReviewCommentParams) {
  return githubRequest<GitHubCommentResponse>(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/comments`,
    {
      method: "POST",
      installationId,
      body: JSON.stringify({
        body,
        commit_id: commitId,
        path,
        line,
        side,
        ...(startLine ? { start_line: startLine } : {}),
        ...(startSide ? { start_side: startSide } : {}),
      }),
    }
  );
}

export async function createGitHubCommitComment({
  owner,
  repo,
  sha,
  body,
  installationId,
}: CreateGitHubCommitCommentParams) {
  return githubRequest<GitHubCommentResponse>(
    `/repos/${owner}/${repo}/commits/${sha}/comments`,
    {
      method: "POST",
      installationId,
      body: JSON.stringify({ body }),
    }
  );
}

async function getFileSha({
  owner,
  repo,
  path,
  branch,
}: GitHubFileLookupParams) {
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  try {
    const content = await githubRequest<{ sha?: string }>(
      `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`
    );

    return content.sha;
  } catch (error) {
    if (error instanceof Error && error.message.includes("GitHub API 404")) {
      return undefined;
    }

    throw error;
  }
}

export async function createOrUpdateMarkdownFile({
  owner,
  repo,
  branch,
  path,
  message,
  content,
  installationId,
}: CreateOrUpdateMarkdownFileParams) {
  const sha = await getFileSha({ owner, repo, path, branch });
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return githubRequest<GitHubContentResponse>(
    `/repos/${owner}/${repo}/contents/${encodedPath}`,
    {
      method: "PUT",
      installationId,
      body: JSON.stringify({
        message,
        content: Buffer.from(content, "utf8").toString("base64"),
        branch,
        ...(sha ? { sha } : {}),
      }),
    }
  );
}

export function verifyGitHubSignature({
  rawBody,
  signature,
  secret,
}: VerifyGitHubSignatureParams) {
  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function buildWebhookUrl() {
  const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL;

  if (!appUrl) {
    return undefined;
  }

  return `${appUrl.replace(/\/$/, "")}/api/github/webhook`;
}

export function buildGitHubAppInstallUrl() {
  const slug = process.env.GITHUB_APP_SLUG;

  if (!slug) {
    return undefined;
  }

  return `https://github.com/apps/${slug}/installations/new`;
}
