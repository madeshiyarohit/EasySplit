"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Copy, HandCoins, Pencil, Plus, Receipt, Search, Trash2, UserPlus, Users, X } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { SettleUpDialog } from "@/components/group/settle-up-dialog";
import { CURRENT_USER, USERS, userById } from "@/lib/mock-data";
import { getContacts, addContact, type StoredContact } from "@/lib/contacts-store";
import { getStoredExpenses } from "@/lib/expenses-store";
import { updateStoredGroup, deleteStoredGroup } from "@/lib/groups-store";
import { useToast } from "@/lib/toast";
import { simplifyDebts } from "@/lib/split/simplifyDebts";
import type { Expense, Group } from "@/lib/types";
import { computeGroupBalances } from "@/lib/mock-data";
import { categoryColor, categoryIcon, cn, formatCurrency, relativeTime } from "@/lib/utils";

function isUserGroup(group: Group) {
  return group.id.startsWith("g_");
}

type MemberEntry =
  | { kind: "mock"; id: string; name: string; avatarUrl?: string | null }
  | { kind: "contact"; id: string; name: string; phone: string; email: string; avatarUrl?: string | null };

function AddMemberDialog({
  group,
  onClose,
  onAdd,
}: {
  group: Group;
  onClose: () => void;
  onAdd: (name: string) => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhonePe, setNewPhonePe] = useState("");
  const [newGooglePay, setNewGooglePay] = useState("");
  const [newPaytm, setNewPaytm] = useState("");
  const [contacts, setContacts] = useState<StoredContact[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  useEffect(() => { setContacts(getContacts()); }, []);

  const existingIds = new Set(group.members.map((m) => m.user.id));

  const allMembers: MemberEntry[] = [
    ...USERS.filter((u) => u.id !== CURRENT_USER.id && !existingIds.has(u.id)).map((u) => ({
      kind: "mock" as const,
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
    })),
    ...contacts
      .filter((c) => !existingIds.has(c.id))
      .map((c) => ({
        kind: "contact" as const,
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        avatarUrl: c.avatarDataUrl,
      })),
  ];

  const filtered = search.trim()
    ? allMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          (m.kind === "contact" &&
            (m.phone.includes(search) || m.email.toLowerCase().includes(search.toLowerCase())))
      )
    : allMembers;

  const noResults = search.trim().length > 0 && filtered.length === 0;

  function handleAdd(member: MemberEntry) {
    if (addedIds.includes(member.id)) return;
    setAddedIds((prev) => [...prev, member.id]);
    onAdd(member.name);
    toast(`${member.name} added to group`);
  }

  function handleAddNewMember() {
    if (!newName.trim()) return;
    const contact = addContact({ name: newName.trim(), phone: newPhone.trim(), email: newEmail.trim(), upiId: "", avatarDataUrl: null, phonePe: newPhonePe.trim(), googlePay: newGooglePay.trim(), paytm: newPaytm.trim() });
    setContacts((prev) => [...prev, contact]);
    setAddedIds((prev) => [...prev, contact.id]);
    onAdd(contact.name);
    toast(`${contact.name} added`);
    setShowAddForm(false);
    setNewName(""); setNewPhone(""); setNewEmail(""); setNewPhonePe(""); setNewGooglePay(""); setNewPaytm(""); setSearch("");
  }

  return (
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
        className="glass w-full max-w-md rounded-t-3xl border border-border bg-surface/95 p-6 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add member</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Search */}
          <div className="flex h-10 items-center gap-2 rounded-xl border border-input bg-surface px-3 focus-within:ring-2 focus-within:ring-ring transition-shadow">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Search by name, phone or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowAddForm(false); }}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Member list */}
          <div className="max-h-52 space-y-1.5 overflow-y-auto">
            {filtered.map((member) => {
              const added = addedIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  onClick={() => handleAdd(member)}
                  disabled={added}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                    added ? "border-accent bg-accent-soft opacity-70" : "border-border hover:bg-muted"
                  )}
                >
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <Avatar name={member.name} size="sm" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{member.name}</p>
                    {member.kind === "contact" && (member.phone || member.email) && (
                      <p className="truncate text-xs text-muted-foreground">{member.phone || member.email}</p>
                    )}
                  </div>
                  <span className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors",
                    added ? "border-accent bg-accent text-accent-foreground" : "border-border"
                  )}>
                    {added && <Check className="h-3 w-3" />}
                  </span>
                </button>
              );
            })}

            {noResults && !showAddForm && (
              <button
                onClick={() => { setShowAddForm(true); setNewName(search); }}
                className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-accent/50 bg-accent-soft p-2.5 text-sm text-accent hover:bg-accent/10"
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                Add &ldquo;{search}&rdquo; as a new member
              </button>
            )}
          </div>

          {/* Add someone new button */}
          {!search && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border p-2.5 text-sm text-muted-foreground hover:border-accent/50 hover:text-accent transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Add someone new
            </button>
          )}

          {/* Inline add form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2.5 rounded-2xl border border-accent/30 bg-accent-soft p-4">
                  <p className="text-xs font-semibold text-accent">New member</p>
                  <Input placeholder="Full name *" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                  <Input placeholder="Phone number (optional)" inputMode="numeric" maxLength={10} value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))} />
                  <Input placeholder="Email (optional)" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  <Input placeholder="PhonePe UPI (optional)" value={newPhonePe} onChange={(e) => setNewPhonePe(e.target.value)} />
                  <Input placeholder="Google Pay UPI (optional)" value={newGooglePay} onChange={(e) => setNewGooglePay(e.target.value)} />
                  <Input placeholder="Paytm UPI (optional)" value={newPaytm} onChange={(e) => setNewPaytm(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="accent" className="flex-1" disabled={!newName.trim()} onClick={handleAddNewMember}>
                      <UserPlus className="h-4 w-4" />
                      Add member
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setShowAddForm(false); setNewName(""); setNewPhone(""); setNewEmail(""); setNewPhonePe(""); setNewGooglePay(""); setNewPaytm(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {addedIds.length > 0 && (
            <p className="text-xs text-positive">
              <Users className="mr-1 inline h-3 w-3" />
              {addedIds.length} member{addedIds.length !== 1 ? "s" : ""} added to {group.name}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GroupDetail({
  group: initialGroup,
  expenses: serverExpenses,
  balances: serverBalances,
}: {
  group: Group;
  expenses: Expense[];
  balances: Record<string, number>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [group, setGroup] = useState(initialGroup);
  const [settleOpen, setSettleOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addedNames, setAddedNames] = useState<string[]>([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);

  // Edit / delete state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleSaveEdit() {
    if (!editName.trim()) return;
    updateStoredGroup(group.id, { name: editName.trim() });
    setGroup((g) => ({ ...g, name: editName.trim() }));
    toast("Group renamed");
    setEditOpen(false);
  }

  function handleConfirmDelete() {
    deleteStoredGroup(group.id);
    toast("Group deleted");
    router.push("/groups");
  }

  useEffect(() => { setLocalExpenses(getStoredExpenses()); }, []);

  const expenses = useMemo(
    () => [...serverExpenses, ...localExpenses].filter((e) => e.groupId === group.id && !e.isDeleted),
    [serverExpenses, localExpenses, group.id]
  );
  const balances = useMemo(
    () => localExpenses.length > 0 ? computeGroupBalances(group.id, [...serverExpenses, ...localExpenses]) : serverBalances,
    [serverExpenses, serverBalances, localExpenses, group.id]
  );
  const settlements = useMemo(() => simplifyDebts(balances), [balances]);

  const byDate = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    for (const expense of [...expenses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )) {
      const key = new Date(expense.createdAt).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      groups.set(key, [...(groups.get(key) ?? []), expense]);
    }
    return groups;
  }, [expenses]);

  function copyInviteCode() {
    navigator.clipboard.writeText(group.inviteCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  const myNet = balances[CURRENT_USER.id] ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All groups
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
              {isUserGroup(group) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditName(group.name); setEditOpen(true); }}
                    aria-label="Rename group"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteOpen(true)}
                    aria-label="Delete group"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <AvatarStack people={group.members.map((m) => m.user)} max={6} />
              <span className="text-sm text-muted-foreground">
                {group.members.length} members
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAddMemberOpen(true)}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add member</span>
            </Button>
            <Link href={`/expenses/new?group=${group.id}`}>
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add expense</span>
              </Button>
            </Link>
            <Button variant="accent" size="sm" onClick={() => setSettleOpen(true)}>
              <HandCoins className="h-4 w-4" />
              <span className="hidden sm:inline">Settle up</span>
            </Button>
          </div>
        </div>
      </div>

      {/* My net banner */}
      {myNet !== 0 && (
        <div
          className={`rounded-2xl px-5 py-4 text-sm font-medium ${
            myNet > 0
              ? "bg-positive/10 text-positive"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {myNet > 0
            ? `You are owed ${formatCurrency(myNet)} in this group`
            : `You owe ${formatCurrency(-myNet)} in this group`}
        </div>
      )}

      {/* Member balances */}
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {group.members.map(({ user }) => {
            const net = balances[user.id] ?? 0;
            return (
              <div key={user.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                  <span className="text-sm font-medium">
                    {user.id === CURRENT_USER.id ? "You" : user.name}
                  </span>
                </div>
                <span
                  className={
                    net === 0
                      ? "text-sm text-muted-foreground"
                      : net > 0
                        ? "text-sm font-semibold tabular-nums text-positive"
                        : "text-sm font-semibold tabular-nums text-destructive"
                  }
                >
                  {net === 0
                    ? "settled up"
                    : net > 0
                      ? `gets back ${formatCurrency(net)}`
                      : `owes ${formatCurrency(-net)}`}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Expenses list */}
      <div className="space-y-5">
        <h2 className="text-lg font-semibold tracking-tight">Expenses</h2>
        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Add the group's first expense to start tracking who owes what."
            action={
              <Link href="/expenses/new">
                <Button variant="accent">
                  <Plus className="h-4 w-4" />
                  Add expense
                </Button>
              </Link>
            }
          />
        ) : (
          Array.from(byDate.entries()).map(([date, dateExpenses]) => (
            <div key={date} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {date}
              </p>
              <Card className="divide-y divide-border overflow-hidden">
                {dateExpenses.map((expense) => {
                  const payer = userById(expense.paidById);
                  const isMe = expense.paidById === CURRENT_USER.id;
                  const myShare = expense.splits.find((s) => s.userId === CURRENT_USER.id);
                  return (
                    <div key={expense.id} className="flex items-center gap-4 p-4">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${categoryColor(expense.category)}`}
                      >
                        {categoryIcon(expense.category)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{expense.description}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {isMe ? "You" : payer.name} paid · {relativeTime(expense.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatCurrency(expense.amount)}
                        </p>
                        {myShare && !isMe && (
                          <p className="mt-0.5 text-xs text-destructive tabular-nums">
                            your share {formatCurrency(myShare.amountOwed)}
                          </p>
                        )}
                        {isMe && (
                          <p className="mt-0.5 text-xs text-positive tabular-nums">you paid</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Invite code */}
      <div className="rounded-2xl border border-dashed border-border p-5">
        <p className="text-sm font-medium">Invite to group</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Share this code so others can join.
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-2.5">
          <span className="font-mono text-sm font-semibold tracking-widest">
            {group.inviteCode.toUpperCase()}
          </span>
          <button
            onClick={copyInviteCode}
            className="flex items-center gap-1 text-xs font-medium text-accent hover:opacity-80"
          >
            {codeCopied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {settleOpen && (
        <SettleUpDialog
          groupName={group.name}
          settlements={settlements}
          onClose={() => setSettleOpen(false)}
        />
      )}

      <AnimatePresence>
        {addMemberOpen && (
          <AddMemberDialog
            group={group}
            onClose={() => setAddMemberOpen(false)}
            onAdd={(name) => setAddedNames((prev) => [...prev, name])}
          />
        )}
      </AnimatePresence>

      {addedNames.length > 0 && (
        <div className="rounded-2xl border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive">
          <Users className="mr-1.5 inline h-4 w-4" />
          Added: {addedNames.join(", ")}
        </div>
      )}

      {/* ── Edit (rename) dialog ── */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            key="edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setEditOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface/95 p-6 shadow-xl backdrop-blur-xl"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                <Pencil className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-lg font-semibold">Rename group</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the name for <span className="font-medium text-foreground">{group.name}</span>.
              </p>
              <div className="mt-5 space-y-1.5">
                <Label htmlFor="detail-edit-name">Group name</Label>
                <Input
                  id="detail-edit-name"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); }}
                  placeholder="e.g. Goa Trip 2025"
                />
              </div>
              <div className="mt-6 flex gap-2.5">
                <Button variant="secondary" className="flex-1" size="sm" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  className="flex-1"
                  size="sm"
                  disabled={!editName.trim() || editName.trim() === group.name}
                  onClick={handleSaveEdit}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirmation ── */}
      <AnimatePresence>
        {deleteOpen && (
          <motion.div
            key="delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setDeleteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-border bg-surface/95 p-6 shadow-xl backdrop-blur-xl"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">Delete group?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{group.name}</span> will be permanently removed. Expenses in this group will still appear in Analytics.
              </p>
              <div className="mt-6 flex gap-2.5">
                <Button variant="secondary" className="flex-1" size="sm" onClick={() => setDeleteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" size="sm" onClick={handleConfirmDelete}>
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
