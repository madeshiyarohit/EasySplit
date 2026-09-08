const KEY = "spliteasy_hidden_members";

export function getHiddenMemberIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch { return []; }
}

export function hideMember(id: string): void {
  const ids = getHiddenMemberIds();
  if (!ids.includes(id)) {
    ids.push(id);
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {}
  }
}
