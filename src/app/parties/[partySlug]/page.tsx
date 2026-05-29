import {
  BookOpen,
  GitBranch,
  GitPullRequest,
  Lock,
  Radio,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityCard } from "@/components/study/activity-card";
import { MarkdownDocument } from "@/components/study/markdown-document";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockPartyDetails } from "@/lib/study/mock-data";

type PartyPageProps = {
  params: Promise<{
    partySlug: string;
  }>;
};

export default async function PartyPage({ params }: PartyPageProps) {
  const { partySlug } = await params;
  const party = mockPartyDetails.find((item) => item.slug === partySlug);

  if (!party) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#24292f]">
      <header className="border-b border-[#d0d7de] bg-white">
        <div className="mx-auto grid w-full max-w-[1280px] gap-4 px-4 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-14 rounded-md border border-[#d0d7de]">
                <AvatarFallback className="rounded-md bg-[#0969da] text-xl text-white">
                  {party.title.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-semibold">
                    {party.title}
                  </h1>
                  <Badge variant="outline" className="border-[#d0d7de]">
                    {party.visibility === "PRIVATE" ? (
                      <Lock className="size-3" />
                    ) : null}
                    {party.visibility.toLowerCase()}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[#57606a]">{party.topic}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">
                <GitBranch data-icon="inline-start" />
                Invite
              </Button>
              <Button className="bg-[#1f883d] text-white hover:bg-[#1a7f37]">
                <Users data-icon="inline-start" />
                Join
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="gap-6 overflow-x-auto">
              <TabsTrigger value="overview">
                <BookOpen className="size-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="pull-requests" className="text-[#57606a]">
                <GitPullRequest className="size-4" />
                Pull requests
              </TabsTrigger>
              <TabsTrigger value="repositories" className="text-[#57606a]">
                <GitBranch className="size-4" />
                Repositories
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="grid min-w-0 gap-4">
          <MarkdownDocument value={party.coverMarkdown} />

          <Card className="gap-0 rounded-md border-[#d0d7de] py-0">
            <CardHeader className="rounded-t-md border-b border-[#d0d7de] bg-[#f6f8fa] py-3">
              <CardTitle className="text-sm">Mini parties</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-[#d0d7de] p-0">
              {party.miniParties.map((miniParty) => (
                <Link
                  key={miniParty.id}
                  href={`/parties/${miniParty.slug}`}
                  className="grid gap-1 px-4 py-3 hover:bg-[#f6f8fa]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#0969da]">
                      {miniParty.title}
                    </span>
                    <Badge variant="outline" className="border-[#d0d7de]">
                      {miniParty.visibility.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-[#57606a]">{miniParty.topic}</div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <section className="grid gap-3">
            {party.activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                showParty={false}
              />
            ))}
          </section>
        </section>

        <aside className="grid gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="gap-0 rounded-md border-[#d0d7de] py-0">
            <CardHeader className="rounded-t-md border-b border-[#d0d7de] bg-[#f6f8fa] py-3">
              <CardTitle className="text-sm">Repositories</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-[#d0d7de] p-0">
              {party.repositories.map((repository) => (
                <a
                  key={repository.id}
                  href={repository.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid gap-1 px-4 py-3 hover:bg-[#f6f8fa]"
                >
                  <span className="truncate font-mono text-sm font-semibold text-[#0969da]">
                    {repository.fullName}
                  </span>
                  <span className="text-xs text-[#57606a]">
                    {repository.eventCount} events
                  </span>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-md border-[#d0d7de] py-0">
            <CardHeader className="rounded-t-md border-b border-[#d0d7de] bg-[#f6f8fa] py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Radio className="size-4 text-[#1f883d]" />
                Online
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-[#d0d7de] p-0">
              {party.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar>
                    <AvatarFallback
                      className="text-white"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.nickname.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {member.nickname}
                    </div>
                    <div className="text-xs text-[#57606a]">
                      {member.githubVisible && member.githubLogin
                        ? `@${member.githubLogin}`
                        : member.role}
                    </div>
                  </div>
                  <span
                    className={`size-2 rounded-full ${
                      member.status === "online"
                        ? "bg-[#1f883d]"
                        : member.status === "idle"
                          ? "bg-[#bf8700]"
                          : "bg-[#8c959f]"
                    }`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
