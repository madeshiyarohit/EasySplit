"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import {
  addContact,
  getContacts,
  removeContact,
  type StoredContact,
  updateContact,
} from "@/lib/contacts-store";
import {
  getMemberOverride,
  setMemberOverride,
  type MemberOverride,
} from "@/lib/member-overrides-store";
import { getHiddenMemberIds, hideMember } from "@/lib/hidden-members-store";
import { CURRENT_USER, USERS } from "@/lib/mock-data";
import { resizeImageToDataUrl } from "@/lib/profile-store";
import { useToast } from "@/lib/toast";

const MOCK_MEMBERS = USERS.filter((u) => u.id !== CURRENT_USER.id);

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  upiId: "",
  phonePe: "",
  googlePay: "",
  paytm: "",
  avatarDataUrl: null as string | null,
};

type FormState = typeof EMPTY_FORM;

function filledUpiCount(form: FormState) {
  return [form.upiId, form.phonePe, form.googlePay, form.paytm].filter(Boolean).length;
}

function InfoTag({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
      <span className="text-accent">{label}:</span>
      <span className="truncate max-w-[130px]">{value}</span>
    </span>
  );
}

function MemberTags({
  phone,
  email,
  upiId,
  phonePe,
  googlePay,
  paytm,
}: {
  phone?: string;
  email?: string;
  upiId?: string;
  phonePe?: string;
  googlePay?: string;
  paytm?: string;
}) {
  const any = phone || email || upiId || phonePe || googlePay || paytm;
  if (!any) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      <InfoTag label="Phone" value={phone ?? ""} />
      <InfoTag label="Email" value={email ?? ""} />
      <InfoTag label="UPI" value={upiId ?? ""} />
      <InfoTag label="PhonePe" value={phonePe ?? ""} />
      <InfoTag label="GPay" value={googlePay ?? ""} />
      <InfoTag label="Paytm" value={paytm ?? ""} />
    </div>
  );
}

export default function MembersPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contacts, setContacts] = useState<StoredContact[]>([]);
  const [overrides, setOverrides] = useState<Record<string, MemberOverride>>({});
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; isMock: boolean } | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingMockId, setEditingMockId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [upiExpanded, setUpiExpanded] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    setContacts(getContacts());
    setHiddenIds(getHiddenMemberIds());
    const map: Record<string, MemberOverride> = {};
    MOCK_MEMBERS.forEach((u) => { map[u.id] = getMemberOverride(u.id); });
    setOverrides(map);
  }, []);

  function refreshContacts() {
    setContacts(getContacts());
  }

  function openAdd() {
    setEditingContactId(null);
    setEditingMockId(null);
    setForm(EMPTY_FORM);
    setUpiExpanded(false);
    setDialogOpen(true);
  }

  function openEditContact(contact: StoredContact) {
    setEditingContactId(contact.id);
    setEditingMockId(null);
    setForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      upiId: contact.upiId,
      phonePe: contact.phonePe,
      googlePay: contact.googlePay,
      paytm: contact.paytm,
      avatarDataUrl: contact.avatarDataUrl,
    });
    setUpiExpanded(false);
    setDialogOpen(true);
  }

  function openEditMock(userId: string, name: string) {
    const or = overrides[userId] ?? getMemberOverride(userId);
    const user = USERS.find((u) => u.id === userId);
    setEditingMockId(userId);
    setEditingContactId(null);
    setForm({
      name,
      phone: or.phone,
      email: or.email,
      upiId: or.upiId || (user?.upiId ?? ""),
      phonePe: or.phonePe,
      googlePay: or.googlePay,
      paytm: or.paytm,
      avatarDataUrl: null,
    });
    setUpiExpanded(false);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingContactId(null);
    setEditingMockId(null);
  }

  function confirmDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.isMock) {
      hideMember(deleteConfirm.id);
      setHiddenIds((prev) => [...prev, deleteConfirm.id]);
    } else {
      removeContact(deleteConfirm.id);
      refreshContacts();
    }
    toast("Member removed", "error");
    setDeleteConfirm(null);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setForm((prev) => ({ ...prev, avatarDataUrl: dataUrl }));
    } catch {
      // ignore
    } finally {
      setPhotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSave() {
    if (!form.name.trim()) return;

    if (editingMockId) {
      setMemberOverride(editingMockId, {
        phone: form.phone,
        email: form.email,
        upiId: form.upiId,
        phonePe: form.phonePe,
        googlePay: form.googlePay,
        paytm: form.paytm,
      });
      setOverrides((prev) => ({
        ...prev,
        [editingMockId]: {
          phone: form.phone, email: form.email, upiId: form.upiId,
          phonePe: form.phonePe, googlePay: form.googlePay, paytm: form.paytm,
        },
      }));
      toast("Member updated");
    } else if (editingContactId) {
      updateContact(editingContactId, { ...form, name: form.name.trim() });
      toast("Member updated");
      refreshContacts();
    } else {
      addContact({ ...form, name: form.name.trim() });
      toast("Member added");
      refreshContacts();
    }
    closeDialog();
  }

  const visibleMockMembers = MOCK_MEMBERS.filter((u) => !hiddenIds.includes(u.id));
  const totalCount = visibleMockMembers.length + contacts.length;

  const isEditing = editingContactId !== null || editingMockId !== null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "person" : "people"} in your network
          </p>
        </div>
        <Button variant="accent" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add member
        </Button>
      </div>

      {/* Mock members from groups */}
      {visibleMockMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" />
              From your groups
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0 px-4 pb-4 sm:px-6">
            {visibleMockMembers.map((user) => {
              const or = overrides[user.id];
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar name={user.name} src={user.avatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <MemberTags
                      phone={or?.phone}
                      email={or?.email}
                      upiId={(or?.upiId || user.upiId) ?? ""}
                      phonePe={or?.phonePe}
                      googlePay={or?.googlePay}
                      paytm={or?.paytm}
                    />
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditMock(user.id, user.name)}
                      aria-label={`Edit ${user.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDeleteConfirm({ id: user.id, name: user.name, isMock: true })}
                      aria-label={`Remove ${user.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Saved contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your contacts</CardTitle>
        </CardHeader>
        <CardContent className="p-0 px-4 pb-4 sm:px-6">
          {contacts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No contacts yet. Tap &quot;Add member&quot; to get started.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar name={contact.name} src={contact.avatarDataUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{contact.name}</p>
                    <MemberTags
                      phone={contact.phone}
                      email={contact.email}
                      upiId={contact.upiId}
                      phonePe={contact.phonePe}
                      googlePay={contact.googlePay}
                      paytm={contact.paytm}
                    />
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditContact(contact)}
                      aria-label={`Edit ${contact.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDeleteConfirm({ id: contact.id, name: contact.name, isMock: false })}
                      aria-label={`Remove ${contact.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            key="delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="relative w-full max-w-sm rounded-3xl border border-border/60 bg-card/95 p-6 shadow-2xl backdrop-blur-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">Remove member?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{deleteConfirm.name}</span> will be removed from your members list.
              </p>
              <div className="mt-6 flex gap-2.5">
                <Button variant="secondary" className="flex-1" size="sm" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" size="sm" onClick={confirmDelete}>
                  Remove
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeDialog();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="relative w-full max-w-md rounded-3xl border border-border/60 bg-card/95 p-6 shadow-2xl backdrop-blur-md"
            >
              {/* Close */}
              <button
                onClick={closeDialog}
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="mb-5 text-lg font-semibold">
                {isEditing ? "Edit member" : "Add member"}
              </h2>

              <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
                {/* Photo picker — only for contacts, not mock overrides */}
                {!editingMockId && (
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {form.avatarDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.avatarDataUrl}
                          alt={form.name || "Photo"}
                          className="h-14 w-14 rounded-full object-cover ring-2 ring-border"
                        />
                      ) : (
                        <Avatar name={form.name.trim() || "?"} size="lg" />
                      )}
                      {photoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                          <motion.div
                            className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoLoading}
                      >
                        <Camera className="h-4 w-4" />
                        {form.avatarDataUrl ? "Change photo" : "Upload photo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or WebP · auto-cropped to square
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                )}

                {/* Name — read-only for mock user edits */}
                <div className="space-y-2">
                  <Label htmlFor="member-name">Name</Label>
                  <Input
                    id="member-name"
                    placeholder="Priya Sharma"
                    value={form.name}
                    readOnly={!!editingMockId}
                    className={editingMockId ? "opacity-60" : ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="member-phone">Phone</Label>
                  <Input
                    id="member-phone"
                    inputMode="tel"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    placeholder="priya@example.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                {/* Collapsible UPI section */}
                <div className="rounded-2xl border border-border">
                  <button
                    type="button"
                    onClick={() => setUpiExpanded((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2">
                      Payment methods
                      {filledUpiCount(form) > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold leading-none text-accent-foreground">
                          {filledUpiCount(form)}
                        </span>
                      )}
                    </span>
                    {upiExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {upiExpanded && (
                      <motion.div
                        key="upi-fields"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                          <div className="space-y-2">
                            <Label htmlFor="member-upi">UPI ID</Label>
                            <Input
                              id="member-upi"
                              placeholder="priya@upi"
                              value={form.upiId}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, upiId: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="member-phonepe">PhonePe</Label>
                            <Input
                              id="member-phonepe"
                              placeholder="9876543210"
                              value={form.phonePe}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, phonePe: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="member-gpay">Google Pay</Label>
                            <Input
                              id="member-gpay"
                              placeholder="priya@okaxis"
                              value={form.googlePay}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, googlePay: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="member-paytm">Paytm</Label>
                            <Input
                              id="member-paytm"
                              placeholder="9876543210@paytm"
                              value={form.paytm}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, paytm: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer actions */}
              <div className="mt-5 flex justify-end gap-2.5">
                <Button variant="secondary" size="sm" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleSave}
                  disabled={!form.name.trim()}
                >
                  {isEditing ? "Save changes" : "Add member"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
