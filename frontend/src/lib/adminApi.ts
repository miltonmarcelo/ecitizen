import type { User } from "firebase/auth";
import { API_BASE_URL } from "@/lib/api";

async function getAuthHeaders(user: User, options?: RequestInit) {
  const token = await user.getIdToken();
  const headers = new Headers(options?.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function adminFetch<T = any>(
  user: User,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders(user, options);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}