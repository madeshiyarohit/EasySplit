"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { CountUp } from "@/components/ui/count-up";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Input, Label } from "@/components/ui/input";
import { CreateGroupDialog } from "@/components/group/create-group-dialog";
import { useToast } from "@/lib/toast";
import {
  addContact,
  getContacts,
  type StoredContact,
} from "@/lib/contacts-store";
import { getMemberOverride } from "@/lib/member-overrides-store";
import { getHiddenMemberIds } from "@/lib/hidden-members-store";
import { getStoredExpenses } from "@/lib/expenses-store";
import { getStoredGroups } from "@/lib/groups-store";
import { getGoogleUser } from "@/lib/google-user";
import { getStoredProfile } from "@/lib/profile-store";
import {
  CURRENT_USER,
  EXPENSES,
  GROUPS,
  USERS,
  computeGroupBalances,
  computePersonalBalances,
  computeUserNet,
  userById,
} from "@/lib/mock-data";
import type { Expense, Group, User } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const MAX_VISIBLE = 6;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function CopyTag({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
    >
      {copied ? (
        <Check className="h-3 w-3 shrink-0 text-positive" />
      ) : (
        <Copy className="h-3 w-3 shrink-0" />
      )}
      <span className="max-w-[120px] truncate">
        {copied ? "Copied!" : `${label}: ${value}`}
      </span>
    </button>
  );
}

function QuickAddMemberDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addContact({
      name: name.trim(),
      phone,
      email,
      upiId: "",
      phonePe: "",
      googlePay: "",
      paytm: "",
      avatarDataUrl: null,
    });
    onAdded(name.trim());
    setName("");
    setPhone("");
    setEmail("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface/95 p-6 glass">
        <h2 className="text-lg font-semibold tracking-tight mb-4">
          Add member
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qam-name">Name *</Label>
            <Input
              id="qam-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qam-phone">Phone</Label>
            <Input
              id="qam-phone"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qam-email">Email</Label>
            <Input
              id="qam-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              className="flex-1"
              disabled={!name.trim()}
            >
              Add member
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const { toast } = useToast();
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
  const [storedGroups, setStoredGroups] = useState<Group[]>([]);
  const [storedContacts, setStoredContacts] = useState<StoredContact[]>([]);
  const [hiddenMemberIds, setHiddenMemberIds] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState(CURRENT_USER.name);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [showAllPeople, setShowAllPeople] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocalExpenses(getStoredExpenses());
    setStoredGroups(getStoredGroups());
    setStoredContacts(getContacts());
    setHiddenMemberIds(getHiddenMemberIds());
    const googleUser = getGoogleUser();
    const profile = getStoredProfile();
    const name = googleUser?.name ?? profile?.name ?? CURRENT_USER.name;
    setDisplayName(name);
    setMounted(true);
  }, []);

  const allExpenses = useMemo(
    () => [...EXPENSES, ...localExpenses],
    [localExpenses],
  );
  const allGroups = useMemo(() => [...GROUPS, ...storedGroups], [storedGroups]);

  const { owedToYou, youOwe } = useMemo(
    () => computeUserNet(CURRENT_USER.id, allExpenses),
    [allExpenses],
  );
  const net = owedToYou - youOwe;

  const personalBalances = useMemo(
    () => computePersonalBalances(CURRENT_USER.id, allExpenses),
    [allExpenses],
  );

  // Resolve contact names for balance entries that come back as "Unknown"
  const resolvedBalances = useMemo(
    () =>
      personalBalances.map(({ user, net: pNet }) => {
        if (user.name !== "Unknown") return { user, net: pNet };
        const contact = storedContacts.find((c) => c.id === user.id);
        return {
          user: contact ? { ...user, name: contact.name } : user,
          net: pNet,
        };
      }),
    [personalBalances, storedContacts],
  );

  // Contact info lookup for copy tags
  function getUserContactInfo(userId: string): {
    phone: string;
    email: string;
    upiId: string;
  } {
    const contact = storedContacts.find((c) => c.id === userId);
    if (contact)
      return {
        phone: contact.phone,
        email: contact.email,
        upiId: contact.upiId,
      };
    const override = getMemberOverride(userId);
    const mockUser = USERS.find((u) => u.id === userId);
    return {
      phone: override.phone,
      email: override.email,
      upiId: override.upiId || mockUser?.upiId || "",
    };
  }

  // All unique participants in any expense (excluding current user, hidden members, deleted contacts)
  const allParticipants = useMemo<User[]>(() => {
    const seen = new Set<string>();
    const people: User[] = [];
    for (const expense of allExpenses.filter((e) => !e.isDeleted)) {
      const ids = [expense.paidById, ...expense.splits.map((s) => s.userId)];
      for (const id of ids) {
        if (id === CURRENT_USER.id || seen.has(id)) continue;
        seen.add(id);
        if (hiddenMemberIds.includes(id)) continue;
        const mockUser = USERS.find((u) => u.id === id);
        if (mockUser) {
          people.push(mockUser);
          continue;
        }
        const contact = storedContacts.find((c) => c.id === id);
        if (contact) {
          people.push({
            id: contact.id,
            name: contact.name,
            avatarUrl: contact.avatarDataUrl,
          });
        }
        // skip unknown/deleted contacts silently
      }
    }
    return people;
  }, [allExpenses, storedContacts, hiddenMemberIds]);

  const visiblePeople = showAllPeople
    ? allParticipants
    : allParticipants.slice(0, MAX_VISIBLE);
  const visibleGroups = showAllGroups
    ? allGroups
    : allGroups.slice(0, MAX_VISIBLE);
  const firstName = displayName.split(" ")[0];

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {firstName} !
        </h1>
      </section>

      {/* Net balance hero */}
      <section>
        <Card
          className={
            net >= 0
              ? "bg-gradient-to-br from-positive/10 via-positive/5 to-transparent"
              : "bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent"
          }
        >
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">
              {net === 0
                ? "All settled up"
                : net > 0
                  ? "You're owed overall"
                  : "You owe overall"}
            </p>
            <CountUp
              value={Math.abs(net)}
              className={`mt-1 block text-5xl font-semibold tracking-tight tabular-nums ${
                net >= 0 ? "text-positive" : "text-destructive"
              }`}
            />
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ArrowDownRight className="h-4 w-4 shrink-0 text-positive" />
                <span>Owed to you</span>
                <span className="font-semibold tabular-nums text-positive">
                  {formatCurrency(owedToYou)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ArrowUpRight className="h-4 w-4 shrink-0 text-destructive" />
                <span>You owe</span>
                <span className="font-semibold tabular-nums text-destructive">
                  {formatCurrency(youOwe)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Individual balances */}
      {resolvedBalances.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Balances</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {resolvedBalances.map(({ user, net: pNet }) => {
              const { phone, email, upiId } = getUserContactInfo(user.id);
              return (
                <div
                  key={user.id}
                  className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size="sm" />
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold tabular-nums ${pNet > 0 ? "text-positive" : "text-destructive"}`}
                      >
                        {formatCurrency(Math.abs(pNet))}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {pNet > 0 ? "owes you" : "you owe"}
                      </p>
                    </div>
                  </div>
                  {mounted && (phone || email || upiId) && (
                    <div className="flex flex-wrap gap-1.5">
                      <CopyTag label="Phone" value={phone} />
                      <CopyTag label="Email" value={email} />
                      <CopyTag label="UPI" value={upiId} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* People with transactions */}
      {allParticipants.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">People</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {visiblePeople.map((person) => {
                const bal = resolvedBalances.find(
                  (b) => b.user.id === person.id,
                );
                return (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
                  >
                    <Avatar name={person.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {person.name}
                      </p>
                      {bal ? (
                        <p
                          className={`text-xs ${bal.net > 0 ? "text-positive" : "text-destructive"}`}
                        >
                          {bal.net > 0
                            ? `Owes you ${formatCurrency(bal.net)}`
                            : `You owe ${formatCurrency(Math.abs(bal.net))}`}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Settled up
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {allParticipants.length > MAX_VISIBLE && (
            <button
              onClick={() => setShowAllPeople((p) => !p)}
              className="flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              {showAllPeople ? (
                <>
                  <ChevronUp className="h-4 w-4" /> See less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" /> See{" "}
                  {allParticipants.length - MAX_VISIBLE} more
                </>
              )}
            </button>
          )}
        </section>
      )}

      {/* Groups */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your groups</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAddMemberOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add member</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New group</span>
            </Button>
          </div>
        </div>

        {allGroups.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No groups yet"
            description="Create a group to start splitting expenses with friends, family, or flatmates."
            action={
              <Button variant="accent" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create your first group
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence initial={false}>
                {visibleGroups.map((group) => {
                  const balances = computeGroupBalances(group.id, allExpenses);
                  const gNet = balances[CURRENT_USER.id] ?? 0;
                  const expenseCount = allExpenses.filter(
                    (e) => e.groupId === group.id && !e.isDeleted,
                  ).length;
                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Link href={`/groups/${group.id}`}>
                        <Card hoverable className="h-full cursor-pointer">
                          <CardContent className="flex h-full flex-col justify-between gap-5 p-5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {group.name}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {group.members.length} members ·{" "}
                                  {expenseCount} expenses
                                </p>
                              </div>
                              <AvatarStack
                                people={group.members.map((m) => m.user)}
                                max={3}
                              />
                            </div>
                            <div className="text-sm">
                              {gNet === 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                  Settled up
                                </span>
                              )}
                              {gNet > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-2.5 py-1 text-xs font-semibold text-positive">
                                  <ArrowDownRight className="h-3 w-3" />
                                  Owed {formatCurrency(gNet)}
                                </span>
                              )}
                              {gNet < 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                                  <ArrowUpRight className="h-3 w-3" />
                                  Owe {formatCurrency(-gNet)}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {allGroups.length > MAX_VISIBLE && (
              <button
                onClick={() => setShowAllGroups((p) => !p)}
                className="flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                {showAllGroups ? (
                  <>
                    <ChevronUp className="h-4 w-4" /> See less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" /> See{" "}
                    {allGroups.length - MAX_VISIBLE} more groups
                  </>
                )}
              </button>
            )}
          </>
        )}
      </section>

      {/* Activity */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Recent activity
        </h2>
        <ActivityFeed expenses={allExpenses} />
      </section>

      <CreateGroupDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group) => setStoredGroups((prev) => [...prev, group])}
      />
      <QuickAddMemberDialog
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onAdded={(name) => toast(`${name} added as a member`)}
      />
    </div>
  );
}
