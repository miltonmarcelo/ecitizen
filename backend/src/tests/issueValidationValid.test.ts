import { describe, it, expect } from "vitest";
import { isValidIssuePayload } from "../utils/issueValidation";

describe("isValidIssuePayload", () => {
  it("passes validation when all required issue fields are provided", () => {
    const payload = {
      title: "Pothole on Main Street",
      description: "Large pothole near the pedestrian crossing",
      category: "Roads",
      address: "Main Street, Dublin 1"
    };

    const result = isValidIssuePayload(payload);

    expect(result).toBe(true);
  });
});
