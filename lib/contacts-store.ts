const KEY = "spliteasy_contacts";

export interface StoredContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  upiId: string;
  phonePe: string;
  googlePay: string;
  paytm: string;
  avatarDataUrl: string | null;
}

const DEFAULTS: Omit<StoredContact, "id" | "name"> = {
  phone: "", email: "", upiId: "", phonePe: "", googlePay: "", paytm: "", avatarDataUrl: null,
};

export function getContacts(): StoredContact[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredContact[];
    // backfill older entries that predate new fields
    return parsed.map(c => ({ ...DEFAULTS, ...c }));
  } catch { return []; }
}

export function addContact(c: Omit<StoredContact, "id">): StoredContact {
  const contact: StoredContact = { ...DEFAULTS, ...c, id: `c_${Date.now()}` };
  const all = getContacts();
  all.push(contact);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
  return contact;
}

export function updateContact(id: string, updates: Partial<Omit<StoredContact, "id">>): void {
  const all = getContacts().map((c) => (c.id === id ? { ...c, ...updates } : c));
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

export function removeContact(id: string): void {
  const all = getContacts().filter((c) => c.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}
