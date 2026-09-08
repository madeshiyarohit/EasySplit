import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CURRENT_USER, GROUPS, userById } from "@/lib/mock-data";
import type { Expense } from "@/lib/types";
import { categoryColor, categoryIcon, formatCurrency, relativeTime } from "@/lib/utils";

export function ActivityFeed({ expenses }: { expenses: Expense[] }) {
  const sorted = [...expenses]
    .filter((e) => !e.isDeleted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No activity yet"
        description="Expenses you add will show up here."
      />
    );
  }

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {sorted.map((expense) => {
        const payer = userById(expense.paidById);
        const group = GROUPS.find((g) => g.id === expense.groupId);
        const isMe = expense.paidById === CURRENT_USER.id;
        const myShare = expense.splits.find((s) => s.userId === CURRENT_USER.id);

        return (
          <Link
            key={expense.id}
            href={`/groups/${expense.groupId}`}
            className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40 sm:p-5"
          >
            {/* Category icon */}
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${categoryColor(expense.category)}`}
            >
              {categoryIcon(expense.category)}
            </span>

            {/* Description + meta */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{expense.description}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {isMe ? "You" : payer.name} paid · {group?.name}
              </p>
            </div>

            {/* Amount + time */}
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums">
                {formatCurrency(expense.amount)}
              </p>
              {myShare && !isMe && (
                <p className="mt-0.5 text-xs text-destructive tabular-nums">
                  your share {formatCurrency(myShare.amountOwed)}
                </p>
              )}
              {isMe && myShare && (
                <p className="mt-0.5 text-xs text-positive tabular-nums">you paid</p>
              )}
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {relativeTime(expense.createdAt)}
              </p>
            </div>
          </Link>
        );
      })}
    </Card>
  );
}
