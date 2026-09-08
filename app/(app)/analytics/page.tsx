"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EXPENSES, GROUPS, USERS, CURRENT_USER } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#6366f1",
  Travel: "#22c55e",
  Stay: "#f59e0b",
  Activity: "#ec4899",
  Shopping: "#14b8a6",
  Other: "#94a3b8",
  Utilities: "#3b82f6",
};

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍽️",
  Travel: "✈️",
  Stay: "🏠",
  Activity: "🎯",
  Shopping: "🛍️",
  Utilities: "⚡",
  Other: "📦",
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
}

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] ?? CATEGORY_ICONS.Other;
}

// ─── Derived static data ─────────────────────────────────────────────────────

const activeExpenses = EXPENSES.filter((e) => !e.isDeleted);
const allCategories = [...new Set(activeExpenses.map((e) => e.category ?? "Other"))];
const allGroupIds = [...new Set(activeExpenses.map((e) => e.groupId))];
const allPayerIds = [...new Set(activeExpenses.map((e) => e.paidById))];

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltipStyle() {
  return {
    borderRadius: "12px",
    border: "1px solid var(--border, #e2e8f0)",
    background: "var(--card, #ffffff)",
    color: "var(--foreground, #0f172a)",
    fontSize: "12px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  } as const;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  // Pie slice click filter
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Toggle chip filters (all selected by default)
  const [personFilter, setPersonFilter] = useState<Set<string>>(new Set(allPayerIds));
  const [groupFilter, setGroupFilter] = useState<Set<string>>(new Set(allGroupIds));
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set(allCategories));

  // ── Section 1: Category totals for pie chart ─────────────────────────────
  const categoryData = useMemo(
    () =>
      allCategories
        .map((cat) => ({
          name: cat,
          value: activeExpenses
            .filter((e) => (e.category ?? "Other") === cat)
            .reduce((sum, e) => sum + e.amount, 0),
          color: getCategoryColor(cat),
        }))
        .filter((d) => d.value > 0),
    []
  );

  const totalSpend = categoryData.reduce((sum, d) => sum + d.value, 0);

  // ── Section 2: Monthly spending ───────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { label: string; amount: number; sortKey: number }>();
    for (const expense of activeExpenses) {
      const date = new Date(expense.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      if (!monthMap.has(key)) {
        monthMap.set(key, { label, amount: 0, sortKey: year * 100 + month });
      }
      monthMap.get(key)!.amount += expense.amount;
    }
    return [...monthMap.values()]
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ label, amount }) => ({ month: label, amount }));
  }, []);

  // ── Section 3: Top payers ─────────────────────────────────────────────────
  const payerData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const expense of activeExpenses) {
      map[expense.paidById] = (map[expense.paidById] ?? 0) + expense.amount;
    }
    return Object.entries(map)
      .map(([userId, amount]) => ({
        user: USERS.find((u) => u.id === userId) ?? { id: userId, name: "Unknown", upiId: "" },
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, []);

  const maxPayerAmount = payerData[0]?.amount ?? 1;

  // ── Section 3: Net balances ───────────────────────────────────────────────
  const balanceData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const expense of activeExpenses) {
      map[expense.paidById] = (map[expense.paidById] ?? 0) + expense.amount;
      for (const split of expense.splits) {
        map[split.userId] = (map[split.userId] ?? 0) - split.amountOwed;
      }
    }
    return Object.entries(map)
      .map(([userId, net]) => ({
        user: USERS.find((u) => u.id === userId) ?? { id: userId, name: "Unknown", upiId: "" },
        net,
      }))
      .sort((a, b) => b.net - a.net);
  }, []);

  // ── Section 4: Filtered expense list ─────────────────────────────────────
  const filteredExpenses = useMemo(
    () =>
      activeExpenses
        .filter((e) => {
          if (!personFilter.has(e.paidById)) return false;
          if (!groupFilter.has(e.groupId)) return false;
          const cat = e.category ?? "Other";
          if (!categoryFilter.has(cat)) return false;
          if (selectedCategory && cat !== selectedCategory) return false;
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [personFilter, groupFilter, categoryFilter, selectedCategory]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handlePieClick(entry: { name: string } | null) {
    if (!entry?.name) return;
    setSelectedCategory((prev) => (prev === entry.name ? null : entry.name));
  }

  function togglePerson(id: string) {
    setPersonFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(id: string) {
    setGroupFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCategoryChip(cat: string) {
    setCategoryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visual breakdown of your group spending
        </p>
      </div>

      {/* ── Section 1: Spending by Category ── */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-10">
            {/* Donut chart */}
            <div className="relative shrink-0" style={{ width: 220, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    strokeWidth={0}
                    onClick={(data) => handlePieClick(data as { name: string })}
                    className="cursor-pointer outline-none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={
                          selectedCategory && selectedCategory !== entry.name ? 0.25 : 1
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), "Spent"]}
                    contentStyle={ChartTooltipStyle()}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <p className="text-[11px] text-muted-foreground">
                  {selectedCategory ?? "Total"}
                </p>
                <p className="text-base font-bold tabular-nums">
                  {formatCurrency(
                    selectedCategory
                      ? (categoryData.find((d) => d.name === selectedCategory)?.value ?? 0)
                      : totalSpend
                  )}
                </p>
              </div>
            </div>

            {/* Legend with amounts */}
            <div className="flex flex-col gap-2 w-full">
              {categoryData.map((entry) => {
                const pct = Math.round((entry.value / totalSpend) * 100);
                const active = !selectedCategory || selectedCategory === entry.name;
                return (
                  <button
                    key={entry.name}
                    onClick={() => handlePieClick(entry)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      active ? "opacity-100" : "opacity-40"
                    }`}
                    style={{
                      borderColor: entry.color + "30",
                      background: entry.color + "0d",
                    }}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: entry.color }}
                    />
                    <span className="flex-1 text-sm font-medium">{entry.name}</span>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: entry.color }}
                    >
                      {formatCurrency(entry.value)}
                    </span>
                  </button>
                );
              })}
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 self-start text-xs"
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear selection
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Monthly Spending ── */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barCategoryGap="35%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground, 215 20% 65%))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
                }
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground, 215 20% 65%))" }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value ?? 0)), "Spent"]}
                contentStyle={ChartTooltipStyle()}
                cursor={{ fill: "#6366f120" }}
              />
              <Bar
                dataKey="amount"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={64}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Section 3: By Person ── */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Top Payers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Payers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payerData.map(({ user, amount }) => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar name={user.name} src={"avatarUrl" in user ? (user as { avatarUrl?: string | null }).avatarUrl : null} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{user.name}</span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#6366f1] transition-all duration-500"
                      style={{ width: `${(amount / maxPayerAmount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Net Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Net Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {balanceData.map(({ user, net }) => (
              <div key={user.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={user.name} src={"avatarUrl" in user ? (user as { avatarUrl?: string | null }).avatarUrl : null} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    {user.id === CURRENT_USER.id && (
                      <p className="text-[10px] text-muted-foreground">you</p>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    net > 0
                      ? "text-emerald-500"
                      : net < 0
                        ? "text-rose-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {net > 0 ? "+" : ""}
                  {formatCurrency(net)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Section 4: Filterable Expense List ── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle>Expense List</CardTitle>
            <p className="text-xs text-muted-foreground pt-1 shrink-0">
              Showing {filteredExpenses.length} of {activeExpenses.length}
              {selectedCategory && (
                <> · <span className="font-medium text-foreground">{selectedCategory}</span></>
              )}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Filter chips */}
          <div className="space-y-4">
            {/* People */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                People
              </p>
              <div className="flex flex-wrap gap-2">
                {allPayerIds.map((id) => {
                  const user = USERS.find((u) => u.id === id) ?? { id, name: "Unknown", upiId: "" };
                  const active = personFilter.has(id);
                  return (
                    <button
                      key={id}
                      onClick={() => togglePerson(id)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                        active
                          ? "border-[#6366f1]/30 bg-[#6366f1]/10 text-[#6366f1]"
                          : "border-border bg-muted/30 text-muted-foreground line-through opacity-50"
                      }`}
                    >
                      <Avatar
                        name={user.name}
                        src={"avatarUrl" in user ? (user as { avatarUrl?: string | null }).avatarUrl : null}
                        size="sm"
                        className="h-4 w-4 text-[8px]"
                      />
                      {user.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Groups */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Groups
              </p>
              <div className="flex flex-wrap gap-2">
                {allGroupIds.map((id) => {
                  const group = GROUPS.find((g) => g.id === id);
                  const active = groupFilter.has(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleGroup(id)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                        active
                          ? "border-[#6366f1]/30 bg-[#6366f1]/10 text-[#6366f1]"
                          : "border-border bg-muted/30 text-muted-foreground line-through opacity-50"
                      }`}
                    >
                      {group?.name ?? id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => {
                  const color = getCategoryColor(cat);
                  const active = categoryFilter.has(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategoryChip(cat)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                        active ? "" : "opacity-40 line-through"
                      }`}
                      style={
                        active
                          ? {
                              borderColor: color + "40",
                              background: color + "14",
                              color,
                            }
                          : {
                              borderColor: "var(--border)",
                              background: "transparent",
                              color: "var(--muted-foreground)",
                            }
                      }
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: active ? color : "currentColor" }}
                      />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Expense rows */}
          <div className="space-y-2">
            {filteredExpenses.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No expenses match your filters
              </p>
            ) : (
              filteredExpenses.map((expense) => {
                const payer =
                  USERS.find((u) => u.id === expense.paidById) ??
                  ({ id: expense.paidById, name: "Unknown", upiId: "" } as (typeof USERS)[0]);
                const group = GROUPS.find((g) => g.id === expense.groupId);
                const cat = expense.category ?? "Other";
                const color = getCategoryColor(cat);
                const icon = getCategoryIcon(cat);
                const dateStr = new Date(expense.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-3 transition-colors hover:bg-card"
                  >
                    {/* Left: icon + info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                        style={{ background: color + "1a" }}
                      >
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{expense.description}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {dateStr} · {group?.name ?? expense.groupId} · paid by{" "}
                          <span className="font-medium text-foreground">
                            {payer.name.split(" ")[0]}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Right: amount + category badge */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(expense.amount)}
                      </p>
                      <span
                        className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: color + "1a", color }}
                      >
                        {cat}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
