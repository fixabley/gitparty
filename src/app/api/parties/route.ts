import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/study/slug";
import { requireCurrentUser } from "@/server/auth/current-user";
import type { CreatePartyRequestBody } from "@/types/study";

export const runtime = "nodejs";

type RequiredStringParams = {
  value: unknown;
  label: string;
};

function requiredString({ value, label }: RequiredStringParams) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

async function uniquePartySlug(title: string) {
  const base = slugify({ value: title }) || "party";

  for (let index = 0; index < 20; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await prisma.party.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }
  }

  return `${base}-${Date.now()}`;
}

export async function GET() {
  const user = await requireCurrentUser();

  const parties = await prisma.party.findMany({
    where: {
      memberships: {
        some: {
          userId: user.id,
          status: "ACTIVE",
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      tags: {
        include: { tag: true },
      },
      _count: {
        select: {
          activities: true,
          memberships: true,
          repositories: true,
        },
      },
    },
  });

  return NextResponse.json({ parties });
}

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  const body = (await request.json()) as CreatePartyRequestBody;

  try {
    const title = requiredString({ value: body.title, label: "title" });
    const topic = requiredString({ value: body.topic, label: "topic" });
    const capacity =
      typeof body.capacity === "number" && body.capacity > 0
        ? Math.floor(body.capacity)
        : 8;
    const visibility = body.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";
    const nickname =
      typeof body.nickname === "string" && body.nickname.trim()
        ? body.nickname.trim()
        : user.name || "anonymous";

    if (body.parentId) {
      const parent = await prisma.party.findUnique({
        where: { id: body.parentId },
        select: {
          id: true,
          parentId: true,
          memberships: {
            where: {
              userId: user.id,
              status: "ACTIVE",
            },
            select: { id: true },
          },
        },
      });

      if (!parent || parent.parentId || parent.memberships.length === 0) {
        return NextResponse.json(
          { error: "Mini parties require active parent party membership." },
          { status: 403 }
        );
      }
    }

    const tags = Array.isArray(body.tags)
      ? body.tags
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];
    const slug = await uniquePartySlug(title);

    const party = await prisma.party.create({
      data: {
        title,
        topic,
        capacity,
        visibility,
        slug,
        description: body.description,
        coverMarkdown: body.coverMarkdown,
        parentId: body.parentId,
        createdById: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER",
            status: "ACTIVE",
            joinedAt: new Date(),
          },
        },
        profiles: {
          create: {
            userId: user.id,
            nickname,
            avatarUrl: user.image,
          },
        },
        tags: {
          create: tags.map((name) => ({
            tag: {
              connectOrCreate: {
                where: { slug: slugify({ value: name }) },
                create: {
                  name,
                  slug: slugify({ value: name }),
                },
              },
            },
          })),
        },
      },
      include: {
        tags: {
          include: { tag: true },
        },
        memberships: true,
        profiles: true,
      },
    });

    return NextResponse.json({ party }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}
