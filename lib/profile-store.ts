const KEY = "spliteasy_profile";

export interface StoredProfile {
  name: string;
  phone: string;
  email: string;
  upiId: string;
  avatarDataUrl: string | null;
}

export function getStoredProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredProfile) : null;
  } catch { return null; }
}

export function saveStoredProfile(p: StoredProfile): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

/** Resize + center-crop an image File to a square JPEG data URL (max 220px). */
export function resizeImageToDataUrl(file: File, maxPx = 220): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = maxPx;
        canvas.height = maxPx;
        const ctx = canvas.getContext("2d")!;
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxPx, maxPx);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}
