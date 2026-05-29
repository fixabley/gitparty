import type { GitHubWebhookSummary } from "@/types/github";

export type PartyRepositoryRecord = {
  partyId: string;
  repositoryId: string;
};

export type PartyActivityRecord = {
  id: string;
  partyId: string;
};

export type RegisterPartyRepositoryCommand = {
  partyId: string;
  repositoryId: string;
  registeredByUserId?: string;
  installUrl?: string;
};

export type RegisterPartyRepositoryResult = {
  partyId: string;
  repositoryId: string;
  status: "REQUESTED" | "PENDING_INSTALLATION" | "ACTIVE";
};

export type ActivatePartyRepositoryCommand = {
  partyId: string;
  repositoryId: string;
  appInstallationId: number;
};

export type IngestWebhookActivitiesCommand = {
  repositoryId?: string;
  webhookEventId: string;
  event: string;
  sender?: string | null;
  summary: GitHubWebhookSummary;
};

export type StudyRepositoryPort = {
  findPartyRepositoriesByRepositoryId(
    repositoryId: string
  ): Promise<PartyRepositoryRecord[]>;
  upsertPartyActivity(input: {
    partyId: string;
    repositoryId: string;
    webhookEventId: string;
    eventType: string;
    title: string;
    summary: string;
    githubUrl?: string;
    githubActorLogin?: string;
    githubSha?: string;
  }): Promise<PartyActivityRecord>;
  registerPartyRepository(
    command: RegisterPartyRepositoryCommand
  ): Promise<RegisterPartyRepositoryResult>;
  activatePartyRepository(
    command: ActivatePartyRepositoryCommand
  ): Promise<RegisterPartyRepositoryResult>;
};
