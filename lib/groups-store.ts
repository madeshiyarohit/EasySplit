import type { Group } from "@/lib/types";

const KEY = "spliteasy_groups";

export function getStoredGroups(): Group[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Group[];
  } catch { return []; }
}

export function addStoredGroup(group: Group): void {
  const all = getStoredGroups();
  all.push(group);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

export function updateStoredGroup(id: string, patch: Partial<Pick<Group, "name">>): void {
  const all = getStoredGroups().map((g) =>
    g.id === id ? { ...g, ...patch } : g
  );
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

export function deleteStoredGroup(id: string): void {
  const all = getStoredGroups().filter((g) => g.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}
