import { describe, it, expect } from "vitest";
import { canAccessStaffRoute } from "../utils/accessControl";

describe("canAccessStaffRoute", () => {
  it("blocks citizens from accessing staff routes", () => {
    expect(canAccessStaffRoute("CITIZEN")).toBe(false);
    expect(canAccessStaffRoute(undefined)).toBe(false);
    expect(canAccessStaffRoute(null)).toBe(false);
  });
});
