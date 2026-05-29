import "server-only";

import {
  createStudyActivityService,
  resolvePartyActivityType,
} from "@/server/study/application/activity-service";
import { formatPlatformAuthoredGitHubComment } from "@/server/study/domain/github-comment";
import { createPrismaStudyRepository } from "@/server/study/infrastructure/prisma-study-repository";
import { prisma } from "@/lib/prisma";
import type {
  CreatePartyActivitiesForWebhookParams,
  FormatPlatformGitHubCommentParams,
  RegisterPartyRepositoryParams,
} from "@/types/study";

const studyActivityService = createStudyActivityService({
  repository: createPrismaStudyRepository({ prisma }),
});

export { resolvePartyActivityType };

export async function registerPartyRepository({
  partyId,
  repositoryId,
  addedById,
}: RegisterPartyRepositoryParams) {
  return studyActivityService.registerPartyRepository({
    partyId,
    repositoryId,
    registeredByUserId: addedById,
  });
}

export async function createPartyActivitiesForWebhook({
  repositoryId,
  webhookEventId,
  event,
  sender,
  summary,
}: CreatePartyActivitiesForWebhookParams) {
  return studyActivityService.ingestWebhookActivities({
    repositoryId,
    webhookEventId,
    event,
    sender,
    summary,
  });
}

export function formatPlatformGitHubComment({
  nickname,
  platformUrl,
  bodyMarkdown,
}: FormatPlatformGitHubCommentParams) {
  return formatPlatformAuthoredGitHubComment({
    nickname,
    platformUrl,
    bodyMarkdown,
  });
}
