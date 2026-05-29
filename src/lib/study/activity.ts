import "server-only";

import { PartyActivityType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type {
  CreatePartyActivitiesForWebhookParams,
  FormatPlatformGitHubCommentParams,
  RegisterPartyRepositoryParams,
  ResolvePartyActivityTypeParams,
} from "@/types/study";

export function resolvePartyActivityType({
  event,
}: ResolvePartyActivityTypeParams) {
  if (event === "push") {
    return PartyActivityType.PUSH;
  }

  if (event === "pull_request") {
    return PartyActivityType.PULL_REQUEST;
  }

  if (event === "issues") {
    return PartyActivityType.ISSUE;
  }

  if (event === "issue_comment") {
    return PartyActivityType.ISSUE_COMMENT;
  }

  if (event === "commit_comment") {
    return PartyActivityType.COMMIT_COMMENT;
  }

  if (event === "pull_request_review_comment") {
    return PartyActivityType.REVIEW_COMMENT;
  }

  return PartyActivityType.REPOSITORY;
}

export async function registerPartyRepository({
  partyId,
  repositoryId,
  addedById,
}: RegisterPartyRepositoryParams) {
  return prisma.partyRepository.upsert({
    where: {
      partyId_repositoryId: {
        partyId,
        repositoryId,
      },
    },
    update: {
      addedById,
    },
    create: {
      partyId,
      repositoryId,
      addedById,
    },
  });
}

export async function createPartyActivitiesForWebhook({
  repositoryId,
  webhookEventId,
  event,
  sender,
  summary,
}: CreatePartyActivitiesForWebhookParams) {
  if (!repositoryId) {
    return [];
  }

  const partyRepositories = await prisma.partyRepository.findMany({
    where: { repositoryId },
    select: {
      partyId: true,
      repositoryId: true,
    },
  });

  const activityType = resolvePartyActivityType({ event });

  return Promise.all(
    partyRepositories.map((partyRepository) =>
      prisma.partyActivity.upsert({
        where: {
          partyId_githubWebhookEventId: {
            partyId: partyRepository.partyId,
            githubWebhookEventId: webhookEventId,
          },
        },
        update: {
          type: activityType,
          title: summary.title,
          summary: summary.summary,
          githubUrl: summary.htmlUrl,
          githubActorLogin: sender ?? undefined,
          githubSha: summary.sha,
        },
        create: {
          partyId: partyRepository.partyId,
          repositoryId: partyRepository.repositoryId,
          githubWebhookEventId: webhookEventId,
          type: activityType,
          title: summary.title,
          summary: summary.summary,
          githubUrl: summary.htmlUrl,
          githubActorLogin: sender ?? undefined,
          githubSha: summary.sha,
        },
      })
    )
  );
}

export function formatPlatformGitHubComment({
  nickname,
  platformUrl,
  bodyMarkdown,
}: FormatPlatformGitHubCommentParams) {
  return [
    bodyMarkdown.trim(),
    "",
    "---",
    `Posted from Reverseed by [${nickname}](${platformUrl}).`,
  ].join("\n");
}
