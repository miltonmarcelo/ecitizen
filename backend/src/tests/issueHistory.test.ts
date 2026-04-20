import { describe, it, expect } from "vitest";
import { createStatusHistoryEntry } from "../utils/issueHistory";

describe("createStatusHistoryEntry", () => {
  it("creates the correct issue history record when status changes", () => {
    const result = createStatusHistoryEntry(
      101,
      "OPEN",
      "IN_PROGRESS",
      "staff.user@ecitizen.ie"
    );

    expect(result).toEqual({
      issueId: 101,
      fieldChanged: "status",
      oldValue: "OPEN",
      newValue: "IN_PROGRESS",
      changedBy: "staff.user@ecitizen.ie"
    });
  });
});
