"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/expenses/new", label: "Add", icon: Plus, accent: true },
  { href: "/members", label: "Members", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/90 glass sm:hidden">
      <div className="flex items-center justify-around px-2 pb-safe pt-2">
        {ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const active =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

          if (accent) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-1"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-accent-soft text-accent" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  active ? "text-accent" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
