"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdminData } from "./lib/data";
import { adminDb } from "./lib/firebase-admin";
import { requireUser } from "./lib/session";
import type { AdminData, Config, Pricing } from "./lib/types";

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
