import "server-only";

import { prisma } from "@/lib/prisma";
import { createStudyActivityService } from "@/server/study/application/activity-service";
import { createPrismaStudyRepository } from "@/server/study/infrastructure/prisma-study-repository";

export function createStudyServices() {
  const studyRepository = createPrismaStudyRepository({ prisma });

  return {
    activity: createStudyActivityService({
      repository: studyRepository,
    }),
  };
}
