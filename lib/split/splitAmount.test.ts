import { describe, expect, it } from "vitest";
import { splitByPercentage, splitByShares, splitEqual, splitUnequal } from "./splitAmount";

describe("splitEqual", () => {
  it("splits evenly with no remainder", () => {
    expect(splitEqual(300, ["a", "b", "c"])).toEqual([
      { userId: "a", amountOwed: 100 },
      { userId: "b", amountOwed: 100 },
      { userId: "c", amountOwed: 100 },
    ]);
  });

  it("allocates the rounding remainder to the first participants (₹100 / 3)", () => {
    // 10000 paise / 3 = 33.33... -> 3334 + 3333 + 3333
    const result = splitEqual(10000, ["a", "b", "c"]);
    expect(result).toEqual([
      { userId: "a", amountOwed: 3334 },
      { userId: "b", amountOwed: 3333 },
      { userId: "c", amountOwed: 3333 },
    ]);
    expect(result.reduce((sum, s) => sum + s.amountOwed, 0)).toBe(10000);
  });
});

describe("splitByPercentage", () => {
  it("splits by percentage and preserves the total", () => {
    const result = splitByPercentage(10000, [
      { userId: "a", percentage: 33.33 },
      { userId: "b", percentage: 33.33 },
      { userId: "c", percentage: 33.34 },
    ]);
    expect(result.reduce((sum, s) => sum + s.amountOwed, 0)).toBe(10000);
  });

  it("throws if percentages don't sum to 100", () => {
    expect(() =>
      splitByPercentage(10000, [
        { userId: "a", percentage: 50 },
        { userId: "b", percentage: 40 },
      ])
    ).toThrow();
  });
});

describe("splitByShares", () => {
  it("splits proportionally to shares and preserves the total", () => {
    const result = splitByShares(9000, [
      { userId: "a", shares: 2 },
      { userId: "b", shares: 1 },
    ]);
    expect(result.reduce((sum, s) => sum + s.amountOwed, 0)).toBe(9000);
    expect(result.find((s) => s.userId === "a")?.amountOwed).toBe(6000);
    expect(result.find((s) => s.userId === "b")?.amountOwed).toBe(3000);
  });

  it("handles remainders deterministically while preserving the total", () => {
    const result = splitByShares(10000, [
      { userId: "a", shares: 1 },
      { userId: "b", shares: 1 },
      { userId: "c", shares: 1 },
    ]);
    expect(result.reduce((sum, s) => sum + s.amountOwed, 0)).toBe(10000);
  });
});

describe("splitUnequal", () => {
  it("accepts amounts that sum to the total", () => {
    const result = splitUnequal(10000, [
      { userId: "a", amountOwed: 6000 },
      { userId: "b", amountOwed: 4000 },
    ]);
    expect(result).toHaveLength(2);
  });

  it("throws when amounts don't sum to the total", () => {
    expect(() =>
      splitUnequal(10000, [
        { userId: "a", amountOwed: 6000 },
        { userId: "b", amountOwed: 3000 },
      ])
    ).toThrow();
  });
});
