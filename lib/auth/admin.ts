export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS?.trim() || process.env.NEXT_PUBLIC_ADMIN_EMAILS?.trim();

  if (!raw) {
    return ["spotcloud2026@gmail.com"];
  }

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.toLowerCase());
}
