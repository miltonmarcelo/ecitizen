import type { Role, IssueStatus, IssueEventType } from "@/types/domain";

export type SortDirection = "asc" | "desc";

export type AdminCounts = {
  users: number;
  staff: number;
  categories: number;
  issues: number;
  notes: number;
  history: number;
};

export type AdminUser = {
  id: number;
  firebaseUid?: string | null;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staffProfile?: {
    id: number;
    userId: number;
    jobTitle: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  _count?: {
    issues: number;
    historyItems: number;
  };
};

export type AdminStaff = {
  id: number;
  userId: number;
  jobTitle: string;
  createdAt: string;
  updatedAt: string;
  user: AdminUser;
  _count?: {
    assignedIssues: number;
    notes: number;
  };
};

export type AdminCategory = {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    issues: number;
  };
};

export type AdminIssue = {
  id: number;
  caseId: string;
  title: string;
  description: string;
  categoryId?: number | null;
  status: IssueStatus;
  addressLine1: string;
  addressLine2?: string | null;
  suburb?: string | null;
  area?: string | null;
  city: string;
  county: string;
  citizenId: number;
  staffId?: number | null;
  createdAt: string;
  updatedAt: string;
  category?: AdminCategory | null;
  citizen?: Pick<AdminUser, "id" | "fullName" | "email" | "role" | "isActive">;
  staff?: {
    id: number;
    jobTitle: string;
    user?: Pick<AdminUser, "id" | "fullName" | "email" | "role" | "isActive">;
  } | null;
  _count?: {
    notes: number;
    history: number;
  };
};

export type AdminNote = {
  id: number;
  content: string;
  createdAt: string;
  issue: {
    id: number;
    caseId: string;
    title: string;
    status: IssueStatus;
  };
  staff: {
    id: number;
    jobTitle: string;
    user?: Pick<AdminUser, "id" | "fullName" | "email" | "role">;
  };
};

export type AdminHistory = {
  id: number;
  eventType: IssueEventType;
  fromStatus?: IssueStatus | null;
  toStatus?: IssueStatus | null;
  comment?: string | null;
  changedAt: string;
  issue: {
    id: number;
    caseId: string;
    title: string;
    status: IssueStatus;
  };
  changedByUser: Pick<AdminUser, "id" | "fullName" | "email" | "role" | "isActive">;
};

export const ADMIN_ROLE_OPTIONS: Role[] = ["CITIZEN", "STAFF", "ADMIN"];

export function formatDateTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}

export function compareValues(a: unknown, b: unknown) {
  const preparedA = toComparable(a);
  const preparedB = toComparable(b);

  if (preparedA < preparedB) return -1;
  if (preparedA > preparedB) return 1;
  return 0;
}

function toComparable(value: unknown): number | string {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (value === null || value === undefined) return "";

  if (typeof value === "string") {
    const maybeDate = Date.parse(value);
    if (!Number.isNaN(maybeDate) && value.includes("T")) {
      return maybeDate;
    }

    return value.toLowerCase();
  }

  return String(value).toLowerCase();
}

export function includesSearchValue(values: unknown[], query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) return true;

  return values.some((value) => normalizeText(value).includes(normalizedQuery));
}
