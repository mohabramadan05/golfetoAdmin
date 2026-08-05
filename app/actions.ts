"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdminData } from "./lib/data";
import { adminDb } from "./lib/firebase-admin";
import { requireUser } from "./lib/session";
import type { AdminData, Config, Pricing, ReferralConfig, SupportConfig } from "./lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Re-reads live data from Firestore. The client updates only the slice for the
 *  screen the user is on, so a refresh never disturbs the rest of the UI. */
export async function refreshData(): Promise<AdminData> {
  await requireUser();
  return getAdminData();
}

async function run(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await fn();
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Action failed" };
  }
}

export async function approveSettlement(id: string): Promise<ActionResult> {
  const user = await requireUser();
  return run(async () => {
    await adminDb().collection("settlements").doc(id).update({
      status: "approved",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedByAdminId: user.uid,
      rejectionReason: null,
    });
  });
}

export async function rejectSettlement(id: string, reason: string): Promise<ActionResult> {
  const user = await requireUser();
  return run(async () => {
    await adminDb().collection("settlements").doc(id).update({
      status: "rejected",
      rejectionReason: reason.trim() || "Payment could not be verified.",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedByAdminId: user.uid,
    });
  });
}

export async function approveDriver(uid: string): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    await adminDb().collection("drivers").doc(uid).update({ approvalStatus: "approved" });
  });
}

export async function rejectDriver(uid: string): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    await adminDb().collection("drivers").doc(uid).update({ approvalStatus: "rejected" });
  });
}

export async function setDriverActive(uid: string, active: boolean): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    await adminDb()
      .collection("drivers")
      .doc(uid)
      .update({ approvalStatus: active ? "approved" : "rejected" });
  });
}

export async function toggleOffer(id: string, active: boolean): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    await adminDb().collection("offers").doc(id).update({ active });
  });
}

export async function savePricing(pricing: Pricing): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    await adminDb().collection("pricing").doc("pricing").set(pricing, { merge: true });
  });
}

export async function saveConfig(config: Config): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    await adminDb().collection("app_config").doc("settlement").set(config, { merge: true });
  });
}

/** Referral payout amounts. The `onReferralRideCompleted` Cloud Function reads
 *  this same doc at payout time, so saving here changes what riders actually
 *  earn — referrals already rewarded keep the amount they were paid. */
export async function saveReferralConfig(config: ReferralConfig): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    if (!Number.isFinite(config.inviterReward) || config.inviterReward < 0) {
      throw new Error("Inviter reward must be zero or more.");
    }
    if (!Number.isFinite(config.inviteeReward) || config.inviteeReward < 0) {
      throw new Error("Invitee reward must be zero or more.");
    }
    await adminDb().collection("app_config").doc("referral").set(config, { merge: true });
  });
}

/** Emergency / support contacts shown in the rider app's Safety screen. The SOS
 *  button dials `emergencyPhone`; leaving it blank falls back to 122 in-app. */
export async function saveSupportConfig(config: SupportConfig): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    await adminDb().collection("app_config").doc("support").set(config, { merge: true });
  });
}

export interface NewOffer {
  code: string;
  title: string;
  type: "percent" | "fixed";
  value: number;
  maxDiscount: number | null;
  perUserLimit: number;
}

export async function createOffer(offer: NewOffer): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    const now = new Date();
    await adminDb().collection("offers").add({
      code: offer.code.trim().toUpperCase(),
      title: offer.title.trim(),
      description: "",
      type: offer.type,
      value: offer.value,
      maxDiscount: offer.maxDiscount,
      minFare: 0,
      active: true,
      startsAt: now,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: null,
      usedCount: 0,
      perUserLimit: offer.perUserLimit,
      compoundId: null,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

// ── Cases & driver discipline ───────────────────────────────────────────────

/** Number of strikes at which a driver is automatically suspended. */
const STRIKE_LIMIT = 3;

export interface NewCase {
  rideId: string;
  passengerId: string;
  driverId: string;
  source: "email" | "manual" | "rider";
  category: string;
  priority: string;
  passengerComplaintText: string;
}

export async function createCase(input: NewCase): Promise<ActionResult> {
  const user = await requireUser();
  return run(async () => {
    await adminDb().collection("cases").add({
      rideId: input.rideId.trim(),
      passengerId: input.passengerId.trim(),
      driverId: input.driverId.trim(),
      assignedAdminId: user.uid,
      source: input.source,
      category: input.category,
      priority: input.priority,
      status: "new",
      passengerComplaintText: input.passengerComplaintText.trim(),
      resolutionSummary: null,
      refundAmount: 0,
      strikeIssued: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function addCaseNote(caseId: string, noteText: string): Promise<ActionResult> {
  const user = await requireUser();
  return run(async () => {
    const db = adminDb();
    await db.collection("case_notes").add({
      caseId,
      adminId: user.uid,
      adminName: user.name,
      noteText: noteText.trim(),
      createdAt: FieldValue.serverTimestamp(),
    });
    // Opening the first note moves a brand-new case into investigation.
    await db.collection("cases").doc(caseId).update({
      status: "under_investigation",
      assignedAdminId: user.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function setCaseStatus(caseId: string, status: string): Promise<ActionResult> {
  const user = await requireUser();
  return run(async () => {
    await adminDb().collection("cases").doc(caseId).update({
      status,
      assignedAdminId: user.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function setCasePriority(caseId: string, priority: string): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    await adminDb().collection("cases").doc(caseId).update({
      priority,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function resolveCase(caseId: string, summary: string): Promise<ActionResult> {
  const user = await requireUser();
  return run(async () => {
    const text = summary.trim();
    if (!text) throw new Error("A resolution summary is required to resolve a case.");
    await adminDb().collection("cases").doc(caseId).update({
      status: "resolved",
      resolutionSummary: text,
      assignedAdminId: user.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

/** Credits dispute compensation into a passenger's wallet. In one transaction it
 *  increments `users/{passengerId}.walletBalance`, records the amount on the case
 *  (`refundAmount`), and writes an immutable `wallet_ledger` credit entry. The
 *  balance is spendable on future rides (auto-applied by the rider app; debited
 *  by the onRideCompleted Cloud Function). Money moves only here / in functions —
 *  the rider client can never write its own balance (firestore.rules). */
export async function creditWalletCompensation(
    caseId: string,
    passengerId: string,
    amount: number,
): Promise<ActionResult> {
  const user = await requireUser();
  return run(async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Enter a compensation amount greater than zero.");
    }
    if (!passengerId) throw new Error("This case has no passenger to credit.");
    const db = adminDb();
    const userRef = db.collection("users").doc(passengerId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error("Passenger account not found.");
      const balance = Number(snap.data()?.walletBalance ?? 0);
      tx.update(userRef, { walletBalance: balance + value });
      if (caseId) {
        tx.update(db.collection("cases").doc(caseId), {
          refundAmount: value,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
    await db.collection("wallet_ledger").add({
      uid: passengerId,
      amount: value,
      type: "credit",
      caseId: caseId || null,
      adminId: user.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    if (caseId) {
      await db.collection("case_notes").add({
        caseId,
        adminId: user.uid,
        adminName: user.name,
        noteText: `Credited EGP ${value} to the passenger's wallet as compensation.`,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  });
}

/** Issues a disciplinary strike to a driver. Increments `strikesCount` and, when
 *  it reaches the limit, sets `isBlocked = true` — all in one transaction so the
 *  count and the block flag can never desync. The app reactively suspends the
 *  driver from `isBlocked` (no Cloud Function needed). Optionally flags the
 *  originating case as having produced a strike. */
export async function issueDriverStrike(uid: string, caseId?: string): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    const db = adminDb();
    const driverRef = db.collection("drivers").doc(uid);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(driverRef);
      if (!snap.exists) throw new Error("Driver not found.");
      const current = (snap.data()?.strikesCount as number | undefined) ?? 0;
      const next = current + 1;
      tx.update(driverRef, {
        strikesCount: next,
        isBlocked: next >= STRIKE_LIMIT,
      });
    });
    if (caseId) {
      await db.collection("cases").doc(caseId).update({
        strikeIssued: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
}

/** Lifts a disciplinary suspension without clearing the strike history. */
export async function unblockDriver(uid: string): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    await adminDb().collection("drivers").doc(uid).update({ isBlocked: false });
  });
}

/** Clears the strike ledger back to zero and lifts any disciplinary block. */
export async function resetDriverStrikes(uid: string): Promise<ActionResult> {
  await requireUser();
  return run(async () => {
    await adminDb().collection("drivers").doc(uid).update({ strikesCount: 0, isBlocked: false });
  });
}
