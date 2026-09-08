"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { CURRENT_USER, USERS } from "@/lib/mock-data";
import { getContacts, addContact, type StoredContact } from "@/lib/contacts-store";
import { addStoredGroup } from "@/lib/groups-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import type { Group } from "@/lib/types";

const CATEGORY_OPTIONS = [
  { label: "Trip", emoji: "✈️" },
  { label: "Home", emoji: "🏠" },
  { label: "Friends", emoji: "👥" },
  { label: "Work", emoji: "💼" },
  { label: "Other", emoji: "📦" },
];

type MemberEntry =
  | { kind: "mock"; id: string; name: string; avatarUrl?: string | null }
  | { kind: "contact"; id: string; name: string; phone: string; email: string; avatarUrl?: string | null };

export function CreateGroupDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (group: Group) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Friends");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [created, setCreated] = useState(false);

  // Search + add new member
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhonePe, setNewPhonePe] = useState("");
  const [newGooglePay, setNewGooglePay] = useState("");
  const [newPaytm, setNewPaytm] = useState("");
  const [contacts, setContacts] = useState<StoredContact[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setContacts(getContacts());
  }, [open]);

  // All selectable members: mock users + saved contacts
  const allMembers: MemberEntry[] = [
    ...USERS.filter((u) => u.id !== CURRENT_USER.id).map((u) => ({
      kind: "mock" as const,
      id: u.id,
      name: u.name,
      avatarUrl: u.avatarUrl,
    })),
    ...contacts.map((c) => ({
      kind: "contact" as const,
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      avatarUrl: c.avatarDataUrl,
    })),
  ];

  const filtered = search.trim()
    ? allMembers.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.kind === "contact" &&
          (m.phone.includes(search) || m.email.toLowerCase().includes(search.toLowerCase())))
      )
    : allMembers;

  const noResults = search.trim() && filtered.length === 0;

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleAddNewMember() {
    if (!newName.trim()) return;
    const contact = addContact({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      upiId: "",
      avatarDataUrl: null,
      phonePe: newPhonePe.trim(),
      googlePay: newGooglePay.trim(),
      paytm: newPaytm.trim(),
    });
    setContacts((prev) => [...prev, contact]);
    setSelectedIds((prev) => [...prev, contact.id]);
    setShowAddForm(false);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewPhonePe("");
    setNewGooglePay("");
    setNewPaytm("");
    setSearch("");
    toast(`${newName.trim()} added`);
  }

  function handleCreate() {
    if (!name.trim()) return;

    const memberObjects = [
      { user: CURRENT_USER },
      ...selectedIds
        .map((id) => {
          const m = allMembers.find((am) => am.id === id);
          if (!m) return null;
          return { user: { id: m.id, name: m.name, avatarUrl: m.avatarUrl ?? null } };
        })
        .filter(Boolean) as { user: { id: string; name: string; avatarUrl?: string | null } }[],
    ];

    const newGroup: Group = {
      id: `g_${Date.now()}`,
      name: name.trim(),
      inviteCode: Math.random().toString(36).slice(2, 10),
      createdAt: new Date().toISOString(),
      members: memberObjects,
    };

    addStoredGroup(newGroup);
    onCreated?.(newGroup);

    setCreated(true);
    setTimeout(() => {
      setCreated(false);
      setName("");
      setCategory("Friends");
      setSelectedIds([]);
      setSearch("");
      onClose();
    }, 1400);
  }

  function handleClose() {
    if (created) return;
    setName("");
    setCategory("Friends");
    setSelectedIds([]);
    setSearch("");
    setShowAddForm(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="glass w-full max-w-md rounded-t-3xl border border-border bg-surface/95 p-6 sm:rounded-3xl"
          >
            {created ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-positive/10 text-positive"
                >
                  <Check className="h-8 w-8" />
                </motion.div>
                <h3 className="text-lg font-semibold">Group created!</h3>
                <p className="text-sm text-muted-foreground">
                  &ldquo;{name}&rdquo; is ready. Start adding expenses.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Create a group</h3>
                  <button
                    onClick={handleClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 space-y-5">
                  {/* Group name */}
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Group name</Label>
                    <Input
                      id="group-name"
                      autoFocus
                      placeholder="Goa Trip, Flatmates, Office Lunch…"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORY_OPTIONS.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => setCategory(opt.label)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                            category === opt.label
                              ? "border-accent bg-accent-soft text-accent"
                              : "border-border text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <span>{opt.emoji}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Members */}
                  <div className="space-y-2">
                    <Label>Add members</Label>

                    {/* Search bar */}
                    <div className="flex h-10 items-center gap-2 rounded-xl border border-input bg-surface px-3 focus-within:ring-2 focus-within:ring-ring transition-shadow">
                      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <input
                        ref={searchRef}
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
                    <div className="max-h-44 space-y-1.5 overflow-y-auto">
                      {filtered.map((member) => {
                        const selected = selectedIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            onClick={() => toggle(member.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                              selected ? "border-accent bg-accent-soft" : "border-border hover:bg-muted"
                            )}
                          >
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={member.name}
                                referrerPolicy="no-referrer"
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <Avatar name={member.name} size="sm" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{member.name}</p>
                              {member.kind === "contact" && (member.phone || member.email) && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {member.phone || member.email}
                                </p>
                              )}
                            </div>
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors",
                                selected
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-border"
                              )}
                            >
                              {selected && <Check className="h-3 w-3" />}
                            </span>
                          </button>
                        );
                      })}

                      {/* No results → offer to add new */}
                      {noResults && !showAddForm && (
                        <button
                          onClick={() => {
                            setShowAddForm(true);
                            setNewName(search);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-accent/50 bg-accent-soft p-2.5 text-sm text-accent hover:bg-accent/10"
                        >
                          <UserPlus className="h-4 w-4 shrink-0" />
                          Add &ldquo;{search}&rdquo; as a new member
                        </button>
                      )}
                    </div>

                    {/* Also always show Add new button when not searching */}
                    {!search && !showAddForm && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border p-2.5 text-sm text-muted-foreground hover:border-accent/50 hover:text-accent transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add someone new
                      </button>
                    )}

                    {/* Inline add new member form */}
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
                            <Input
                              placeholder="Full name *"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              autoFocus
                            />
                            <Input
                              placeholder="Phone number (optional)"
                              inputMode="numeric"
                              maxLength={10}
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                            />
                            <Input
                              placeholder="Email (optional)"
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                            />
                            <Input placeholder="PhonePe UPI (optional)" value={newPhonePe} onChange={(e) => setNewPhonePe(e.target.value)} />
                            <Input placeholder="Google Pay UPI (optional)" value={newGooglePay} onChange={(e) => setNewGooglePay(e.target.value)} />
                            <Input placeholder="Paytm UPI (optional)" value={newPaytm} onChange={(e) => setNewPaytm(e.target.value)} />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="accent"
                                className="flex-1"
                                disabled={!newName.trim()}
                                onClick={handleAddNewMember}
                              >
                                <UserPlus className="h-4 w-4" />
                                Add member
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => { setShowAddForm(false); setNewName(""); setNewPhone(""); setNewEmail(""); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="text-xs text-muted-foreground">
                      <Users className="mr-1 inline h-3 w-3" />
                      You are always included · {selectedIds.length + 1} member
                      {selectedIds.length !== 0 ? "s" : ""}
                    </p>
                  </div>

                  <Button
                    size="lg"
                    variant="accent"
                    className="w-full"
                    disabled={!name.trim()}
                    onClick={handleCreate}
                  >
                    Create group
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
