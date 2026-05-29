import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import {
  PartyActivityType as PrismaPartyActivityType,
  PartyRepositoryStatus,
} from "@/generated/prisma/enums";
import type {
  ActivatePartyRepositoryCommand,
  RegisterPartyRepositoryCommand,
  StudyRepositoryPort,
} from "@/server/study/application/ports";

export type PrismaStudyRepositoryDeps = {
  prisma: PrismaClient;
};

function toPrismaPartyActivityType(eventType: string) {
  if (eventType in PrismaPartyActivityType) {
    return PrismaPartyActivityType[
      eventType as keyof typeof PrismaPartyActivityType
    ];
  }

  return PrismaPartyActivityType.REPOSITORY;
}

export function createPrismaStudyRepository({
  prisma,
}: PrismaStudyRepositoryDeps): StudyRepositoryPort {
  return {
    async findPartyRepositoriesByRepositoryId(repositoryId) {
      return prisma.partyRepository.findMany({
        where: {
          repositoryId,
          status: PartyRepositoryStatus.ACTIVE,
        },
        select: {
          partyId: true,
          repositoryId: true,
        },
      });
    },

    async upsertPartyActivity({
      partyId,
      repositoryId,
      webhookEventId,
      eventType,
      title,
      summary,
      githubUrl,
      githubActorLogin,
      githubNumber,
      githubSha,
    }) {
      const prismaEventType = toPrismaPartyActivityType(eventType);

      return prisma.partyActivity.upsert({
        where: {
          partyId_githubWebhookEventId: {
            partyId,
            githubWebhookEventId: webhookEventId,
          },
        },
        update: {
          type: prismaEventType,
          title,
          summary,
          githubUrl,
          githubActorLogin,
          githubNumber,
          githubSha,
        },
        create: {
          partyId,
          repositoryId,
          githubWebhookEventId: webhookEventId,
          type: prismaEventType,
          title,
          summary,
          githubUrl,
          githubActorLogin,
          githubNumber,
          githubSha,
        },
        select: {
          id: true,
          partyId: true,
        },
      });
    },

    async registerPartyRepository({
      partyId,
      repositoryId,
      registeredByUserId,
      installUrl,
    }: RegisterPartyRepositoryCommand) {
      const status = installUrl
        ? PartyRepositoryStatus.PENDING_INSTALLATION
        : PartyRepositoryStatus.REQUESTED;

      const partyRepository = await prisma.partyRepository.upsert({
        where: {
          partyId_repositoryId: {
            partyId,
            repositoryId,
          },
        },
        update: {
          addedById: registeredByUserId,
          installUrl,
          status,
        },
        create: {
          partyId,
          repositoryId,
          addedById: registeredByUserId,
          installUrl,
          status,
        },
      });

      return {
        partyId: partyRepository.partyId,
        repositoryId: partyRepository.repositoryId,
        status:
          partyRepository.status === PartyRepositoryStatus.PENDING_INSTALLATION
            ? "PENDING_INSTALLATION"
            : "REQUESTED",
      };
    },

    async activatePartyRepository({
      partyId,
      repositoryId,
      appInstallationId,
    }: ActivatePartyRepositoryCommand) {
      const partyRepository = await prisma.partyRepository.update({
        where: {
          partyId_repositoryId: {
            partyId,
            repositoryId,
          },
        },
        data: {
          appInstallationId,
          activatedAt: new Date(),
          lastInstallationError: null,
          status: PartyRepositoryStatus.ACTIVE,
        },
      });

      return {
        partyId: partyRepository.partyId,
        repositoryId: partyRepository.repositoryId,
        status: "ACTIVE",
      };
    },
  };
}
