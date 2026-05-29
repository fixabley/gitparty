import {
  BookOpen,
  GitPullRequest,
  Inbox,
  Lock,
  Users,
} from "lucide-react";
import Link from "next/link";

import { ActivityCard } from "@/components/study/activity-card";
import { ContributionGrid } from "@/components/study/contribution-grid";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <main
      id="top"
      className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground"
    >
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

        <section id="pull-requests" className="grid min-w-0 gap-4">
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
