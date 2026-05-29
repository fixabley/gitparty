import {
  Bell,
  BookOpen,
  Code2,
  GitPullRequest,
  Inbox,
  Lock,
  Plus,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ActivityCard } from "@/components/study/activity-card";
import { ContributionGrid } from "@/components/study/contribution-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HomeDashboardData, StudyPartySummary } from "@/lib/study/mock-data";

type StudyDashboardProps = {
  data: HomeDashboardData;
};

function PartyListItem({ party }: { party: StudyPartySummary }) {
  return (
    <Link
      href={`/parties/${party.slug}`}
      className="grid gap-1 rounded-md px-2 py-2 text-sm transition hover:bg-[#f6f8fa]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-semibold text-[#0969da]">
          {party.title}
        </span>
        {party.mentioned ? (
          <Badge className="bg-[#0969da] text-white">called</Badge>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#57606a]">
        <span>{party.updatedLabel}</span>
        <span>{party.memberCount}/{party.capacity}</span>
        {party.visibility === "PRIVATE" ? <Lock className="size-3" /> : null}
      </div>
    </Link>
  );
}

function RecommendedParty({ party }: { party: StudyPartySummary }) {
  return (
    <div className="grid gap-2 border-t border-[#d0d7de] py-3 first:border-t-0 first:pt-0">
      <Link
        href={`/parties/${party.slug}`}
        className="text-sm font-semibold text-[#0969da] hover:underline"
      >
        {party.title}
      </Link>
      <p className="text-sm text-[#57606a]">{party.topic}</p>
      <div className="flex flex-wrap gap-1">
        {party.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="border-[#d0d7de]">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function StudyDashboard({ data }: StudyDashboardProps) {
  return (
    <main id="top" className="min-h-screen bg-[#f6f8fa] text-[#24292f]">
      <header className="sticky top-0 z-40 border-b border-[#57606a] bg-[#24292f] text-white">
        <div className="mx-auto flex min-h-14 w-full max-w-[1280px] items-center gap-3 px-4">
          <Code2 className="size-8 shrink-0" />
          <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-[#57606a] bg-[#24292f] px-2.5 py-1.5 text-sm text-[#c9d1d9] md:flex">
            <Search className="size-4 shrink-0" />
            <span className="truncate">Search or jump to...</span>
          </div>
          <nav className="hidden items-center gap-4 text-sm font-semibold lg:flex">
            <Link className="hover:text-[#c9d1d9]" href="/">
              Feed
            </Link>
            <Link className="hover:text-[#c9d1d9]" href="/#parties">
              Parties
            </Link>
            <Link className="hover:text-[#c9d1d9]" href="/#pull-requests">
              Pull requests
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/api/auth/signin">Sign in</Link>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Create party"
            >
              <Plus />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Notifications"
            >
              <Bell />
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b border-[#d0d7de] bg-white">
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-6 overflow-x-auto px-4 text-sm">
          <a className="flex h-12 shrink-0 items-center gap-2 border-b-2 border-[#fd8c73] font-semibold">
            <Inbox className="size-4" />
            Feed
          </a>
          <a className="flex h-12 shrink-0 items-center gap-2 text-[#57606a]">
            <Users className="size-4" />
            Parties
          </a>
          <a className="flex h-12 shrink-0 items-center gap-2 text-[#57606a]">
            <GitPullRequest className="size-4" />
            Pull requests
          </a>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside id="parties" className="grid gap-4 lg:sticky lg:top-[72px] lg:self-start">
          <section className="rounded-md border border-[#d0d7de] bg-white">
            <div className="flex items-center justify-between border-b border-[#d0d7de] bg-[#f6f8fa] px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="size-4 text-[#57606a]" />
                Joined parties
              </div>
              <Badge variant="outline" className="border-[#d0d7de] bg-white">
                {data.parties.length}
              </Badge>
            </div>
            <div className="p-2">
              {data.parties.map((party) => (
                <PartyListItem key={party.id} party={party} />
              ))}
            </div>
          </section>
        </aside>

        <section className="grid min-w-0 gap-4">
          {data.feed.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </section>

        <aside className="grid gap-4 lg:sticky lg:top-[72px] lg:self-start">
          <section className="rounded-md border border-[#d0d7de] bg-white p-4">
            <ContributionGrid days={data.contributions} />
          </section>
          <section className="rounded-md border border-[#d0d7de] bg-white p-4">
            <div className="mb-3 text-sm font-semibold">Recommended parties</div>
            {data.recommendedParties.map((party) => (
              <RecommendedParty key={party.id} party={party} />
            ))}
          </section>
        </aside>
      </div>
    </main>
  );
}
