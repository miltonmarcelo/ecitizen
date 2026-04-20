import { describe, it, expect } from "vitest";
import { canAccessStaffRoute } from "../utils/accessControl";

describe("canAccessStaffRoute", () => {
  it("allows staff and admin to access staff routes", () => {
    expect(canAccessStaffRoute("STAFF")).toBe(true);
    expect(canAccessStaffRoute("ADMIN")).toBe(true);
  });
});
