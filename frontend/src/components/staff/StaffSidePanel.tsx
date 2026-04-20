import { AlertTriangle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import type { ApiStaffIssue } from "@/lib/staffIssues";

interface StaffSidePanelProps {
  issues: ApiStaffIssue[];
  currentStaffId: number | null;
}

const RESOLVED_STATUSES = new Set(["RESOLVED", "CLOSED"]);
const ATTENTION_CATEGORY = "hazards";

function normalizeStatus(status?: string | null) {
  return String(status || "").trim().toUpperCase().replace(/_/g, " ");
}

function normalizeCategory(category?: string | null) {
  return String(category || "").trim().toLowerCase();
}

function differenceInDays(fromDate: string, toDate: string = new Date().toISOString()) {
  const from = new Date(fromDate).getTime();
  const to = new Date(toDate).getTime();

  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;

  return Math.max(0, Math.floor((to - from) / 86400000));
}

function isResolvedStatus(status?: string | null) {
  return RESOLVED_STATUSES.has(normalizeStatus(status).replace(/ /g, "_"));
}

const ATTENTION_STATUSES = new Set(["CREATED", "OPEN", "UNDER REVIEW"]);

function isAttentionStatus(status?: string | null) {
  return ATTENTION_STATUSES.has(normalizeStatus(status));
}

function formatAverageDays(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 days";
  return `${value.toFixed(1)} days`;
}

function getAssignedStaffId(issue: ApiStaffIssue) {
  const raw = issue as ApiStaffIssue & {
    staffId?: number | null;
    assignedStaffId?: number | null;
    assignedTo?: { id?: number | null } | null;
  };

  return raw.staff?.id ?? raw.staffId ?? raw.assignedStaffId ?? raw.assignedTo?.id ?? null;
}

function getIssueStatus(issue: ApiStaffIssue) {
  const raw = issue as ApiStaffIssue & {
    statusLabel?: string | null;
    statusName?: string | null;
  };

  return normalizeStatus(raw.status ?? raw.statusLabel ?? raw.statusName ?? "");
}

function getIssueCategoryName(issue: ApiStaffIssue) {
  const raw = issue as ApiStaffIssue & {
    categoryName?: string | null;
    category?: string | { name?: string | null } | null;
  };

  if (typeof raw.category === "string") return normalizeCategory(raw.category);
  return normalizeCategory(raw.category?.name ?? raw.categoryName ?? "");
}

function getIssueCreatedAt(issue: ApiStaffIssue) {
  const raw = issue as ApiStaffIssue & {
    reportedAt?: string | null;
    submittedAt?: string | null;
    created_at?: string | null;
  };
  

  return raw.createdAt ?? raw.reportedAt ?? raw.submittedAt ?? raw.created_at ?? "";
}

function getIssueDaysOpen(issue: ApiStaffIssue) {
  const raw = issue as ApiStaffIssue & {
    daysOpen?: number | string | null;
  };

  const directDays = Number(raw.daysOpen);
  if (Number.isFinite(directDays) && directDays >= 0) return directDays;

  const createdAt = getIssueCreatedAt(issue);
  return createdAt ? differenceInDays(createdAt) : 0;
}

const StaffSidePanel = ({ issues, currentStaffId }: StaffSidePanelProps) => {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const myIssues = useMemo(
    () =>
      currentStaffId === null
        ? []
        : issues.filter((issue) => getAssignedStaffId(issue) === currentStaffId),
    [issues, currentStaffId]
  );

  const needsAttention = useMemo(
    () =>
      myIssues
        .filter((issue) => {
          const status = getIssueStatus(issue);
          const category = getIssueCategoryName(issue);
          const daysOpen = getIssueDaysOpen(issue);

          return isAttentionStatus(status) && (category === ATTENTION_CATEGORY || daysOpen >= 5);
        })
        .map((issue) => {
          const category = getIssueCategoryName(issue);
          const daysOpen = getIssueDaysOpen(issue);
          const createdAt = getIssueCreatedAt(issue);
          const reasons: string[] = [];

          if (category === ATTENTION_CATEGORY) reasons.push("Hazard");
          if (daysOpen > 5) reasons.push(`Open for ${daysOpen} days`);

          return {
            caseId: issue.caseId,
            title: issue.title,
            reason: reasons.join(" • "),
            createdAt,
          };
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [myIssues]
  );

  const resolvedIssues = myIssues.filter((issue) => isResolvedStatus(getIssueStatus(issue)));

  const avgResolutionTime =
    resolvedIssues.length > 0
      ? resolvedIssues.reduce((sum, issue) => {
          const createdAt = getIssueCreatedAt(issue);
          return createdAt ? sum + differenceInDays(createdAt, issue.updatedAt) : sum;
        }, 0) / resolvedIssues.length
      : 0;

  const reportedToday = myIssues.filter((issue) => {
    const createdAt = getIssueCreatedAt(issue);
    if (!createdAt) return false;

    const created = new Date(createdAt);
    return (
      created.getDate() === now.getDate() &&
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  const resolvedLast7Days = myIssues.filter((issue) => {
    if (!isResolvedStatus(getIssueStatus(issue))) return false;
    return new Date(issue.updatedAt) >= sevenDaysAgo;
  }).length;

  const staleCases = myIssues.filter((issue) => {
    return getIssueDaysOpen(issue) > 5 && isAttentionStatus(getIssueStatus(issue));
  }).length;

  return (
    <div className="staff-side-panel">
      <div className="staff-side-panel__section staff-side-panel__section--attention">
        <h3 className="staff-side-panel__heading">
          <AlertTriangle className="staff-side-panel__heading-icon staff-side-panel__heading-icon--attention" />
          Needs Attention
          <span className="staff-side-panel__count">{needsAttention.length}</span>
        </h3>

        <div className="staff-side-panel__list staff-side-panel__list--scrollable">
          {needsAttention.length === 0 ? (
            <p className="staff-side-panel__item-meta">No issues need attention right now.</p>
          ) : (
            needsAttention.map((item) => (
              <div key={item.caseId} className="staff-side-panel__attention-item">
                <div className="staff-side-panel__attention-body">
                  <Link to={`/staff/issues/${item.caseId}`} className="staff-side-panel__case-link">
                    {item.caseId}
                  </Link>
                  <p className="staff-side-panel__item-title">{item.title}</p>
                  <p className="staff-side-panel__item-meta">{item.reason}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="staff-side-panel__section">
        <h3 className="staff-side-panel__heading--overview">
          <Clock className="staff-side-panel__heading-icon" />
          Quick Overview
        </h3>

        <div className="staff-side-panel__stats">
          <div className="staff-side-panel__stat-row">
            <span className="staff-side-panel__stat-label">Avg. resolution time</span>
            <span className="staff-side-panel__stat-value">{formatAverageDays(avgResolutionTime)}</span>
          </div>

          <div className="staff-side-panel__stat-row">
            <span className="staff-side-panel__stat-label">Reported today</span>
            <span className="staff-side-panel__stat-value">{reportedToday}</span>
          </div>

          <div className="staff-side-panel__stat-row">
            <span className="staff-side-panel__stat-label">Resolved in last 7 days</span>
            <span className="staff-side-panel__stat-value">{resolvedLast7Days}</span>
          </div>

          <div className="staff-side-panel__stat-row">
            <span className="staff-side-panel__stat-label">Overdue Issues</span>
            <span className="staff-side-panel__stat-value staff-side-panel__stat-value--alert">
              {staleCases}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSidePanel;