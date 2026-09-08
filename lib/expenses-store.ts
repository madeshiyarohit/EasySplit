import type { Expense } from "@/lib/types";

const KEY = "spliteasy_expenses";

export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch { return []; }
}

export function addStoredExpense(e: Expense): void {
  const all = getStoredExpenses();
  all.push(e);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

export function removeStoredExpense(id: string): void {
  const all = getStoredExpenses().filter((e) => e.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}
