const KEY = "spliteasy_member_overrides";

export interface MemberOverride {
  phone: string;
  email: string;
  upiId: string;
  phonePe: string;
  googlePay: string;
  paytm: string;
}

const DEFAULTS: MemberOverride = {
  phone: "", email: "", upiId: "", phonePe: "", googlePay: "", paytm: "",
};

function getAll(): Record<string, MemberOverride> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, MemberOverride>) : {};
  } catch { return {}; }
}

export function getMemberOverride(userId: string): MemberOverride {
  return { ...DEFAULTS, ...(getAll()[userId] ?? {}) };
}

export function setMemberOverride(userId: string, data: MemberOverride): void {
  const all = getAll();
  all[userId] = { ...DEFAULTS, ...data };
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}
