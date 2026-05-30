import { ScrollArea } from "@/components/ui/scroll-area";
import type { StudyContributionDay } from "@/lib/study/mock-data";

type ContributionGridProps = {
  days: StudyContributionDay[];
};

function contributionClass(count: number) {
  if (count >= 6) {
    return "bg-primary";
  }

  if (count >= 4) {
    return "bg-primary/75";
  }

  if (count >= 2) {
    return "bg-primary/50";
  }

  if (count >= 1) {
    return "bg-primary/25";
  }

  return "bg-muted";
}

export function ContributionGrid({ days }: ContributionGridProps) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold">Contributions</div>
      <ScrollArea className="rounded-md border border-border bg-card p-3">
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {days.map((day, index) => (
            <a
              key={`${day.date}-${index}`}
              href={`#activity-${day.date}`}
              title={`${day.date}: ${day.count} activities`}
              className={`size-3 rounded-[2px] ${contributionClass(day.count)}`}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
