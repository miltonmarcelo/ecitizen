import { describe, it, expect } from "vitest";
import { filterIssuesByCategory } from "../utils/filterIssues";

describe("filterIssuesByCategory", () => {
  it("returns only issues with the selected category", () => {
    const issues = [
      { title: "Pothole on Main Street", status: "OPEN", category: "Roads" },
      { title: "Broken street light", status: "IN_PROGRESS", category: "Lighting" },
      { title: "Another pothole", status: "OPEN", category: "Roads" }
    ];

    const result = filterIssuesByCategory(issues, "Roads");

    expect(result).toHaveLength(2);
    expect(result.every(issue => issue.category === "Roads")).toBe(true);
  });
});
