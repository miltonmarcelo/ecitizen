import React from "react";

type StatusBadgeProps = {
  status: string | null | undefined;
  className?: string;
};

type StatusToken = {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
};

const STATUS_TOKENS: Record<string, StatusToken> = {
  // Includes synonym keys so different API status formats map to one badge style.
  created: {
    label: "Created",
    bg: "var(--status-created-bg)",
    text: "var(--status-created-text)",
    border: "var(--status-created-border)",
    dot: "var(--status-created-dot)",
  },
  open: {
    label: "Open",
    bg: "var(--status-created-bg)",
    text: "var(--status-created-text)",
    border: "var(--status-created-border)",
    dot: "var(--status-created-dot)",
  },
  submitted: {
    label: "Submitted",
    bg: "var(--status-created-bg)",
    text: "var(--status-created-text)",
    border: "var(--status-created-border)",
    dot: "var(--status-created-dot)",
  },
  "under review": {
    label: "Under Review",
    bg: "var(--status-review-bg)",
    text: "var(--status-review-text)",
    border: "var(--status-review-border)",
    dot: "var(--status-review-dot)",
  },
  review: {
    label: "Under Review",
    bg: "var(--status-review-bg)",
    text: "var(--status-review-text)",
    border: "var(--status-review-border)",
    dot: "var(--status-review-dot)",
  },
  pending: {
    label: "Under Review",
    bg: "var(--status-review-bg)",
    text: "var(--status-review-text)",
    border: "var(--status-review-border)",
    dot: "var(--status-review-dot)",
  },
  "in progress": {
    label: "In Progress",
    bg: "var(--status-progress-bg)",
    text: "var(--status-progress-text)",
    border: "var(--status-progress-border)",
    dot: "var(--status-progress-dot)",
  },
  progress: {
    label: "In Progress",
    bg: "var(--status-progress-bg)",
    text: "var(--status-progress-text)",
    border: "var(--status-progress-border)",
    dot: "var(--status-progress-dot)",
  },
  active: {
    label: "In Progress",
    bg: "var(--status-progress-bg)",
    text: "var(--status-progress-text)",
    border: "var(--status-progress-border)",
    dot: "var(--status-progress-dot)",
  },
  resolved: {
    label: "Resolved",
    bg: "var(--status-resolved-bg)",
    text: "var(--status-resolved-text)",
    border: "var(--status-resolved-border)",
    dot: "var(--status-resolved-dot)",
  },
  fixed: {
    label: "Resolved",
    bg: "var(--status-resolved-bg)",
    text: "var(--status-resolved-text)",
    border: "var(--status-resolved-border)",
    dot: "var(--status-resolved-dot)",
  },
  closed: {
    label: "Closed",
    bg: "var(--status-closed-bg)",
    text: "var(--status-closed-text)",
    border: "var(--status-closed-border)",
    dot: "var(--status-closed-dot)",
  },
  done: {
    label: "Closed",
    bg: "var(--status-closed-bg)",
    text: "var(--status-closed-text)",
    border: "var(--status-closed-border)",
    dot: "var(--status-closed-dot)",
  },
  cancelled: {
    label: "Cancelled",
    bg: "var(--status-cancelled-bg)",
    text: "var(--status-cancelled-text)",
    border: "var(--status-cancelled-border)",
    dot: "var(--status-cancelled-dot)",
  },
  canceled: {
    label: "Cancelled",
    bg: "var(--status-cancelled-bg)",
    text: "var(--status-cancelled-text)",
    border: "var(--status-cancelled-border)",
    dot: "var(--status-cancelled-dot)",
  },
  rejected: {
    label: "Cancelled",
    bg: "var(--status-cancelled-bg)",
    text: "var(--status-cancelled-text)",
    border: "var(--status-cancelled-border)",
    dot: "var(--status-cancelled-dot)",
  },
  under_review: {
  label: "Under Review",
  bg: "var(--status-review-bg)",
  text: "var(--status-review-text)",
  border: "var(--status-review-border)",
  dot: "var(--status-review-dot)",
  },
  in_progress: {
    label: "In Progress",
    bg: "var(--status-progress-bg)",
    text: "var(--status-progress-text)",
    border: "var(--status-progress-border)",
    dot: "var(--status-progress-dot)",
  },
};

function normalizeStatus(status: string | null | undefined): string {
  if (!status) return "";

  return status
    .trim()
    .toLowerCase()
    // Normalizes snake_case and kebab-case into the same lookup format.
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  const normalized = normalizeStatus(status);
  const token = STATUS_TOKENS[normalized];

  // Falls back to a neutral badge when a status does not exist in token map.
  if (!token) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${className}`}
        style={{
          backgroundColor: "var(--color-surface-2)",
          color: "var(--app-text-secondary)",
          borderColor: "var(--app-border)",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "var(--app-text-tertiary)" }}
        />
        {status || "Unknown"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${className}`}
      style={{
        backgroundColor: token.bg,
        color: token.text,
        borderColor: token.border,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: token.dot }}
      />
      {token.label}
    </span>
  );
}
