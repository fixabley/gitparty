import { StudyDashboard } from "@/components/study/study-dashboard";
import { mockHomeDashboardData } from "@/lib/study/mock-data";

export default function Home() {
  return <StudyDashboard data={mockHomeDashboardData} />;
}
