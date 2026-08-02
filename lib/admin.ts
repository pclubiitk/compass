interface ProfileResponse {
  profile?: {
    role?: unknown;
  };
}

export function hasAdminRole(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;

  const role = (data as ProfileResponse).profile?.role;
  return typeof role === "number" && role >= 100;
}
