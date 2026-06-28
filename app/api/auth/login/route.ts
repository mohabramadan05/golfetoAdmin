import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import { isAdminClaim, SESSION_COOKIE } from "@/app/lib/session";

const EXPIRES_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(req: Request) {
  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "");
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Auth is not configured (FIREBASE_WEB_API_KEY)" }, { status: 500 });
  }

  // Exchange email/password for an ID token via the Identity Toolkit REST API.
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const data = await resp.json();
  if (!resp.ok) {
    const code = data?.error?.message ?? "LOGIN_FAILED";
    const msg = code === "INVALID_LOGIN_CREDENTIALS" ? "Incorrect email or password" : "Sign-in failed";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const idToken = data.idToken as string;
  let sessionCookie: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    if (!isAdminClaim(decoded)) {
      return NextResponse.json({ error: "This account is not authorized for the admin panel" }, { status: 403 });
    }
    sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn: EXPIRES_MS });
  } catch (e) {
    // Most commonly: the runtime service account lacks the "Service Account
    // Token Creator" role needed to sign the session cookie (when using ADC).
    const detail = e instanceof Error ? e.message : "unknown error";
    console.error("Session cookie creation failed:", detail);
    return NextResponse.json({ error: "Could not create session: " + detail }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionCookie, {
    maxAge: EXPIRES_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return res;
}
