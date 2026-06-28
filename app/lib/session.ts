import "server-only";

import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";
import type { AdminUser } from "./types";

export const SESSION_COOKIE = "__session";

/** Reads and verifies the session cookie. Returns the admin user, or null. */
export async function getSessionUser(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: (decoded.name as string | undefined) ?? decoded.email ?? "Admin",
    };
  } catch {
    return null;
  }
}

/** Throws if there is no valid session — used to guard server actions. */
export async function requireUser(): Promise<AdminUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

/** An authenticated Firebase user is an admin if they have the `admin` custom
 *  claim, or their email is in the ADMIN_EMAILS allowlist. */
export function isAdminClaim(decoded: { admin?: unknown; email?: string }): boolean {
  if (decoded.admin === true) return true;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length === 0) return true; // no allowlist configured → any authenticated user
  return !!decoded.email && allow.includes(decoded.email.toLowerCase());
}
