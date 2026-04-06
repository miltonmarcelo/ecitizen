export type Role = "CITIZEN" | "STAFF" | "ADMIN";

export type IssueStatus =
  | "CREATED"
  | "UNDER_REVIEW"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

export type IssueEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "NOTE_ADDED"
  | "INFO_REQUESTED"
  | "INFO_RECEIVED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "REOPENED";