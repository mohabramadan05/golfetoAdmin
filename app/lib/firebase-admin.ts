import "server-only";

import { applicationDefault, cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Lazy Firebase Admin initialization.
 *
 * Two credential sources:
 *  1. Local dev: `FIREBASE_SERVICE_ACCOUNT_KEY` env var holding the full
 *     service-account JSON (one line) — see `.env.local.example`.
 *  2. Deployed on a Google environment (Firebase App Hosting / Cloud Run):
 *     Application Default Credentials from the backend's own service account —
 *     no key needed.
 *
 * If neither is available the app runs in demo mode (seed data, no auth) —
 * see `app/page.tsx`.
 */

let cached: App | undefined;

/** Strips surrounding whitespace and matching quotes — secrets/env values are
 *  sometimes stored with the wrapping quotes from a .env line. */
function unwrap(s: string): string {
  let v = s.trim();
  if (v.length >= 2 && ((v[0] === "'" && v.endsWith("'")) || (v[0] === '"' && v.endsWith('"')))) {
    v = v.slice(1, -1);
  }
  return v;
}

function hasServiceAccountKey(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
}

/** True on App Hosting / Cloud Run / other Google compute, where ADC works. */
function onGoogleCloud(): boolean {
  return !!(process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT);
}

export function isFirebaseConfigured(): boolean {
  return hasServiceAccountKey() || onGoogleCloud();
}

function getApp(): App {
  if (cached) return cached;
  const existing = getApps()[0];
  if (existing) {
    cached = existing;
    return cached;
  }
  if (hasServiceAccountKey()) {
    const svc = JSON.parse(unwrap(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)) as ServiceAccount & {
      project_id?: string;
    };
    cached = initializeApp({ credential: cert(svc), projectId: svc.project_id ?? svc.projectId });
  } else if (onGoogleCloud()) {
    // Application Default Credentials — the App Hosting backend's service account.
    cached = initializeApp({ credential: applicationDefault() });
  } else {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY (local) or deploy on Google Cloud (ADC).",
    );
  }
  return cached;
}

export function adminDb(): Firestore {
  return getFirestore(getApp());
}

export function adminAuth(): Auth {
  return getAuth(getApp());
}
