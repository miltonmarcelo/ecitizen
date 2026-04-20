export type IssuePayload = {
  title: string;
  description: string;
  category: string;
  address: string;
};

export function isValidIssuePayload(payload: IssuePayload): boolean {
  return Boolean(
    payload.title?.trim() &&
    payload.description?.trim() &&
    payload.category?.trim() &&
    payload.address?.trim()
  );
}
