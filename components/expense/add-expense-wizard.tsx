"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Receipt, UserPlus, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { StepProgress } from "@/components/expense/step-progress";
import { GROUPS, userById } from "@/lib/mock-data";
import { addStoredExpense } from "@/lib/expenses-store";
import { addContact, getContacts } from "@/lib/contacts-store";
import { useToast } from "@/lib/toast";
import { useAddExpenseStore } from "@/lib/store/add-expense-store";
import {
  splitByPercentage,
  splitByShares,
  splitEqual,
  splitUnequal,
} from "@/lib/split/splitAmount";
import type { SplitShare } from "@/lib/split/splitAmount";
import type { SplitType, User } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

// ── Number-to-words (Indian numbering: crore / lakh / thousand) ──────────
const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function _w100(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}
function _w1000(n: number): string {
  if (n < 100) return _w100(n);
  return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + _w100(n % 100) : "");
}
function numberToWords(n: number): string {
  if (!n || n <= 0) return "";
  n = Math.floor(n);
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);   if (crore)    { parts.push(_w100(crore) + " crore");    n %= 10_000_000; }
  const lakh  = Math.floor(n / 100_000);       if (lakh)     { parts.push(_w100(lakh) + " lakh");      n %= 100_000; }
  const thou  = Math.floor(n / 1_000);         if (thou)     { parts.push(_w1000(thou) + " thousand"); n %= 1_000; }
  if (n)                                                        parts.push(_w1000(n));
  return parts.join(" ");
}

const SPLIT_TYPE_LABELS: Record<SplitType, string> = {
  EQUAL: "Equal",
  UNEQUAL: "Unequal",
  PERCENTAGE: "Percentage",
  SHARES: "Shares",
};

const CATEGORIES = ["Food", "Stay", "Travel", "Activity", "Utilities", "Other"];

const variants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

function fmtDisplay(raw: string): string {
  const clean = raw.replace(/[^0-9.]/g, "");
  const [intPart, ...decParts] = clean.split(".");
  const hasDec = decParts.length > 0;
  const int = parseInt(intPart || "0", 10);
  const formatted = intPart ? int.toLocaleString("en-IN") : "";
  return formatted + (hasDec ? "." + decParts.join("") : "");
}

export function AddExpenseWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const store = useAddExpenseStore();

  const [displayAmount, setDisplayAmount] = useState(() =>
    store.amount ? store.amount.toLocaleString("en-IN") : ""
  );
  const [extraMembers, setExtraMembers] = useState<User[]>([]);
  const [showAddPayer, setShowAddPayer] = useState(false);
  const [lastChangedUnequalId, setLastChangedUnequalId] = useState<string | null>(null);
  const [storedContacts, setStoredContacts] = useState<{ id: string; name: string; avatarDataUrl: string | null }[]>([]);

  useEffect(() => {
    setStoredContacts(getContacts().map((c) => ({ id: c.id, name: c.name, avatarDataUrl: c.avatarDataUrl })));
  }, []);

  // New person form fields (full set)
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUpi, setNewUpi] = useState("");
  const [newPhonePe, setNewPhonePe] = useState("");
  const [newGooglePay, setNewGooglePay] = useState("");
  const [newPaytm, setNewPaytm] = useState("");

  useEffect(() => {
    const g = searchParams.get("group");
    if (g) store.setGroupId(g);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const group = GROUPS.find((g) => g.id === store.groupId) ?? GROUPS[0];

  const allMembers = useMemo<User[]>(() => {
    const groupIds = new Set(group.members.map((m) => m.user.id));
    const contactUsers: User[] = storedContacts
      .filter((c) => !groupIds.has(c.id))
      .map((c) => ({ id: c.id, name: c.name, avatarUrl: c.avatarDataUrl ?? undefined }));
    const allIds = new Set([...groupIds, ...contactUsers.map((c) => c.id)]);
    return [
      ...group.members.map((m) => m.user),
      ...contactUsers,
      ...extraMembers.filter((e) => !allIds.has(e.id)),
    ];
  }, [group, extraMembers, storedContacts]);

  const participants = useMemo(
    () => (store.participantIds.length > 0 ? store.participantIds : allMembers.map((m) => m.id)),
    [store.participantIds, allMembers]
  );

  useEffect(() => {
    if (store.splitType !== "PERCENTAGE") return;
    const n = participants.length;
    if (n === 0) return;
    const base = Math.floor(100 / n);
    const rem = 100 - base * n;
    participants.forEach((id, i) => store.setPercentage(id, i === 0 ? base + rem : base));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.splitType]);

  const shares: SplitShare[] = useMemo(() => {
    if (!store.amount) return [];
    try {
      switch (store.splitType) {
        case "EQUAL":
          return splitEqual(store.amount, participants);
        case "UNEQUAL":
          return splitUnequal(
            store.amount,
            participants.map((id) => ({ userId: id, amountOwed: store.unequalAmounts[id] ?? 0 }))
          );
        case "PERCENTAGE":
          return splitByPercentage(
            store.amount,
            participants.map((id) => ({ userId: id, percentage: store.percentages[id] ?? 0 }))
          );
        case "SHARES":
          return splitByShares(
            store.amount,
            participants.map((id) => ({ userId: id, shares: store.shares[id] ?? 1 }))
          );
      }
    } catch {
      return [];
    }
  }, [store.amount, store.splitType, store.unequalAmounts, store.percentages, store.shares, participants]);

  // Running-total helpers for UNEQUAL and PERCENTAGE
  const unequalSum = useMemo(
    () => participants.reduce((acc, id) => acc + (store.unequalAmounts[id] ?? 0), 0),
    [participants, store.unequalAmounts]
  );
  const percentageSum = useMemo(
    () => participants.reduce((acc, id) => acc + (store.percentages[id] ?? 0), 0),
    [participants, store.percentages]
  );

  const splitValid = useMemo(() => {
    if (store.splitType === "UNEQUAL") return Math.abs(unequalSum - (store.amount ?? 0)) < 0.01;
    if (store.splitType === "PERCENTAGE") return Math.abs(percentageSum - 100) < 0.01;
    return true;
  }, [store.splitType, store.amount, unequalSum, percentageSum]);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    setDisplayAmount(fmtDisplay(raw));
    store.setAmount(parseFloat(raw.replace(/,/g, "")) || 0);
  }

  function resetNewPersonForm() {
    setNewName(""); setNewPhone(""); setNewEmail("");
    setNewUpi(""); setNewPhonePe(""); setNewGooglePay(""); setNewPaytm("");
  }

  function handleAddPayer() {
    if (!newName.trim()) return;
    const id = `ext_${Date.now()}`;
    addContact({
      name: newName.trim(), phone: newPhone.trim(), email: newEmail.trim(),
      upiId: newUpi.trim(), phonePe: newPhonePe.trim(), googlePay: newGooglePay.trim(),
      paytm: newPaytm.trim(), avatarDataUrl: null,
    });
    setExtraMembers((prev) => [...prev, { id, name: newName.trim() }]);
    store.setPaidBy(id);
    setShowAddPayer(false);
    resetNewPersonForm();
    toast(`${newName.trim()} added to Members`);
  }

  function handleSubmit() {
    addStoredExpense({
      id: `e_${Date.now()}`,
      groupId: group.id,
      paidById: store.paidById ?? allMembers[0].id,
      amount: store.amount ?? 0,
      description: store.description || "Untitled",
      splitType: store.splitType,
      category: store.category,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      splits: shares.map((s, i) => ({
        id: `s_${Date.now()}_${i}`,
        userId: s.userId,
        amountOwed: s.amountOwed,
        settled: s.userId === store.paidById,
      })),
    });
    toast(`Expense added · ${formatCurrency(store.amount ?? 0)} split among ${participants.length}`);
    store.reset();
    router.push("/dashboard");
  }

  function memberName(id: string): string {
    return allMembers.find((m) => m.id === id)?.name ?? userById(id).name;
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="space-y-4">
        <button
          onClick={() => (store.step === "amount" ? router.back() : store.back())}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <StepProgress current={store.step} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={store.step}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* ── Amount ── */}
          {store.step === "amount" && (
            <div className="space-y-6 text-center">
              <h1 className="text-lg font-semibold">How much was it?</h1>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-semibold text-muted-foreground">₹</span>
                <input
                  autoFocus
                  inputMode="decimal"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="min-w-0 max-w-64 border-none bg-transparent text-center text-5xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              {store.amount && store.amount > 0 ? (
                <p className="text-sm text-muted-foreground capitalize">
                  {numberToWords(store.amount)}
                </p>
              ) : (
                <p className="h-5" />
              )}
              <Button
                size="lg"
                variant="accent"
                className="w-full"
                disabled={!store.amount || store.amount <= 0}
                onClick={store.next}
              >
                Continue
              </Button>
            </div>
          )}

          {/* ── Payer ── */}
          {store.step === "payer" && (
            <div className="space-y-4">
              <h1 className="text-lg font-semibold">Who paid?</h1>
              <div className="space-y-2">
                {allMembers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => store.setPaidBy(user.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                      store.paidById === user.id
                        ? "border-accent bg-accent-soft"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <Avatar name={user.name} src={user.avatarUrl} />
                    <span className="text-sm font-medium">{user.name}</span>
                    {store.paidById === user.id && (
                      <Check className="ml-auto h-4 w-4 text-accent" />
                    )}
                  </button>
                ))}

                {!showAddPayer && (
                  <button
                    onClick={() => setShowAddPayer(true)}
                    className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-border p-3 text-sm text-muted-foreground transition-colors hover:border-accent/50 hover:text-accent"
                  >
                    <UserPlus className="h-4 w-4" />
                    Someone else paid
                  </button>
                )}

                <AnimatePresence>
                  {showAddPayer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2.5 rounded-2xl border border-accent/30 bg-accent-soft p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-accent">New person</p>
                          <button onClick={() => { setShowAddPayer(false); resetNewPersonForm(); }}>
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Required */}
                        <Input
                          autoFocus
                          placeholder="Full name *"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                        />

                        {/* Contact details */}
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Phone"
                            inputMode="numeric"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                          />
                          <Input
                            placeholder="Email"
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                        </div>

                        {/* Payment UPIs */}
                        <p className="pt-0.5 text-[11px] font-medium uppercase tracking-wide text-accent/70">
                          Payment methods
                        </p>
                        <Input
                          placeholder="UPI ID (e.g. name@upi)"
                          value={newUpi}
                          onChange={(e) => setNewUpi(e.target.value)}
                        />
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <Input
                            placeholder="PhonePe"
                            value={newPhonePe}
                            onChange={(e) => setNewPhonePe(e.target.value)}
                          />
                          <Input
                            placeholder="Google Pay"
                            value={newGooglePay}
                            onChange={(e) => setNewGooglePay(e.target.value)}
                          />
                          <Input
                            placeholder="Paytm"
                            value={newPaytm}
                            onChange={(e) => setNewPaytm(e.target.value)}
                          />
                        </div>

                        <Button
                          size="sm"
                          variant="accent"
                          className="w-full"
                          disabled={!newName.trim()}
                          onClick={handleAddPayer}
                        >
                          <UserPlus className="h-4 w-4" />
                          Add & select
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button
                size="lg"
                variant="accent"
                className="w-full"
                disabled={!store.paidById}
                onClick={store.next}
              >
                Continue
              </Button>
            </div>
          )}

          {/* ── Split ── */}
          {store.step === "split" && (
            <div className="space-y-5">
              <h1 className="text-lg font-semibold">How should it split?</h1>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(SPLIT_TYPE_LABELS) as SplitType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => store.setSplitType(type)}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-xs font-medium transition-colors",
                      store.splitType === type
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {SPLIT_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {allMembers.map((user) => {
                  const included = participants.includes(user.id);
                  const share = shares.find((s) => s.userId === user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <button
                        onClick={() => store.toggleParticipant(user.id)}
                        className="flex flex-1 min-w-0 items-center gap-2"
                      >
                        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                        <span className={cn("truncate text-sm", !included && "text-muted-foreground line-through")}>
                          {user.name}
                        </span>
                      </button>

                      <div className="ml-auto flex shrink-0 items-center gap-2">
                        {included && store.splitType === "UNEQUAL" && (
                          <input
                            inputMode="decimal"
                            className={cn(
                              "h-8 w-20 sm:w-28 rounded-lg border bg-surface px-2 text-right text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring",
                              unequalSum > (store.amount ?? 0) && lastChangedUnequalId === user.id
                                ? "border-destructive focus:ring-destructive/40"
                                : "border-input"
                            )}
                            placeholder="0"
                            value={store.unequalAmounts[user.id] || ""}
                            onChange={(e) => {
                              setLastChangedUnequalId(user.id);
                              store.setUnequalAmount(user.id, parseFloat(e.target.value) || 0);
                            }}
                          />
                        )}
                        {included && store.splitType === "PERCENTAGE" && (
                          <div className="flex items-center gap-1">
                            <input
                              inputMode="decimal"
                              className="h-8 w-14 rounded-lg border border-input bg-surface px-2 text-right text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
                              placeholder="0"
                              value={store.percentages[user.id] ?? ""}
                              onChange={(e) =>
                                store.setPercentage(user.id, parseFloat(e.target.value) || 0)
                              }
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        )}
                        {included && store.splitType === "SHARES" && (
                          <input
                            inputMode="decimal"
                            className="h-8 w-12 rounded-lg border border-input bg-surface px-2 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring"
                            placeholder="1"
                            value={store.shares[user.id] ?? ""}
                            onChange={(e) =>
                              store.setShare(user.id, parseFloat(e.target.value) || 1)
                            }
                          />
                        )}
                        {included && (
                          <span className="w-16 sm:w-24 text-right text-sm font-semibold tabular-nums">
                            {share ? formatCurrency(share.amountOwed) : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Running total for UNEQUAL ── */}
              {store.splitType === "UNEQUAL" && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors",
                    splitValid
                      ? "border-positive/30 bg-positive/10 text-positive"
                      : unequalSum > (store.amount ?? 0)
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {splitValid ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : unequalSum > (store.amount ?? 0) ? (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 opacity-50" />
                  )}
                  <span className="flex-1 tabular-nums">
                    {formatCurrency(unequalSum)} of {formatCurrency(store.amount ?? 0)} allocated
                  </span>
                  {!splitValid && (
                    <span className="tabular-nums font-semibold">
                      {unequalSum > (store.amount ?? 0)
                        ? `over by ${formatCurrency(unequalSum - (store.amount ?? 0))}`
                        : `${formatCurrency((store.amount ?? 0) - unequalSum)} left`}
                    </span>
                  )}
                </div>
              )}

              {/* ── Running total for PERCENTAGE ── */}
              {store.splitType === "PERCENTAGE" && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors",
                    splitValid
                      ? "border-positive/30 bg-positive/10 text-positive"
                      : percentageSum > 100
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {splitValid ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 opacity-50" />
                  )}
                  <span className="flex-1 tabular-nums">
                    {percentageSum.toFixed(1)}% of 100% allocated
                  </span>
                  {!splitValid && (
                    <span className="tabular-nums font-semibold">
                      {percentageSum > 100
                        ? `over by ${(percentageSum - 100).toFixed(1)}%`
                        : `${(100 - percentageSum).toFixed(1)}% left`}
                    </span>
                  )}
                </div>
              )}

              <Button
                size="lg"
                variant="accent"
                className="w-full"
                disabled={!splitValid}
                onClick={store.next}
              >
                Continue
              </Button>
            </div>
          )}

          {/* ── Details ── */}
          {store.step === "details" && (
            <div className="space-y-5">
              <h1 className="text-lg font-semibold">Add a few details</h1>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  autoFocus
                  placeholder="Dinner at Thalassa"
                  value={store.description}
                  onChange={(e) => store.setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => store.setCategory(cat)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        store.category === cat
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                size="lg"
                variant="accent"
                className="w-full"
                disabled={!store.description.trim()}
                onClick={store.next}
              >
                Continue
              </Button>
            </div>
          )}

          {/* ── Confirm ── */}
          {store.step === "confirm" && (
            <div className="space-y-5">
              <h1 className="text-lg font-semibold">Review & confirm</h1>
              <Card className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{store.description || "Untitled expense"}</p>
                    <p className="text-xs text-muted-foreground">
                      {store.category ?? "Uncategorized"} · {group.name}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-semibold tabular-nums">
                    {formatCurrency(store.amount ?? 0)}
                  </p>
                </div>
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Paid by {store.paidById ? memberName(store.paidById) : "—"}
                  </p>
                  {shares.map((s) => (
                    <div key={s.userId} className="flex items-center justify-between text-sm">
                      <span>{memberName(s.userId)}</span>
                      <span className="tabular-nums font-medium">
                        {formatCurrency(s.amountOwed)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
              <Button size="lg" variant="accent" className="w-full" onClick={handleSubmit}>
                Add expense
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
