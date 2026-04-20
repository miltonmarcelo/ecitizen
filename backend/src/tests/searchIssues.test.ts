import { describe, it, expect } from "vitest";
import { searchIssuesByTitle } from "../utils/searchIssues";

describe("searchIssuesByTitle", () => {
  it("returns issues matching the title search", () => {
    const issues = [
      { title: "Pothole on Main Street", status: "OPEN", category: "Roads" },
      { title: "Broken street light", status: "IN_PROGRESS", category: "Lighting" },
      { title: "Graffiti on wall", status: "RESOLVED", category: "Graffiti" }
    ];

    const result = searchIssuesByTitle(issues, "pothole");

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Pothole on Main Street");
  });
});