"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, LogOut, Moon, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { NotificationPrefsCard } from "@/components/settings/notification-prefs";
import { CURRENT_USER } from "@/lib/mock-data";
import { getStoredProfile, saveStoredProfile, resizeImageToDataUrl } from "@/lib/profile-store";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  {
    value: "system",
    label: "System",
    icon: ({ className }: { className?: string }) => (
      <span className={cn("block text-[11px] font-semibold leading-none", className)}>A</span>
    ),
  },
] as const;

function AppearanceSelector() {
  const { theme, setTheme } = useTheme();
  const active = theme ?? "system";

  return (
    <div className="grid grid-cols-3 gap-3">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = active === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm transition-colors",
              selected
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {selected && (
              <motion.span
                layoutId="theme-selector-bg"
                className="absolute inset-0 rounded-2xl border-2 border-accent"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Icon className="relative h-5 w-5" />
            <span className="relative text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState(CURRENT_USER.name);
  const [phone, setPhone] = useState("9876543210");
  const [email, setEmail] = useState("");
  const [upiId, setUpiId] = useState(CURRENT_USER.upiId ?? "");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // UI state
  const [saved, setSaved] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Load stored profile on mount
  useEffect(() => {
    const p = getStoredProfile();
    if (p) {
      setName(p.name);
      setPhone(p.phone);
      setEmail(p.email);
      setUpiId(p.upiId);
      setAvatarDataUrl(p.avatarDataUrl);
      setAvatarPreview(p.avatarDataUrl);
    }
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setAvatarPreview(dataUrl);
      setAvatarDataUrl(dataUrl);
      toast("Photo updated");
    } catch {
      // ignore
    } finally {
      setPhotoLoading(false);
      // reset so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemovePhoto() {
    setAvatarPreview(null);
    setAvatarDataUrl(null);
    toast("Photo removed", "info");
  }

  function handleSave() {
    saveStoredProfile({ name, phone, email, upiId, avatarDataUrl });
    setSaved(true);
    toast("Profile saved");
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    document.cookie = "gauth=; path=/; max-age=0";
    try { localStorage.removeItem("spliteasy_google_user"); } catch {}
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayAvatar = avatarPreview ?? CURRENT_USER.avatarUrl ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, appearance, and notifications.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how you appear to other members.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar picker */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <Avatar name={name} size="lg" />
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

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoLoading}
                >
                  <Camera className="h-4 w-4" />
                  {avatarPreview ? "Change photo" : "Upload photo"}
                </Button>
                {avatarPreview && (
                  <Button variant="secondary" size="sm" onClick={handleRemovePhoto}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP · auto-cropped to square</p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-surface px-4 h-11">
                <span className="text-sm text-muted-foreground shrink-0">+91</span>
                <input
                  id="phone"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upi">Linked UPI ID</Label>
              <Input
                id="upi"
                value={upiId}
                placeholder="you@upi"
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <Button variant="accent" size="sm" onClick={handleSave} key={saved ? "saved" : "save"}>
              {saved ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Saved!
                </motion.span>
              ) : (
                "Save changes"
              )}
            </Button>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how SplitEasy looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceSelector />
        </CardContent>
      </Card>

      {/* Notifications */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Choose which channels notify you about new expenses and settlements.
          </p>
        </div>
        <NotificationPrefsCard
          initial={{ email: true, push: true, whatsapp: true, sms: false }}
        />
      </div>

      {/* Sign out */}
      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-xs text-muted-foreground">Sign out of your account on this device.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm">Export my data</Button>
          <Button variant="destructive" size="sm">Delete account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
