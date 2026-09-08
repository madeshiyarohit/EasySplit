"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, LogOut, Mail, Plus, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearGoogleUser, getGoogleUser, type GoogleUser } from "@/lib/google-user";
import { getStoredProfile, type StoredProfile } from "@/lib/profile-store";
import { CURRENT_USER } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/groups", label: "Groups" },
  { href: "/members", label: "Members" },
  { href: "/analytics", label: "Analytics" },
];

function UserMenu() {
  const [open, setOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Read both stores on mount
  useEffect(() => {
    setGoogleUser(getGoogleUser());
    setProfile(getStoredProfile());
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    clearGoogleUser();
    // Clear Firebase Google auth cookie
    document.cookie = "gauth=; path=/; max-age=0";
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Priority: Google login > saved profile > mock fallback
  const displayName = googleUser?.name ?? profile?.name ?? CURRENT_USER.name;
  const displaySub  = googleUser?.email ?? profile?.email ?? profile?.upiId ?? CURRENT_USER.upiId ?? "";
  const photoURL    = googleUser?.photoURL ?? profile?.avatarDataUrl ?? CURRENT_USER.avatarUrl ?? null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {photoURL ? (
          <div className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoURL} alt={displayName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          </div>
        ) : (
          <Avatar name={displayName} size="sm" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
          >
            {/* User info */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              {photoURL ? (
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoURL} alt={displayName} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                </div>
              ) : (
                <Avatar name={displayName} size="sm" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{displaySub}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </Link>
              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                <Info className="h-4 w-4 text-muted-foreground" />
                About
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
                Contact us
              </Link>
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 glass border-b border-border bg-surface/70">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-sm text-accent-foreground">
              ₹
            </span>
            <span className="text-[15px] font-semibold tracking-tight">SplitEasy</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => {
              const active =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/expenses/new">
            <Button size="sm" variant="accent">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add expense</span>
            </Button>
          </Link>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
