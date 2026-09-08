import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍽️",
  Stay: "🏠",
  Travel: "✈️",
  Activity: "🎯",
  Utilities: "⚡",
  Other: "📦",
};

export function categoryIcon(category?: string | null): string {
  return CATEGORY_ICONS[category ?? ""] ?? "📦";
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  Stay: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  Travel: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
  Activity: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  Utilities: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
  Other: "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400",
};

export function categoryColor(category?: string | null): string {
  return CATEGORY_COLORS[category ?? ""] ?? CATEGORY_COLORS.Other;
}
