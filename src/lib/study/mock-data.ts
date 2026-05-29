export type StudyPartySummary = {
  id: string;
  slug: string;
  title: string;
  topic: string;
  visibility: "PUBLIC" | "PRIVATE";
  capacity: number;
  memberCount: number;
  activityCount: number;
  updatedLabel: string;
  mentioned?: boolean;
  tags: string[];
};

export type StudyActivityCard = {
  id: string;
  partySlug: string;
  partyTitle: string;
  type: string;
  title: string;
  summary: string;
  actorName: string;
  actorAvatar?: string;
  githubUrl?: string;
  platformUrl: string;
  createdLabel: string;
  repository?: string;
  commentCount: number;
};

export type StudyContributionDay = {
  date: string;
  count: number;
  activities: StudyActivityCard[];
};

export type StudyMemberPresence = {
  id: string;
  nickname: string;
  role: string;
  status: "online" | "idle" | "offline";
  avatarColor: string;
  githubLogin?: string;
  githubVisible: boolean;
};

export type StudyRepositorySummary = {
  id: string;
  fullName: string;
  htmlUrl?: string;
  eventCount: number;
};

export type StudyPartyDetail = StudyPartySummary & {
  description?: string;
  coverMarkdown: string;
  parentSlug?: string;
  parentTitle?: string;
  miniParties: StudyPartySummary[];
  repositories: StudyRepositorySummary[];
  activities: StudyActivityCard[];
  members: StudyMemberPresence[];
  inviteUrl: string;
};

export type HomeDashboardData = {
  parties: StudyPartySummary[];
  feed: StudyActivityCard[];
  recommendedParties: StudyPartySummary[];
  contributions: StudyContributionDay[];
};

const mockFeed: StudyActivityCard[] = [
  {
    id: "activity-pr-18",
    partySlug: "frontend-systems",
    partyTitle: "Frontend Systems",
    type: "PULL_REQUEST",
    title: "Add Suspense boundary around study dashboard",
    summary: "PR #18 opened with 4 changed files",
    actorName: "river",
    repository: "study-labs/web",
    platformUrl: "/parties/frontend-systems#activity-pr-18",
    githubUrl: "https://github.com/study-labs/web/pull/18",
    createdLabel: "12m ago",
    commentCount: 3,
  },
  {
    id: "activity-comment-17",
    partySlug: "algorithm-daily",
    partyTitle: "Algorithm Daily",
    type: "REVIEW_COMMENT",
    title: "Consider extracting the heap comparator",
    summary: "PR review comment added on src/heap.ts:L42-L51",
    actorName: "miso",
    repository: "anonymous/algo-note",
    platformUrl: "/parties/algorithm-daily#activity-comment-17",
    githubUrl: "https://github.com/anonymous/algo-note/pull/7#discussion_r1",
    createdLabel: "38m ago",
    commentCount: 5,
  },
  {
    id: "activity-issue-9",
    partySlug: "backend-reading",
    partyTitle: "Backend Reading",
    type: "ISSUE",
    title: "Chapter 4 isolation level questions",
    summary: "Issue #9 opened",
    actorName: "nox",
    repository: "book-club/db-notes",
    platformUrl: "/parties/backend-reading#activity-issue-9",
    githubUrl: "https://github.com/book-club/db-notes/issues/9",
    createdLabel: "1h ago",
    commentCount: 2,
  },
];

export const mockParties: StudyPartySummary[] = [
  {
    id: "party-frontend",
    slug: "frontend-systems",
    title: "Frontend Systems",
    topic: "React, rendering, product UI",
    visibility: "PUBLIC",
    capacity: 12,
    memberCount: 8,
    activityCount: 42,
    updatedLabel: "updated 12m ago",
    mentioned: true,
    tags: ["react", "nextjs", "ui"],
  },
  {
    id: "party-algorithm",
    slug: "algorithm-daily",
    title: "Algorithm Daily",
    topic: "Daily problem solving",
    visibility: "PRIVATE",
    capacity: 6,
    memberCount: 5,
    activityCount: 31,
    updatedLabel: "updated 38m ago",
    tags: ["algorithm", "typescript"],
  },
  {
    id: "party-backend",
    slug: "backend-reading",
    title: "Backend Reading",
    topic: "Database and distributed systems",
    visibility: "PUBLIC",
    capacity: 10,
    memberCount: 7,
    activityCount: 18,
    updatedLabel: "updated 1h ago",
    tags: ["database", "architecture"],
  },
];

export const mockHomeDashboardData: HomeDashboardData = {
  parties: mockParties,
  feed: mockFeed,
  recommendedParties: [
    {
      id: "party-rust",
      slug: "rust-practice",
      title: "Rust Practice",
      topic: "Ownership, async Rust, CLI",
      visibility: "PUBLIC",
      capacity: 8,
      memberCount: 3,
      activityCount: 7,
      updatedLabel: "opened today",
      tags: ["rust", "systems"],
    },
    {
      id: "party-ai",
      slug: "ai-paper-club",
      title: "AI Paper Club",
      topic: "Paper reading and implementation",
      visibility: "PUBLIC",
      capacity: 14,
      memberCount: 9,
      activityCount: 12,
      updatedLabel: "updated 2h ago",
      tags: ["ml", "paper"],
    },
  ],
  contributions: Array.from({ length: 84 }, (_, index) => {
    const count = [0, 1, 2, 4, 6][(index * 7) % 5] ?? 0;
    return {
      date: `2026-05-${String((index % 28) + 1).padStart(2, "0")}`,
      count,
      activities: count > 0 ? mockFeed.slice(0, Math.min(count, 3)) : [],
    };
  }),
};

export const mockPartyDetails: StudyPartyDetail[] = [
  {
    ...mockParties[0],
    description: "A privacy-first study party for frontend architecture.",
    coverMarkdown:
      "# Frontend Systems\n\nWe review production UI code without exposing personal profiles. Bring PRs, issues, and reading notes.\n\n- Weekly rendering deep dive\n- Anonymous PR review\n- Mini parties for focused tracks",
    inviteUrl: "/invite/frontend-systems-demo",
    miniParties: [
      {
        id: "mini-rendering",
        slug: "rendering-lab",
        title: "Rendering Lab",
        topic: "React Server Components and Suspense",
        visibility: "PUBLIC",
        capacity: 5,
        memberCount: 4,
        activityCount: 14,
        updatedLabel: "updated 20m ago",
        tags: ["rsc", "performance"],
      },
      {
        id: "mini-design-system",
        slug: "design-system",
        title: "Design System",
        topic: "Component contracts and accessibility",
        visibility: "PRIVATE",
        capacity: 4,
        memberCount: 3,
        activityCount: 9,
        updatedLabel: "updated 1h ago",
        tags: ["a11y", "components"],
      },
    ],
    repositories: [
      {
        id: "repo-web",
        fullName: "study-labs/web",
        htmlUrl: "https://github.com/study-labs/web",
        eventCount: 28,
      },
    ],
    activities: mockFeed.filter((activity) => activity.partySlug === "frontend-systems"),
    members: [
      {
        id: "member-river",
        nickname: "river",
        role: "owner",
        status: "online",
        avatarColor: "#0969da",
        githubLogin: "river-dev",
        githubVisible: false,
      },
      {
        id: "member-miso",
        nickname: "miso",
        role: "member",
        status: "idle",
        avatarColor: "#1f883d",
        githubLogin: "miso-code",
        githubVisible: true,
      },
      {
        id: "member-nox",
        nickname: "nox",
        role: "member",
        status: "online",
        avatarColor: "#8250df",
        githubVisible: false,
      },
    ],
  },
];
