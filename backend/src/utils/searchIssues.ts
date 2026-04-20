export type TestIssue = {
  title: string;
  status?: string;
  category?: string;
};

export function searchIssuesByTitle(issues: TestIssue[], query: string): TestIssue[] {
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) return issues;

  return issues.filter(issue =>
    issue.title.toLowerCase().includes(cleanQuery)
  );
}