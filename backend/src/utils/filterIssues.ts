export type FilterIssue = {
  title: string;
  status: string;
  category?: string;
};

export function filterIssuesByStatus(issues: FilterIssue[], status: string): FilterIssue[] {
  if (!status || status === "ALL") return issues;

  return issues.filter(issue => issue.status === status);
}

export function filterIssuesByCategory(issues: FilterIssue[], category: string): FilterIssue[] {
  if (!category || category === "ALL") return issues;

  return issues.filter(issue => issue.category === category);
}
