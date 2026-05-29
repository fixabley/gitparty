import type { DiffLineSide } from "@/lib/diff/parse";

export type GitHubRepositoryCoordinates = {
  owner: string;
  repo: string;
};

export type GitHubApiRequestOptions = RequestInit & {
  tokenRequired?: boolean;
};

export type GitHubRepositoryResponse = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string;
  owner: {
    login: string;
  };
};

export type GitHubWebhookResponse = {
  id: number;
  active: boolean;
  config?: {
    url?: string;
  };
};

export type GitHubIssueResponse = {
  number: number;
  html_url: string;
  title: string;
};

export type GitHubPullRequestResponse = {
  number: number;
  html_url: string;
  title: string;
};

export type GitHubPullRequestDetailsResponse = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  user?: {
    login?: string;
  };
};

export type GitHubPullRequestFile = {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string;
};

export type GitHubCommentResponse = {
  id: number;
  html_url: string;
};

export type GitHubContentResponse = {
  content?: {
    sha?: string;
    html_url?: string;
  };
  commit?: {
    html_url?: string;
    sha?: string;
  };
};

export type CreateRepositoryWebhookParams = GitHubRepositoryCoordinates & {
  webhookUrl: string;
  secret: string;
};

export type CreateGitHubIssueParams = GitHubRepositoryCoordinates & {
  title: string;
  body: string;
};

export type CreateGitHubPullRequestParams = GitHubRepositoryCoordinates & {
  title: string;
  body: string;
  head: string;
  base: string;
};

export type GitHubPullRequestLookupParams = GitHubRepositoryCoordinates & {
  pullNumber: number;
};

export type CreateGitHubIssueCommentParams = GitHubRepositoryCoordinates & {
  issueNumber: number;
  body: string;
};

export type CreateGitHubPullRequestReviewCommentParams =
  GitHubRepositoryCoordinates & {
    pullNumber: number;
    body: string;
    commitId: string;
    path: string;
    line: number;
    side?: DiffLineSide;
    startLine?: number;
    startSide?: DiffLineSide;
  };

export type CreateGitHubCommitCommentParams = GitHubRepositoryCoordinates & {
  sha: string;
  body: string;
};

export type GitHubFileLookupParams = GitHubRepositoryCoordinates & {
  path: string;
  branch: string;
};

export type CreateOrUpdateMarkdownFileParams = GitHubRepositoryCoordinates & {
  branch: string;
  path: string;
  message: string;
  content: string;
};

export type VerifyGitHubSignatureParams = {
  rawBody: string;
  signature: string | null;
  secret: string;
};

export type GitHubWebhookPayload = {
  action?: string;
  ref?: string;
  after?: string;
  repository?: {
    full_name?: string;
    html_url?: string;
    default_branch?: string;
    name?: string;
    owner?: {
      login?: string;
    };
  };
  sender?: {
    login?: string;
  };
  pull_request?: {
    title?: string;
    html_url?: string;
    number?: number;
  };
  issue?: {
    title?: string;
    html_url?: string;
    number?: number;
    pull_request?: unknown;
  };
  comment?: {
    body?: string;
    html_url?: string;
  };
  commits?: Array<{
    id?: string;
    message?: string;
    url?: string;
  }>;
  head_commit?: {
    id?: string;
    message?: string;
    url?: string;
  };
};

export type GitHubWebhookSummary = {
  title: string;
  summary: string;
  ref?: string;
  sha?: string;
  htmlUrl?: string;
};

export type RepositorySlug = GitHubRepositoryCoordinates;

export type RegisterRepositoryRequestBody = {
  repository?: string;
  webhookUrl?: string;
  installWebhook?: boolean;
};

export type PublishGitHubActionType =
  | "ISSUE"
  | "PULL_REQUEST"
  | "COMMENT"
  | "COMMIT";

export type PublishGitHubCommentTarget = "issue" | "commit";

export type PublishGitHubActionRequestBody = {
  repositoryId?: string;
  type?: PublishGitHubActionType;
  title?: string;
  body?: string;
  targetNumber?: number;
  targetSha?: string;
  baseBranch?: string;
  headBranch?: string;
  path?: string;
  commitMessage?: string;
  fileContent?: string;
  commentTarget?: PublishGitHubCommentTarget;
};

export type CreatePullRequestReviewCommentRequestBody = {
  repositoryId?: string;
  pullNumber?: number;
  body?: string;
  commitId?: string;
  path?: string;
  line?: number;
  side?: DiffLineSide;
  startLine?: number;
  startSide?: DiffLineSide;
};

export type AppRepository = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  htmlUrl?: string | null;
  defaultBranch?: string | null;
  webhookActive: boolean;
  webhookUrl?: string | null;
  _count?: {
    events: number;
    drafts: number;
  };
};

export type AppWebhookEvent = {
  id: string;
  event: string;
  action?: string | null;
  title?: string | null;
  summary?: string | null;
  sender?: string | null;
  htmlUrl?: string | null;
  receivedAt: string;
  repository?: {
    fullName: string;
    htmlUrl?: string | null;
  } | null;
};

export type PullRequestReviewData = {
  repository: AppRepository;
  pullRequest: GitHubPullRequestDetailsResponse;
  files: GitHubPullRequestFile[];
};
