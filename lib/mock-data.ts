import type { Expense, Group, User } from "@/lib/types";

export const CURRENT_USER: User = {
  id: "u1",
  name: "Rahul Verma",
  avatarUrl: null,
  upiId: "rahul@upi",
};

export const USERS: User[] = [
  CURRENT_USER,
  { id: "u2", name: "Priya Sharma", upiId: "priya@upi" },
  { id: "u3", name: "Rohan Mehta", upiId: "rohan@upi" },
  { id: "u4", name: "Ananya Iyer", upiId: "ananya@upi" },
  { id: "u5", name: "Vikram Nair", upiId: "vikram@upi" },
  { id: "u6", name: "Sneha Patel", upiId: "sneha@upi" },
];

export const GROUPS: Group[] = [
  {
    id: "g1",
    name: "Goa Trip 2026",
    inviteCode: "goa2026x",
    createdAt: "2026-08-20T10:00:00Z",
    members: [
      { user: CURRENT_USER },
      { user: USERS[1] },
      { user: USERS[2] },
      { user: USERS[3] },
      { user: USERS[4] },
    ],
  },
  {
    id: "g2",
    name: "Flatmates — Koramangala",
    inviteCode: "flat9812",
    createdAt: "2026-06-01T10:00:00Z",
    members: [{ user: CURRENT_USER }, { user: USERS[1] }, { user: USERS[2] }],
  },
  {
    id: "g3",
    name: "Weekend Trek Club",
    inviteCode: "trek4451",
    createdAt: "2026-07-15T10:00:00Z",
    members: [{ user: CURRENT_USER }, { user: USERS[3] }, { user: USERS[5] }],
  },
];

export const EXPENSES: Expense[] = [
  // --- Goa Trip ---
  {
    id: "e1",
    groupId: "g1",
    paidById: "u1",
    amount: 8400,
    description: "Beachfront Airbnb — 3 nights",
    splitType: "EQUAL",
    category: "Stay",
    createdAt: "2026-09-05T14:00:00Z",
    isDeleted: false,
    splits: [
      { id: "s1", userId: "u1", amountOwed: 1680, settled: true },
      { id: "s2", userId: "u2", amountOwed: 1680, settled: false },
      { id: "s3", userId: "u3", amountOwed: 1680, settled: false },
      { id: "s4", userId: "u4", amountOwed: 1680, settled: false },
      { id: "s5", userId: "u5", amountOwed: 1680, settled: false },
    ],
  },
  {
    id: "e2",
    groupId: "g1",
    paidById: "u2",
    amount: 3200,
    description: "Scuba diving — Grand Island",
    splitType: "EQUAL",
    category: "Activity",
    createdAt: "2026-09-06T09:30:00Z",
    isDeleted: false,
    splits: [
      { id: "s6", userId: "u1", amountOwed: 640, settled: false },
      { id: "s7", userId: "u2", amountOwed: 640, settled: true },
      { id: "s8", userId: "u3", amountOwed: 640, settled: false },
      { id: "s9", userId: "u4", amountOwed: 640, settled: false },
      { id: "s10", userId: "u5", amountOwed: 640, settled: false },
    ],
  },
  {
    id: "e3",
    groupId: "g1",
    paidById: "u3",
    amount: 2800,
    description: "Seafood dinner at Fisherman's Wharf",
    splitType: "EQUAL",
    category: "Food",
    createdAt: "2026-09-06T20:30:00Z",
    isDeleted: false,
    splits: [
      { id: "s11", userId: "u1", amountOwed: 560, settled: false },
      { id: "s12", userId: "u2", amountOwed: 560, settled: false },
      { id: "s13", userId: "u3", amountOwed: 560, settled: true },
      { id: "s14", userId: "u4", amountOwed: 560, settled: false },
      { id: "s15", userId: "u5", amountOwed: 560, settled: false },
    ],
  },
  {
    id: "e4",
    groupId: "g1",
    paidById: "u4",
    amount: 1800,
    description: "Bike rentals for 2 days",
    splitType: "EQUAL",
    category: "Travel",
    createdAt: "2026-09-07T08:00:00Z",
    isDeleted: false,
    splits: [
      { id: "s16", userId: "u1", amountOwed: 360, settled: false },
      { id: "s17", userId: "u2", amountOwed: 360, settled: false },
      { id: "s18", userId: "u3", amountOwed: 360, settled: false },
      { id: "s19", userId: "u4", amountOwed: 360, settled: true },
      { id: "s20", userId: "u5", amountOwed: 360, settled: false },
    ],
  },
  // --- Flatmates ---
  {
    id: "e5",
    groupId: "g2",
    paidById: "u3",
    amount: 5400,
    description: "Electricity bill — August",
    splitType: "EQUAL",
    category: "Utilities",
    createdAt: "2026-09-01T18:20:00Z",
    isDeleted: false,
    splits: [
      { id: "s21", userId: "u1", amountOwed: 1800, settled: false },
      { id: "s22", userId: "u2", amountOwed: 1800, settled: false },
      { id: "s23", userId: "u3", amountOwed: 1800, settled: true },
    ],
  },
  {
    id: "e6",
    groupId: "g2",
    paidById: "u1",
    amount: 3600,
    description: "Internet — 3 months advance",
    splitType: "EQUAL",
    category: "Utilities",
    createdAt: "2026-08-15T11:00:00Z",
    isDeleted: false,
    splits: [
      { id: "s24", userId: "u1", amountOwed: 1200, settled: true },
      { id: "s25", userId: "u2", amountOwed: 1200, settled: false },
      { id: "s26", userId: "u3", amountOwed: 1200, settled: false },
    ],
  },
  {
    id: "e7",
    groupId: "g2",
    paidById: "u2",
    amount: 2100,
    description: "Groceries — September week 1",
    splitType: "EQUAL",
    category: "Food",
    createdAt: "2026-09-03T17:45:00Z",
    isDeleted: false,
    splits: [
      { id: "s27", userId: "u1", amountOwed: 700, settled: false },
      { id: "s28", userId: "u2", amountOwed: 700, settled: true },
      { id: "s29", userId: "u3", amountOwed: 700, settled: false },
    ],
  },
  // --- Weekend Trek ---
  {
    id: "e8",
    groupId: "g3",
    paidById: "u4",
    amount: 1200,
    description: "Trail snacks & water",
    splitType: "EQUAL",
    category: "Food",
    createdAt: "2026-08-30T08:00:00Z",
    isDeleted: false,
    splits: [
      { id: "s30", userId: "u1", amountOwed: 400, settled: false },
      { id: "s31", userId: "u4", amountOwed: 400, settled: true },
      { id: "s32", userId: "u6", amountOwed: 400, settled: false },
    ],
  },
  {
    id: "e9",
    groupId: "g3",
    paidById: "u1",
    amount: 4500,
    description: "Camping gear rental",
    splitType: "EQUAL",
    category: "Activity",
    createdAt: "2026-08-28T12:00:00Z",
    isDeleted: false,
    splits: [
      { id: "s33", userId: "u1", amountOwed: 1500, settled: true },
      { id: "s34", userId: "u4", amountOwed: 1500, settled: false },
      { id: "s35", userId: "u6", amountOwed: 1500, settled: false },
    ],
  },
  {
    id: "e10",
    groupId: "g3",
    paidById: "u6",
    amount: 900,
    description: "Permit fees — Kudremukh trek",
    splitType: "EQUAL",
    category: "Other",
    createdAt: "2026-08-28T07:00:00Z",
    isDeleted: false,
    splits: [
      { id: "s36", userId: "u1", amountOwed: 300, settled: false },
      { id: "s37", userId: "u4", amountOwed: 300, settled: false },
      { id: "s38", userId: "u6", amountOwed: 300, settled: true },
    ],
  },
];

export function userById(id: string): User {
  return USERS.find((u) => u.id === id) ?? { id, name: "Unknown" };
}

export function computeGroupBalances(
  groupId: string,
  expenses: Expense[] = EXPENSES
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const expense of expenses.filter((e) => e.groupId === groupId && !e.isDeleted)) {
    balances[expense.paidById] = (balances[expense.paidById] ?? 0) + expense.amount;
    for (const split of expense.splits) {
      balances[split.userId] = (balances[split.userId] ?? 0) - split.amountOwed;
    }
  }
  return balances;
}

export function computeUserNet(
  userId: string,
  expenses: Expense[] = EXPENSES
): { owedToYou: number; youOwe: number } {
  let owedToYou = 0;
  let youOwe = 0;
  const groupIds = new Set(expenses.map((e) => e.groupId));
  for (const groupId of groupIds) {
    const balances = computeGroupBalances(groupId, expenses);
    const net = balances[userId] ?? 0;
    if (net > 0) owedToYou += net;
    else youOwe += -net;
  }
  return { owedToYou, youOwe };
}

export function computePersonalBalances(
  userId: string,
  expenses: Expense[] = EXPENSES
): { user: User; net: number }[] {
  const netMap: Record<string, number> = {};
  for (const expense of expenses.filter((e) => !e.isDeleted)) {
    if (expense.paidById === userId) {
      for (const split of expense.splits) {
        if (split.userId !== userId && !split.settled) {
          netMap[split.userId] = (netMap[split.userId] ?? 0) + split.amountOwed;
        }
      }
    } else {
      const myShare = expense.splits.find((s) => s.userId === userId);
      if (myShare && !myShare.settled) {
        netMap[expense.paidById] = (netMap[expense.paidById] ?? 0) - myShare.amountOwed;
      }
    }
  }
  return Object.entries(netMap)
    .filter(([, net]) => net !== 0)
    .map(([uid, net]) => ({ user: userById(uid), net }))
    .sort((a, b) => b.net - a.net);
}
