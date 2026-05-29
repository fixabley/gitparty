import { describe, expect, it } from "vitest";

import {
  createStudyActivityService,
  resolvePartyActivityType,
} from "@/server/study/application/activity-service";
import type {
  ActivatePartyRepositoryCommand,
  PartyActivityRecord,
  PartyRepositoryRecord,
  RegisterPartyRepositoryCommand,
  RegisterPartyRepositoryResult,
  StudyRepositoryPort,
} from "@/server/study/application/ports";

class MemoryStudyRepository implements StudyRepositoryPort {
  partyRepositories: PartyRepositoryRecord[] = [];
  activities: Array<Parameters<StudyRepositoryPort["upsertPartyActivity"]>[0]> =
    [];

  constructor(partyRepositories: PartyRepositoryRecord[] = []) {
    this.partyRepositories = partyRepositories;
  }

  async findPartyRepositoriesByRepositoryId(repositoryId: string) {
    return this.partyRepositories.filter(
      (partyRepository) => partyRepository.repositoryId === repositoryId
    );
  }

  async upsertPartyActivity(
    input: Parameters<StudyRepositoryPort["upsertPartyActivity"]>[0]
  ): Promise<PartyActivityRecord> {
    this.activities.push(input);

    return {
      id: `activity-${this.activities.length}`,
      partyId: input.partyId,
    };
  }

  async registerPartyRepository({
    partyId,
    repositoryId,
    installUrl,
  }: RegisterPartyRepositoryCommand): Promise<RegisterPartyRepositoryResult> {
    this.partyRepositories.push({ partyId, repositoryId });

    return {
      partyId,
      repositoryId,
      status: installUrl ? "PENDING_INSTALLATION" : "REQUESTED",
    };
  }

  async activatePartyRepository({
    partyId,
    repositoryId,
  }: ActivatePartyRepositoryCommand): Promise<RegisterPartyRepositoryResult> {
    return {
      partyId,
      repositoryId,
      status: "ACTIVE",
    };
  }
}

describe("study activity service", () => {
  it("maps GitHub webhook event names into party activity types", () => {
    expect(resolvePartyActivityType({ event: "push" })).toBe("PUSH");
    expect(resolvePartyActivityType({ event: "pull_request" })).toBe(
      "PULL_REQUEST"
    );
    expect(resolvePartyActivityType({ event: "issue_comment" })).toBe(
      "ISSUE_COMMENT"
    );
  });

  it("creates one party activity per registered party repository", async () => {
    const repository = new MemoryStudyRepository([
      { partyId: "party-a", repositoryId: "repo-1" },
      { partyId: "party-b", repositoryId: "repo-1" },
      { partyId: "party-c", repositoryId: "repo-2" },
    ]);
    const service = createStudyActivityService({ repository });

    const activities = await service.ingestWebhookActivities({
      repositoryId: "repo-1",
      webhookEventId: "delivery-1",
      event: "pull_request",
      sender: "octocat",
      summary: {
        title: "Add review flow",
        summary: "PR #10 opened",
        htmlUrl: "https://github.com/acme/repo/pull/10",
      },
    });

    expect(activities).toHaveLength(2);
    expect(repository.activities).toMatchObject([
      {
        partyId: "party-a",
        repositoryId: "repo-1",
        webhookEventId: "delivery-1",
        eventType: "PULL_REQUEST",
        githubActorLogin: "octocat",
      },
      {
        partyId: "party-b",
        repositoryId: "repo-1",
        webhookEventId: "delivery-1",
        eventType: "PULL_REQUEST",
        githubActorLogin: "octocat",
      },
    ]);
  });

  it("ignores webhooks that cannot be matched to a repository", async () => {
    const repository = new MemoryStudyRepository([
      { partyId: "party-a", repositoryId: "repo-1" },
    ]);
    const service = createStudyActivityService({ repository });

    const activities = await service.ingestWebhookActivities({
      webhookEventId: "delivery-1",
      event: "push",
      summary: {
        title: "Push",
        summary: "1 commit pushed",
      },
    });

    expect(activities).toEqual([]);
    expect(repository.activities).toEqual([]);
  });

  it("returns pending installation when a repository registration has an install URL", async () => {
    const repository = new MemoryStudyRepository();
    const service = createStudyActivityService({ repository });

    await expect(
      service.registerPartyRepository({
        partyId: "party-a",
        repositoryId: "repo-1",
        registeredByUserId: "user-a",
        installUrl: "https://github.com/apps/gitparty/installations/new",
      })
    ).resolves.toMatchObject({
      status: "PENDING_INSTALLATION",
    });
  });
});
