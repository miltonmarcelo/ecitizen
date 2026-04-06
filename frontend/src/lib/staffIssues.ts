import type { IssueStatus, Role } from "@/types/domain";
import { formatIssueStatus } from "@/lib/issueMeta";

export type ApiCategory = {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
};

export type ApiStaffSummary = {
  id: number;
  jobTitle?: string | null;
  user?: {
    id?: number;
    fullName?: string | null;
    email?: string | null;
  } | null;
} | null;

export type ApiAssignableStaffMember = {
  id: number;
  userId: number;
  jobTitle?: string | null;
  user?: {
    id?: number;
    fullName?: string | null;
    email?: string | null;
    role?: Role | null;
  } | null;
};

export type ApiCitizenSummary = {
  id: number;
  fullName: string;
  email: string;
} | null;

export type ApiStaffIssue = {
  id: number;
  caseId: string;
  title: string;
  description: string;
  categoryId: number | null;
  category: ApiCategory | null;
  status: IssueStatus;
  addressLine1: string;
  addressLine2?: string | null;
  suburb?: string | null;
  area?: string | null;
  city: string;
  county: string;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;
  citizen?: ApiCitizenSummary;
  staff?: ApiStaffSummary;
};

export type StaffTableIssue = {
  caseId: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  daysOpen: number;
};

const FINAL_STATUSES: IssueStatus[] = ["RESOLVED", "CLOSED", "CANCELLED"];

export const STAFF_DASHBOARD_STATUS_OPTIONS: IssueStatus[] = [
  "CREATED",
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
];

export function calculateDaysOpen(
  createdAt: string,
  status: IssueStatus,
  updatedAt: string
): number {
  const start = new Date(createdAt).getTime();
  const end = FINAL_STATUSES.includes(status)
    ? new Date(updatedAt).getTime()
    : Date.now();

  const diff = Math.floor((end - start) / 86400000);
  return Math.max(0, diff);
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatShortDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildIssueLocation(issue: {
  addressLine1: string;
  addressLine2?: string | null;
  suburb?: string | null;
  area?: string | null;
  city: string;
  county: string;
}): string {
  return [
    issue.addressLine1,
    issue.addressLine2,
    issue.suburb,
    issue.area,
    issue.city,
    issue.county,
  ]
    .filter(Boolean)
    .join(", ");
}

export function getStaffDisplayName(staff?: ApiStaffSummary | ApiAssignableStaffMember | null): string {
  return staff?.user?.fullName || "Unassigned";
}

export function mapApiIssueToTableIssue(issue: ApiStaffIssue): StaffTableIssue {
  return {
    caseId: issue.caseId,
    title: issue.title,
    category: issue.category?.name || "Uncategorised",
    status: formatIssueStatus(issue.status),
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    daysOpen: calculateDaysOpen(issue.createdAt, issue.status, issue.updatedAt),
  };
}
