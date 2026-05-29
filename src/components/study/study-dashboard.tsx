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
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HomeDashboardData, StudyPartySummary } from "@/lib/study/mock-data";

type StudyDashboardProps = {
  data: HomeDashboardData;
};

function PartyListItem({ party }: { party: StudyPartySummary }) {
  return (
    <Link
      href={`/parties/${party.slug}`}
      className="grid gap-1 rounded-md px-2 py-2 text-sm transition hover:bg-muted"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-semibold text-primary">
          {party.title}
        </span>
        {party.mentioned ? <Badge>called</Badge> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{party.updatedLabel}</span>
        <span>{party.memberCount}/{party.capacity}</span>
        {party.visibility === "PRIVATE" ? <Lock className="size-3" /> : null}
      </div>
    </Link>
  );
}

function RecommendedParty({ party }: { party: StudyPartySummary }) {
  return (
    <div className="grid gap-2 border-t border-border py-3 first:border-t-0 first:pt-0">
      <Link
        href={`/parties/${party.slug}`}
        className="text-sm font-semibold text-primary hover:underline"
      >
        {party.title}
      </Link>
      <p className="text-sm text-muted-foreground">{party.topic}</p>
      <div className="flex flex-wrap gap-1">
        {party.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function StudyDashboard({ data }: StudyDashboardProps) {
  return (
    <main id="top" className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background text-foreground">
        <div className="mx-auto flex min-h-14 w-full max-w-[1280px] items-center gap-3 px-4">
          <Code2 className="size-8 shrink-0" />
          <div className="relative hidden min-w-0 flex-1 md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              readOnly
              className="pl-8 shadow-none"
              placeholder="Search or jump to..."
            />
          </div>
          <nav className="hidden items-center gap-4 text-sm font-semibold lg:flex">
            <Link className="hover:text-muted-foreground" href="/">
              Feed
            </Link>
            <Link className="hover:text-muted-foreground" href="/#parties">
              Parties
            </Link>
            <Link
              className="hover:text-muted-foreground"
              href="/#pull-requests"
            >
              Pull requests
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Button asChild size="sm" variant="ghost">
              <Link href="/api/auth/signin">Sign in</Link>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Create party"
            >
              <Plus />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Notifications"
            >
              <Bell />
            </Button>
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-[1280px] overflow-x-auto px-4">
          <Tabs defaultValue="feed">
            <TabsList className="h-12 gap-6">
              <TabsTrigger value="feed">
                <Inbox className="size-4" />
                Feed
              </TabsTrigger>
              <TabsTrigger value="parties">
                <Users className="size-4" />
                Parties
              </TabsTrigger>
              <TabsTrigger value="pull-requests">
                <GitPullRequest className="size-4" />
                Pull requests
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside
          id="parties"
          className="grid gap-4 lg:sticky lg:top-[72px] lg:self-start"
        >
          <Card className="gap-0 py-0">
            <CardHeader className="grid-cols-[1fr_auto] gap-3 border-b bg-muted/50 py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="size-4 text-muted-foreground" />
                Joined parties
              </CardTitle>
              <CardAction>
                <Badge variant="outline">{data.parties.length}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[480px]">
                <div className="p-2">
                  {data.parties.map((party) => (
                    <PartyListItem key={party.id} party={party} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        <section className="grid min-w-0 gap-4">
          {data.feed.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </section>

        <aside className="grid gap-4 lg:sticky lg:top-[72px] lg:self-start">
          <Card>
            <CardContent>
              <ContributionGrid days={data.contributions} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recommended parties</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recommendedParties.map((party) => (
                <RecommendedParty key={party.id} party={party} />
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
