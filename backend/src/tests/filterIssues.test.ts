import { describe, it, expect } from "vitest";
import { filterIssuesByStatus } from "../utils/filterIssues";

describe("filterIssuesByStatus", () => {
  it("returns only issues with the selected status", () => {
    const issues = [
      { title: "Pothole on Main Street", status: "OPEN", category: "Roads" },
      { title: "Broken street light", status: "IN_PROGRESS", category: "Lighting" },
      { title: "Graffiti on wall", status: "OPEN", category: "Graffiti" }
    ];

    const result = filterIssuesByStatus(issues, "OPEN");

    expect(result).toHaveLength(2);
    expect(result.every(issue => issue.status === "OPEN")).toBe(true);
  });
});
