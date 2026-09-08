"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GroupDetail } from "@/components/group/group-detail";
import { EXPENSES, GROUPS, computeGroupBalances } from "@/lib/mock-data";
import { getStoredGroups } from "@/lib/groups-store";
import { getStoredExpenses } from "@/lib/expenses-store";
import type { Expense, Group } from "@/lib/types";

export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [extraGroups, setExtraGroups] = useState<Group[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setExtraGroups(getStoredGroups());
    setExtraExpenses(getStoredExpenses());
    setLoaded(true);
  }, []);

  const allGroups = useMemo(() => [...GROUPS, ...extraGroups], [extraGroups]);
  const allExpenses = useMemo(() => [...EXPENSES, ...extraExpenses], [extraExpenses]);

  const group = allGroups.find((g) => g.id === groupId);

  if (!group) {
    if (!loaded) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-xl bg-muted" />
          <div className="h-32 rounded-2xl bg-muted" />
          <div className="h-48 rounded-2xl bg-muted" />
        </div>
      );
    }
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Group not found</p>
        <p className="mt-1 text-sm text-muted-foreground">This group may have been removed.</p>
      </div>
    );
  }

  const expenses = allExpenses.filter((e) => e.groupId === groupId && !e.isDeleted);
  const balances = computeGroupBalances(groupId, allExpenses);

  return <GroupDetail group={group} expenses={expenses} balances={balances} />;
}
