import type { GitHubWebhookSummary } from "@/types/github";

export type CreatePartyActivitiesForWebhookParams = {
  repositoryId?: string;
  webhookEventId: string;
  event: string;
  sender?: string | null;
  summary: GitHubWebhookSummary;
};

export type ResolvePartyActivityTypeParams = {
  event: string;
};

export type FormatPlatformGitHubCommentParams = {
  nickname: string;
  platformUrl: string;
  bodyMarkdown: string;
};

export type RegisterPartyRepositoryParams = {
  partyId: string;
  repositoryId: string;
  addedById?: string;
};

export type PartyRouteParams = {
  partySlug: string;
};

export type MiniPartyRouteParams = PartyRouteParams & {
  miniSlug: string;
};
