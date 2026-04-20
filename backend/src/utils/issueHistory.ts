export type IssueHistoryEntry = {
  issueId: number;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
};

export function createStatusHistoryEntry(
  issueId: number,
  oldStatus: string,
  newStatus: string,
  changedBy: string
): IssueHistoryEntry {
  return {
    issueId,
    fieldChanged: "status",
    oldValue: oldStatus,
    newValue: newStatus,
    changedBy
  };
}
