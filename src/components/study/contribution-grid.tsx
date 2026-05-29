import type { StudyContributionDay } from "@/lib/study/mock-data";

type ContributionGridProps = {
  days: StudyContributionDay[];
};

function contributionClass(count: number) {
  if (count >= 6) {
    return "bg-[#216e39]";
  }

  if (count >= 4) {
    return "bg-[#30a14e]";
  }

  if (count >= 2) {
    return "bg-[#40c463]";
  }

  if (count >= 1) {
    return "bg-[#9be9a8]";
  }

  return "bg-[#ebedf0]";
}

export function ContributionGrid({ days }: ContributionGridProps) {
  return (
    <div className="grid gap-2">
      <div className="text-sm font-semibold">Contributions</div>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto rounded-md border border-[#d0d7de] bg-white p-3">
        {days.map((day, index) => (
          <a
            key={`${day.date}-${index}`}
            href={`#activity-${day.date}`}
            title={`${day.date}: ${day.count} activities`}
            className={`size-3 rounded-[2px] ${contributionClass(day.count)}`}
          />
        ))}
      </div>
    </div>
  );
}
