import { describe, it, expect } from "vitest";
import { isValidIssuePayload } from "../utils/issueValidation";

describe("isValidIssuePayload", () => {
  it("fails validation when required issue fields are missing", () => {
    const payload = {
      title: "",
      description: "Large pothole near the pedestrian crossing",
      category: "Roads",
      address: ""
    };

    const result = isValidIssuePayload(payload);

    expect(result).toBe(false);
  });
});
