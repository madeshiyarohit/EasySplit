"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { userById } from "@/lib/mock-data";
import type { SimplifiedSettlement } from "@/lib/split/simplifyDebts";
import { buildUpiDeepLink } from "@/lib/upi";
import { formatCurrency } from "@/lib/utils";

export function SettleUpDialog({
  groupName,
  settlements,
  onClose,
}: {
  groupName: string;
  settlements: SimplifiedSettlement[];
  onClose: () => void;
}) {
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass w-full max-w-md rounded-t-3xl border border-border bg-surface/90 p-6 sm:rounded-3xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Settle up · {groupName}</h3>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {settlements.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Everyone is settled up. Nothing to pay.
              </p>
            )}
            {settlements.map((s, i) => {
              const from = userById(s.fromUserId);
              const to = userById(s.toUserId);
              const isDone = confirmed.has(i);
              const upiLink = to.upiId
                ? buildUpiDeepLink({
                    payeeUpiId: to.upiId,
                    payeeName: to.name,
                    amount: s.amount,
                    note: `Settle up: ${groupName}`,
                  })
                : undefined;

              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar name={from.name} size="sm" />
                    <span className="truncate text-sm">
                      {from.name} <span className="text-muted-foreground">pays</span> {to.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(s.amount)}
                    </span>
                    {isDone ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-positive/10 text-positive">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        {upiLink && (
                          <a href={upiLink} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="accent">
                              <Smartphone className="h-3.5 w-3.5" />
                              UPI
                            </Button>
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmed((prev) => new Set(prev).add(i))}
                        >
                          Mark paid
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
