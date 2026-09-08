import { describe, it, expect } from "vitest";
import { orderBetween } from "@/lib/ordering";
import { roleAtLeast } from "@/lib/roles";
import { Role } from "@prisma/client";

describe("orderBetween", () => {
  it("returns a midpoint between two neighbours", () => {
    expect(orderBetween(1000, 2000)).toBe(1500);
  });
  it("appends after the last item", () => {
    expect(orderBetween(3000, null)).toBe(4000);
  });
  it("prepends before the first item", () => {
    expect(orderBetween(null, 1000)).toBe(0);
  });
  it("defaults for an empty column", () => {
    expect(orderBetween(null, null)).toBe(1000);
  });
  it("keeps strict ordering after repeated inserts", () => {
    const lo = 1000;
    let hi = 2000;
    for (let i = 0; i < 10; i++) {
      const mid = orderBetween(lo, hi);
      expect(mid).toBeGreaterThan(lo);
      expect(mid).toBeLessThan(hi);
      hi = mid;
    }
  });
});

describe("roleAtLeast", () => {
  it("ranks roles correctly", () => {
    expect(roleAtLeast(Role.OWNER, Role.ADMIN)).toBe(true);
    expect(roleAtLeast(Role.ADMIN, Role.ADMIN)).toBe(true);
    expect(roleAtLeast(Role.MEMBER, Role.PROJECT_MANAGER)).toBe(false);
    expect(roleAtLeast(Role.PROJECT_MANAGER, Role.MEMBER)).toBe(true);
  });
});
