import "server-only";

import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Lazy Firebase Admin initialization.
 *
 * Credentials come from the `FIREBASE_SERVICE_ACCOUNT_KEY` env var, which must
 * hold the full service-account JSON (as a single-line string). Until it's set
 * the app runs in demo mode (seed data, no auth) — see `app/page.tsx`.
 */

let cached: App | undefined;

export function isFirebaseConfigured(): boolean {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
}

function getApp(): App {
  if (cached) return cached;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Add it to .env.local — see .env.local.example.",
    );
  }
  const svc = JSON.parse(raw) as ServiceAccount & { project_id?: string };
  cached =
    getApps()[0] ??
    initializeApp({
      credential: cert(svc),
      projectId: svc.project_id ?? svc.projectId,
    });
  return cached;
}

export function adminDb(): Firestore {
  return getFirestore(getApp());
}

export function adminAuth(): Auth {
  return getAuth(getApp());
}
