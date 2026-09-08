"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { GROUPS } from "@/lib/mock-data";
import { getStoredGroups } from "@/lib/groups-store";
import type { Group } from "@/lib/types";

const STATIC_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  groups: "Groups",
  members: "Members",
  analytics: "Analytics",
  settings: "Settings",
  expenses: "Expenses",
  new: "New",
  about: "About",
  contact: "Contact",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const [storedGroups, setStoredGroups] = useState<Group[]>([]);

  useEffect(() => {
    setStoredGroups(getStoredGroups());
  }, []);

  if (pathname === "/dashboard") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  type Crumb = { label: string; href: string };
  const crumbs: Crumb[] = [{ label: "Dashboard", href: "/dashboard" }];

  let currentPath = "";
  for (const seg of segments) {
    currentPath += `/${seg}`;

    if (STATIC_LABELS[seg]) {
      crumbs.push({ label: STATIC_LABELS[seg], href: currentPath });
    } else {
      const allGroups: Group[] = [...GROUPS, ...storedGroups];
      const group = allGroups.find((g) => g.id === seg);
      if (group) {
        crumbs.push({ label: group.name, href: currentPath });
      } else {
        const label = seg.charAt(0).toUpperCase() + seg.slice(1);
        crumbs.push({ label, href: currentPath });
      }
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 overflow-x-auto text-sm text-muted-foreground [&::-webkit-scrollbar]:hidden">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex shrink-0 items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
