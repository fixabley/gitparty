import type {
  ActivatePartyRepositoryCommand,
  IngestWebhookActivitiesCommand,
  RegisterPartyRepositoryCommand,
  StudyRepositoryPort,
} from "@/server/study/application/ports";

export type PartyActivityType =
  | "PUSH"
  | "PULL_REQUEST"
  | "ISSUE"
  | "ISSUE_COMMENT"
  | "COMMIT_COMMENT"
  | "REVIEW_COMMENT"
  | "REPOSITORY";

export type StudyActivityServiceDeps = {
  repository: StudyRepositoryPort;
};

export type ResolvePartyActivityTypeCommand = {
  event: string;
};

export function resolvePartyActivityType({
  event,
}: ResolvePartyActivityTypeCommand): PartyActivityType {
  if (event === "push") {
    return "PUSH";
  }

  if (event === "pull_request") {
    return "PULL_REQUEST";
  }

  if (event === "issues") {
    return "ISSUE";
  }

  if (event === "issue_comment") {
    return "ISSUE_COMMENT";
  }

  if (event === "commit_comment") {
    return "COMMIT_COMMENT";
  }

  if (event === "pull_request_review_comment") {
    return "REVIEW_COMMENT";
  }

  return "REPOSITORY";
}

export function createStudyActivityService({
  repository,
}: StudyActivityServiceDeps) {
  return {
    async registerPartyRepository(command: RegisterPartyRepositoryCommand) {
      return repository.registerPartyRepository(command);
    },

    async activatePartyRepository(command: ActivatePartyRepositoryCommand) {
      return repository.activatePartyRepository(command);
    },

    async ingestWebhookActivities({
      repositoryId,
      webhookEventId,
      event,
      sender,
      summary,
    }: IngestWebhookActivitiesCommand) {
      if (!repositoryId) {
        return [];
      }

      const partyRepositories =
        await repository.findPartyRepositoriesByRepositoryId(repositoryId);
      const eventType = resolvePartyActivityType({ event });

      return Promise.all(
        partyRepositories.map((partyRepository) =>
          repository.upsertPartyActivity({
            partyId: partyRepository.partyId,
            repositoryId: partyRepository.repositoryId,
            webhookEventId,
            eventType,
            title: summary.title,
            summary: summary.summary,
            githubUrl: summary.htmlUrl,
            githubActorLogin: sender ?? undefined,
            githubSha: summary.sha,
          })
        )
      );
    },
  };
}
