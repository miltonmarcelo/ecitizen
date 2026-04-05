import type { IssueStatus } from "@/types/domain";

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  CREATED: "Open",
  UNDER_REVIEW: "Under Review",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const ISSUE_STATUS_BADGE_CLASSES: Record<IssueStatus, string> = {
  CREATED:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  UNDER_REVIEW:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  IN_PROGRESS:
    "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  RESOLVED:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  CLOSED:
    "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800",
  CANCELLED:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
};

export const ALL_ISSUE_STATUSES: IssueStatus[] = [
  "CREATED",
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
];

export const CITIZEN_STATUS_FLOW: IssueStatus[] = [
  "CREATED",
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export function formatIssueStatus(status: string): string {
  return ISSUE_STATUS_LABELS[status as IssueStatus] ?? status.replace(/_/g, " ");
}

export function getIssueStatusClass(status: string): string {
  return (
    ISSUE_STATUS_BADGE_CLASSES[status as IssueStatus] ??
    "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800"
  );
}

export function isFinalIssueStatus(status: string): boolean {
  return status === "RESOLVED" || status === "CLOSED" || status === "CANCELLED";
}
