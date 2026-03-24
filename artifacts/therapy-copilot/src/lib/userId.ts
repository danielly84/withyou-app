const USER_ID_KEY = "clarity_user_id";

function generateUserId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getOrCreateUserId(): string {
  try {
    const existing = localStorage.getItem(USER_ID_KEY);
    if (existing) return existing;
    const id = generateUserId();
    localStorage.setItem(USER_ID_KEY, id);
    return id;
  } catch {
    return generateUserId();
  }
}
