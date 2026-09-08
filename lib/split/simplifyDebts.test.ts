import { describe, expect, it } from "vitest";
import { simplifyDebts } from "./simplifyDebts";

describe("simplifyDebts", () => {
  it("returns no settlements when everyone is settled up", () => {
    expect(simplifyDebts({ a: 0, b: 0 })).toEqual([]);
  });

  it("settles a simple two-person debt directly", () => {
    const result = simplifyDebts({ a: -200, b: 200 });
    expect(result).toEqual([{ fromUserId: "a", toUserId: "b", amount: 200 }]);
  });

  it("chains A owes B, B owes C into a single A -> C transaction", () => {
    // A owes B 200, B owes C 200 nets to: A -200, B 0, C 200
    const result = simplifyDebts({ a: -200, b: 0, c: 200 });
    expect(result).toEqual([{ fromUserId: "a", toUserId: "c", amount: 200 }]);
  });

  it("minimizes transactions for a three-person uneven split", () => {
    // A paid 300 for a group of 3 (100 each): A +200, B -100, C -100
    const result = simplifyDebts({ a: 200, b: -100, c: -100 });
    expect(result).toHaveLength(2);
    const total = result.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBe(200);
    expect(result.every((s) => s.toUserId === "a")).toBe(true);
  });

  it("handles multiple debtors and creditors with minimum transaction count", () => {
    // a: -300, b: -100, c: +250, d: +150
    const result = simplifyDebts({ a: -300, b: -100, c: 250, d: 150 });
    const netByUser: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
    for (const s of result) {
      netByUser[s.fromUserId] -= s.amount;
      netByUser[s.toUserId] += s.amount;
    }
    expect(netByUser).toEqual({ a: -300, b: -100, c: 250, d: 150 });
    // Minimum possible is 2 transactions for 4 unbalanced parties here.
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("is deterministic across repeated calls with the same input", () => {
    const balances = { a: -300, b: -100, c: 250, d: 150 };
    expect(simplifyDebts(balances)).toEqual(simplifyDebts(balances));
  });
});
