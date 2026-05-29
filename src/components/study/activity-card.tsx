import {
  CircleDot,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StudyActivityCard } from "@/lib/study/mock-data";

type ActivityCardProps = {
  activity: StudyActivityCard;
  showParty?: boolean;
};

function ActivityIcon({ type }: { type: string }) {
  if (type === "PULL_REQUEST") {
    return <GitPullRequest className="size-4 text-primary" />;
  }

  if (type === "ISSUE") {
    return <CircleDot className="size-4 text-primary" />;
  }

  if (type.includes("COMMENT")) {
    return <MessageSquare className="size-4 text-primary" />;
  }

  return <GitCommitHorizontal className="size-4 text-muted-foreground" />;
}

export function ActivityCard({ activity, showParty = true }: ActivityCardProps) {
  return (
    <Card id={activity.id} className="py-0">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
          <ActivityIcon type={activity.type} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">{activity.actorName}</span>
            <span className="text-muted-foreground">{activity.summary}</span>
            <Badge variant="outline">{activity.type}</Badge>
          </div>
          <Link
            href={activity.platformUrl}
            className="mt-1 block truncate text-sm font-semibold text-primary hover:underline"
          >
            {activity.title}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {showParty ? <span>{activity.partyTitle}</span> : null}
            {activity.repository ? <span>{activity.repository}</span> : null}
            <span>{activity.createdLabel}</span>
            <span>{activity.commentCount} comments</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
