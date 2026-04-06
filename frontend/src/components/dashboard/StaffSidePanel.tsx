import { AlertTriangle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import type { ApiStaffIssue } from "@/lib/staffIssues";

interface StaffSidePanelProps {
  issues: ApiStaffIssue[];
}

const HAZARD_CATEGORY_NAMES = ["Hazards", "Hazard"];

function differenceInDays(fromDate: string, toDate: string = new Date().toISOString()) {
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();
  return Math.max(0, Math.floor((to - from) / 86400000));
}

function isResolvedStatus(status: string) {
  return status === "RESOLVED" || status === "CLOSED";
}

function formatAverageDays(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 days";
  return `${value.toFixed(1)} days`;
}

const StaffSidePanel = ({ issues }: StaffSidePanelProps) => {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const needsAttention = issues
    .map((issue) => {
      const isHazard = HAZARD_CATEGORY_NAMES.includes(issue.category?.name || "");
      const daysSinceUpdate = differenceInDays(issue.updatedAt);
      const isStale = daysSinceUpdate > 5;

      if (!isHazard && !isStale) return null;

      let reason = "";
      if (isHazard) {
        reason = "Hazard";
      } else if (isStale) {
        reason = "No updates in 5+ days";
      }

      return {
        caseId: issue.caseId,
        title: issue.title,
        reason,
      };
    })
    .filter(Boolean) as Array<{
    caseId: string;
    title: string;
    reason: string;
  }>;

  const resolvedIssues = issues.filter((issue) => isResolvedStatus(issue.status));

  const avgResolutionTime =
    resolvedIssues.length > 0
      ? resolvedIssues.reduce((sum, issue) => {
          return sum + differenceInDays(issue.createdAt, issue.updatedAt);
        }, 0) / resolvedIssues.length
      : 0;

  const reportedToday = issues.filter((issue) => {
    const created = new Date(issue.createdAt);
    return (
      created.getDate() === now.getDate() &&
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  const resolvedLast7Days = issues.filter((issue) => {
    if (!isResolvedStatus(issue.status)) return false;
    const updated = new Date(issue.updatedAt);
    return updated >= sevenDaysAgo;
  }).length;

  const staleCases = issues.filter((issue) => differenceInDays(issue.updatedAt) > 5).length;

  return (
    <div className="space-y-5">
      <div className="bg-warning/15 rounded-lg border border-border p-5">
        <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Needs Attention
        </h3>

        <div className="space-y-3">
          {needsAttention.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues need attention right now.</p>
          ) : (
            needsAttention.map((item) => (
              <div
                key={item.caseId}
                className="flex items-start gap-3 p-2.5 rounded-md bg-amber-50/60 border border-amber-100"
              >
                <div className="mt-0.5 min-w-0">
                  <Link
                    to={`/staff/issues/${item.caseId}`}
                    className="text-xs font-mono font-medium text-primary hover:underline"
                  >
                    {item.caseId}
                  </Link>
                  <p className="text-sm text-card-foreground font-medium leading-tight break-words">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-sm font-heading font-semibold text-card-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Quick Overview
        </h3>

        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-sm gap-3">
            <span className="text-muted-foreground">Avg. resolution time</span>
            <span className="font-medium text-card-foreground whitespace-nowrap">
              {formatAverageDays(avgResolutionTime)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm gap-3">
            <span className="text-muted-foreground">Reported today</span>
            <span className="font-medium text-card-foreground">{reportedToday}</span>
          </div>

          <div className="flex justify-between items-center text-sm gap-3">
            <span className="text-muted-foreground">Resolved in last 7 days</span>
            <span className="font-medium text-card-foreground">{resolvedLast7Days}</span>
          </div>

          <div className="flex justify-between items-center text-sm gap-3">
            <span className="text-muted-foreground">Overdue Issues</span>
            <span className="font-medium text-destructive">{staleCases}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSidePanel;
