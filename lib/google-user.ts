export interface GoogleUser {
  name: string;
  email: string;
  photoURL: string | null;
}

const KEY = "spliteasy_google_user";

export function saveGoogleUser(user: GoogleUser) {
  try { localStorage.setItem(KEY, JSON.stringify(user)); } catch {}
}

export function getGoogleUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GoogleUser) : null;
  } catch { return null; }
}

export function clearGoogleUser() {
  try { localStorage.removeItem(KEY); } catch {}
}
