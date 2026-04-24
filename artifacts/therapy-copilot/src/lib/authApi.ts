export interface AuthUser {
  id: number;
  name: string;
  preferredName: string | null;
  email: string;
  createdAt: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  preferredName?: string;
  anonymousUserId?: string;
}

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (res.status === 204) return null as unknown as T;

  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? "Something went wrong.");
  }
  return data as T;
}

export const authApi = {
  me: () => authFetch<AuthUser>("/auth/me"),
  login: (email: string, password: string) =>
    authFetch<AuthUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signup: (data: SignupData) =>
    authFetch<AuthUser>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => authFetch<void>("/auth/logout", { method: "POST" }),
  claimEntries: (anonymousUserId: string) =>
    authFetch<void>("/auth/claim-entries", {
      method: "POST",
      body: JSON.stringify({ anonymousUserId }),
    }),
  deleteAccount: () => authFetch<void>("/auth/account", { method: "DELETE" }),
};
