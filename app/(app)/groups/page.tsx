"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp,
  Pencil, Plus, Trash2, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AvatarStack } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateGroupDialog } from "@/components/group/create-group-dialog";
import {
  getStoredGroups,
  updateStoredGroup,
  deleteStoredGroup,
} from "@/lib/groups-store";
import { getStoredExpenses } from "@/lib/expenses-store";
import {
  CURRENT_USER, EXPENSES, GROUPS, computeGroupBalances,
} from "@/lib/mock-data";
import type { Expense, Group } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const MAX_VISIBLE = 6;

// User-created groups have IDs starting with "g_"
function isUserGroup(group: Group) {
  return group.id.startsWith("g_");
}

export default function GroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [storedGroups, setStoredGroups] = useState<Group[]>([]);
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Edit state
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState("");

  // Delete state
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);

  useEffect(() => {
    setStoredGroups(getStoredGroups());
    setLocalExpenses(getStoredExpenses());
  }, []);

  const allGroups = useMemo(() => [...GROUPS, ...storedGroups], [storedGroups]);
  const allExpenses = useMemo(() => [...EXPENSES, ...localExpenses], [localExpenses]);
  const visibleGroups = showAll ? allGroups : allGroups.slice(0, MAX_VISIBLE);

  function openEdit(group: Group, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditName(group.name);
    setEditGroup(group);
  }

  function openDelete(group: Group, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteGroup(group);
  }

  function handleSaveEdit() {
    if (!editGroup || !editName.trim()) return;
    updateStoredGroup(editGroup.id, { name: editName.trim() });
    setStoredGroups((prev) =>
      prev.map((g) => (g.id === editGroup.id ? { ...g, name: editName.trim() } : g))
    );
    setEditGroup(null);
  }

  function handleConfirmDelete() {
    if (!deleteGroup) return;
    deleteStoredGroup(deleteGroup.id);
    setStoredGroups((prev) => prev.filter((g) => g.id !== deleteGroup.id));
    setDeleteGroup(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {allGroups.length} group{allGroups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="accent" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New group</span>
        </Button>
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
                const net = balances[CURRENT_USER.id] ?? 0;
                const expenseCount = allExpenses.filter(
                  (e) => e.groupId === group.id && !e.isDeleted
                ).length;
                const editable = isUserGroup(group);
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
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold">{group.name}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {group.members.length} members · {expenseCount} expenses
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              {editable && (
                                <>
                                  <button
                                    onClick={(e) => openEdit(group, e)}
                                    aria-label={`Edit ${group.name}`}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => openDelete(group, e)}
                                    aria-label={`Delete ${group.name}`}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              <AvatarStack people={group.members.map((m) => m.user)} max={3} />
                            </div>
                          </div>
                          <div className="text-sm">
                            {net === 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                Settled up
                              </span>
                            )}
                            {net > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-2.5 py-1 text-xs font-semibold text-positive">
                                <ArrowDownRight className="h-3 w-3" />
                                Owed {formatCurrency(net)}
                              </span>
                            )}
                            {net < 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                                <ArrowUpRight className="h-3 w-3" />
                                Owe {formatCurrency(-net)}
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
              onClick={() => setShowAll((p) => !p)}
              className="flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              {showAll ? (
                <><ChevronUp className="h-4 w-4" /> See less</>
              ) : (
                <><ChevronDown className="h-4 w-4" /> See {allGroups.length - MAX_VISIBLE} more groups</>
              )}
            </button>
          )}
        </>
      )}

      <CreateGroupDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group) => setStoredGroups((prev) => [...prev, group])}
      />

      {/* ── Edit dialog ── */}
      <AnimatePresence>
        {editGroup && (
          <motion.div
            key="edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setEditGroup(null)}
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
                Update the name for <span className="font-medium text-foreground">{editGroup.name}</span>.
              </p>
              <div className="mt-5 space-y-1.5">
                <Label htmlFor="edit-group-name">Group name</Label>
                <Input
                  id="edit-group-name"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); }}
                  placeholder="e.g. Goa Trip 2025"
                />
              </div>
              <div className="mt-6 flex gap-2.5">
                <Button
                  variant="secondary"
                  className="flex-1"
                  size="sm"
                  onClick={() => setEditGroup(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  className="flex-1"
                  size="sm"
                  disabled={!editName.trim() || editName.trim() === editGroup.name}
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
        {deleteGroup && (
          <motion.div
            key="delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setDeleteGroup(null)}
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
                <span className="font-medium text-foreground">{deleteGroup.name}</span> will be permanently removed. Expenses in this group will still appear in Analytics.
              </p>
              <div className="mt-6 flex gap-2.5">
                <Button
                  variant="secondary"
                  className="flex-1"
                  size="sm"
                  onClick={() => setDeleteGroup(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  size="sm"
                  onClick={handleConfirmDelete}
                >
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
