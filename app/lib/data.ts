import "server-only";

import { adminDb } from "./firebase-admin";
import type {
  AdminData,
  ApprovalStatus,
  Case,
  CaseCategory,
  CaseNote,
  CasePriority,
  CaseSource,
  CaseStatus,
  Compound,
  Config,
  Driver,
  Offer,
  Pricing,
  Redemption,
  Referral,
  ReferralConfig,
  Ride,
  RideStatus,
  Rider,
  Settlement,
  SettlementStatus,
  SupportConfig,
} from "./types";

type Doc = FirebaseFirestore.QueryDocumentSnapshot;
type Data = FirebaseFirestore.DocumentData;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const t = v as { toDate?: () => Date };
  if (typeof t.toDate === "function") return t.toDate();
  return null;
}
function fmtDate(v: unknown): string {
  const d = toDate(v);
  return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : "—";
}
function fmtShort(v: unknown): string {
  const d = toDate(v);
  return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}` : "—";
}
function fmtDateTime(v: unknown): string | null {
  const d = toDate(v);
  if (!d) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

/** Fetches every collection the admin panel needs and maps it to display types. */
export async function getAdminData(): Promise<AdminData> {
  const db = adminDb();
  const [usersSnap, driversSnap, compoundsSnap, settlementsSnap, ridesSnap, offersSnap, redemptionsSnap, referralsSnap, casesSnap, caseNotesSnap, pricingDoc, configDoc, referralCfgDoc, supportCfgDoc] =
    await Promise.all([
      db.collection("users").get(),
      db.collection("drivers").get(),
      db.collection("compounds").get(),
      db.collection("settlements").get(),
      db.collection("rides").orderBy("createdAt", "desc").limit(200).get(),
      db.collection("offers").get(),
      db.collection("offer_redemptions").orderBy("createdAt", "desc").limit(50).get(),
      db.collection("referrals").orderBy("createdAt", "desc").limit(300).get(),
      db.collection("cases").orderBy("createdAt", "desc").limit(300).get(),
      db.collection("case_notes").orderBy("createdAt", "asc").limit(1000).get(),
      db.collection("pricing").doc("pricing").get(),
      db.collection("app_config").doc("settlement").get(),
      db.collection("app_config").doc("referral").get(),
      db.collection("app_config").doc("support").get(),
    ]);

  const users = new Map<string, Data>();
  usersSnap.forEach((d) => users.set(d.id, d.data()));
  const compoundName = new Map<string, string>();
  compoundsSnap.forEach((d) => compoundName.set(d.id, str(d.data().name, d.id)));

  const nameOf = (uid: string | null | undefined): string => {
    if (!uid) return "—";
    const u = users.get(uid);
    return u ? str(u.name, uid) : uid;
  };

  // ---- rides (also feeds rider/compound aggregates) ----
  const rides: Ride[] = ridesSnap.docs.map((doc) => mapRide(doc, nameOf, compoundName));

  // per-rider aggregates
  const riderRides = new Map<string, number>();
  const riderSpent = new Map<string, number>();
  ridesSnap.forEach((doc) => {
    const d = doc.data();
    const rid = str(d.riderId);
    if (!rid) return;
    riderRides.set(rid, (riderRides.get(rid) ?? 0) + 1);
    if (str(d.status) === "completed") riderSpent.set(rid, (riderSpent.get(rid) ?? 0) + num(d.price));
  });

  // per-compound aggregates
  const compoundDrivers = new Map<string, number>();
  driversSnap.forEach((doc) => {
    const cid = str(doc.data().compoundId);
    if (cid) compoundDrivers.set(cid, (compoundDrivers.get(cid) ?? 0) + 1);
  });
  const compoundActiveRides = new Map<string, number>();
  ridesSnap.forEach((doc) => {
    const d = doc.data();
    if (["requested", "accepted", "enRoute", "arrived", "inProgress"].includes(str(d.status))) {
      const cid = str(d.compoundId);
      if (cid) compoundActiveRides.set(cid, (compoundActiveRides.get(cid) ?? 0) + 1);
    }
  });

  const drivers: Driver[] = driversSnap.docs.map((doc) => {
    const d = doc.data();
    const u = users.get(doc.id);
    return {
      uid: doc.id,
      name: str(d.name) || str(u?.name, doc.id),
      phone: str(d.phone) || str(u?.phone),
      compound: compoundName.get(str(d.compoundId)) ?? str(d.compoundId),
      approvalStatus: (str(d.approvalStatus, "pending") as ApprovalStatus) || "pending",
      isOnline: d.isOnline === true,
      isFree: d.isFree !== false,
      cartNumber: str(d.cartNumber),
      licensePlate: str(d.licensePlate),
      carType: str(d.carType),
      seatNumber: num(d.seatNumber, 4),
      ratingSum: num(d.ratingSum),
      ratingCount: num(d.ratingCount),
      totalRides: num(d.totalRides),
      totalEarnings: num(d.totalEarnings),
      settlementBlocked: d.settlementBlocked === true,
      lastSettlementAt: toDate(d.lastSettlementAt) ? fmtDate(d.lastSettlementAt) : null,
      strikesCount: num(d.strikesCount),
      isBlocked: d.isBlocked === true,
      hasLicense: !!d.licenseImageUrl,
      hasRecord: !!d.criminalRecordUrl,
      licenseImageUrl: d.licenseImageUrl ? str(d.licenseImageUrl) : null,
      criminalRecordUrl: d.criminalRecordUrl ? str(d.criminalRecordUrl) : null,
      dob: toDate(d.dob) ? fmtDate(d.dob) : null,
      city: str(d.city),
      driverPhotoUrl: d.driverPhotoUrl ? str(d.driverPhotoUrl) : null,
      idImageUrl: d.idImageUrl ? str(d.idImageUrl) : null,
      carImageUrl: d.carImageUrl ? str(d.carImageUrl) : null,
      infoConfirmed: d.infoConfirmed === true,
      termsAccepted: d.termsAccepted === true,
      joined: fmtDate(u?.createdAt ?? d.createdAt),
    };
  });

  const settlements: Settlement[] = settlementsSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      driverId: str(d.driverId),
      driverName: nameOf(str(d.driverId)),
      driverPhone: str(users.get(str(d.driverId))?.phone),
      weekId: str(d.weekId),
      periodStart: fmtShort(d.periodStart),
      periodEnd: fmtShort(d.periodEnd),
      dueDate: fmtShort(d.dueDate),
      totalRides: num(d.totalRides),
      grossEarnings: num(d.grossEarnings),
      appFeeOwed: num(d.appFeeOwed),
      driverNet: num(d.driverNet),
      amountSent: num(d.amountSent),
      referenceNumber: str(d.referenceNumber),
      hasProof: !!d.proofImageUrl,
      proofImageUrl: d.proofImageUrl ? str(d.proofImageUrl) : null,
      status: (str(d.status, "pending") as SettlementStatus) || "pending",
      submittedAt: fmtDateTime(d.submittedAt),
      reviewedAt: fmtDateTime(d.reviewedAt),
      reviewedBy: d.reviewedByAdminId ? nameOf(str(d.reviewedByAdminId)) : null,
      rejectionReason: d.rejectionReason ? str(d.rejectionReason) : null,
    };
  });

  const riders: Rider[] = usersSnap.docs
    .filter((doc) => str(doc.data().role, "rider") === "rider")
    .map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        name: str(d.name, doc.id),
        phone: str(d.phone),
        compound: compoundName.get(str(d.compoundId)) ?? str(d.compoundId, "—"),
        createdAt: fmtDate(d.createdAt),
        language: str(d.language, "en") === "ar" ? "ar" : "en",
        rides: riderRides.get(doc.id) ?? 0,
        spent: Math.round((riderSpent.get(doc.id) ?? 0) * 100) / 100,
        walletBalance: Math.round(Number(d.walletBalance ?? 0) * 100) / 100,
        referralCode: str(d.referralCode).toUpperCase(),
        referredByName: d.referredBy ? nameOf(str(d.referredBy)) : null,
      };
    });

  const offers: Offer[] = offersSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      code: str(d.code).toUpperCase(),
      title: str(d.title),
      description: str(d.description),
      type: str(d.type) === "fixed" ? "fixed" : "percent",
      value: num(d.value),
      maxDiscount: typeof d.maxDiscount === "number" ? d.maxDiscount : null,
      minFare: num(d.minFare),
      active: d.active !== false,
      startsAt: fmtShort(d.startsAt),
      expiresAt: fmtShort(d.expiresAt),
      usageLimit: typeof d.usageLimit === "number" ? d.usageLimit : null,
      perUserLimit: num(d.perUserLimit, 1),
      compound: d.compoundId ? compoundName.get(str(d.compoundId)) ?? str(d.compoundId) : "All compounds",
      usedCount: num(d.usedCount),
    };
  });

  const redemptions: Redemption[] = redemptionsSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      code: str(d.code),
      rider: nameOf(str(d.uid)),
      rideId: str(d.rideId),
      discount: num(d.discount),
      status: str(d.status) === "released" ? "released" : "applied",
      createdAt: fmtDateTime(d.createdAt) ?? "—",
    };
  });

  const referrals: Referral[] = referralsSnap.docs.map((doc) => {
    const d = doc.data();
    const created = toDate(d.createdAt);
    return {
      id: doc.id,
      inviterUid: str(d.inviterUid),
      inviterName: nameOf(str(d.inviterUid)),
      inviteeUid: str(d.inviteeUid),
      // Snapshotted at signup, so it survives the invitee renaming themselves.
      inviteeName: str(d.inviteeName) || nameOf(str(d.inviteeUid)),
      code: str(d.code).toUpperCase(),
      status: str(d.status) === "rewarded" ? "rewarded" : "pending",
      inviterReward: num(d.inviterReward),
      inviteeReward: num(d.inviteeReward),
      createdAt: fmtDateTime(d.createdAt) ?? "—",
      createdAtMs: created ? created.getTime() : undefined,
      rewardedAt: fmtDateTime(d.rewardedAt),
    };
  });

  const compounds: Compound[] = compoundsSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      name: str(d.name, doc.id),
      city: str(d.city),
      isActive: d.isActive !== false,
      centerLat: num(d.centerLat),
      centerLng: num(d.centerLng),
      radius: num(d.boundaryRadiusMeters),
      drivers: compoundDrivers.get(doc.id) ?? 0,
      activeRides: compoundActiveRides.get(doc.id) ?? 0,
    };
  });

  const CATEGORIES: CaseCategory[] = ["route_dispute", "billing_dispute", "driver_behavior", "vehicle_condition", "safety", "other"];
  const PRIORITIES: CasePriority[] = ["low", "medium", "high", "critical"];
  const STATUSES: CaseStatus[] = ["new", "under_investigation", "resolved"];

  const cases: Case[] = casesSnap.docs.map((doc) => {
    const d = doc.data();
    const created = toDate(d.createdAt);
    const assignedId = d.assignedAdminId ? str(d.assignedAdminId) : null;
    return {
      id: doc.id,
      rideId: str(d.rideId),
      passengerId: str(d.passengerId),
      passengerName: nameOf(str(d.passengerId)),
      driverId: str(d.driverId),
      driverName: nameOf(str(d.driverId)),
      assignedAdminId: assignedId,
      assignedAdminName: assignedId ? nameOf(assignedId) : null,
      source: (["email", "manual", "rider"].includes(str(d.source)) ? str(d.source) : "email") as CaseSource,
      category: CATEGORIES.includes(str(d.category) as CaseCategory) ? (str(d.category) as CaseCategory) : "other",
      priority: PRIORITIES.includes(str(d.priority) as CasePriority) ? (str(d.priority) as CasePriority) : "medium",
      status: STATUSES.includes(str(d.status) as CaseStatus) ? (str(d.status) as CaseStatus) : "new",
      passengerComplaintText: str(d.passengerComplaintText),
      resolutionSummary: d.resolutionSummary ? str(d.resolutionSummary) : null,
      strikeIssued: d.strikeIssued === true,
      refundAmount: Number(d.refundAmount ?? 0),
      createdAt: fmtDateTime(d.createdAt) ?? "—",
      createdAtMs: created ? created.getTime() : undefined,
      updatedAt: fmtDateTime(d.updatedAt),
    };
  });

  const caseNotes: CaseNote[] = caseNotesSnap.docs.map((doc) => {
    const d = doc.data();
    const created = toDate(d.createdAt);
    return {
      id: doc.id,
      caseId: str(d.caseId),
      adminId: str(d.adminId),
      adminName: str(d.adminName) || nameOf(str(d.adminId)),
      noteText: str(d.noteText),
      createdAt: fmtDateTime(d.createdAt) ?? "—",
      createdAtMs: created ? created.getTime() : undefined,
    };
  });

  const pd = pricingDoc.data() ?? {};
  const pricing: Pricing = {
    baseFare: num(pd.baseFare, 8),
    pricePerKm: num(pd.pricePerKm, 4.5),
    minimumFare: num(pd.minimumFare, 12),
    deliveryMarkup: num(pd.deliveryMarkup, 1.2),
    waitingPrice: num(pd.waitingPrice, 30),
    currency: str(pd.currency, "EGP"),
  };

  const cd = configDoc.data() ?? {};
  const config: Config = {
    payeeName: str(cd.payeeName),
    walletNumber: str(cd.walletNumber),
    instapay: str(cd.instapay),
    instructions: str(cd.instructions),
  };

  // Defaults mirror functions/index.js — an absent doc still pays 10/10 EGP,
  // so the panel must show the same numbers rather than zeros.
  const rc = referralCfgDoc.data() ?? {};
  const referralConfig: ReferralConfig = {
    enabled: rc.enabled !== false,
    inviterReward: num(rc.inviterReward, 10),
    inviteeReward: num(rc.inviteeReward, 10),
  };

  const sc = supportCfgDoc.data() ?? {};
  const supportConfig: SupportConfig = {
    emergencyPhone: str(sc.emergencyPhone),
    supportPhone: str(sc.supportPhone),
    supportEmail: str(sc.supportEmail),
  };

  return { drivers, settlements, offers, riders, rides, compounds, redemptions, referrals, cases, caseNotes, pricing, config, referralConfig, supportConfig };
}

function mapRide(
  doc: Doc,
  nameOf: (uid: string | null | undefined) => string,
  compoundName: Map<string, string>,
): Ride {
  const d = doc.data();
  const loc = (v: unknown): string => {
    const m = v as { address?: string } | undefined;
    return str(m?.address);
  };
  const created = toDate(d.createdAt);
  return {
    id: str(d.id, doc.id),
    rider: nameOf(str(d.riderId)),
    riderId: str(d.riderId),
    driver: d.driverId ? nameOf(str(d.driverId)) : null,
    driverId: d.driverId ? str(d.driverId) : null,
    compound: compoundName.get(str(d.compoundId)) ?? str(d.compoundId),
    status: (str(d.status, "requested") as RideStatus) || "requested",
    type: str(d.type) === "delivery" ? "delivery" : "ride",
    distanceKm: num(d.distanceKm),
    price: num(d.price),
    originalPrice: num(d.originalPrice, num(d.price)),
    appFee: num(d.appFee),
    driverNet: num(d.driverNet),
    createdAt: fmtDateTime(d.createdAt) ?? "—",
    createdAtMs: created ? created.getTime() : undefined,
    pickup: loc(d.pickup),
    dropoff: loc(d.dropoff),
    passengerCount: num(d.passengerCount, 1),
    discount: num(d.discount),
    offerCode: d.offerCode ? str(d.offerCode) : null,
    waitingFee: num(d.waitingFee),
    rating: typeof d.rating === "number" ? d.rating : null,
    review: d.review ? str(d.review) : null,
    itemNote: d.itemNote ? str(d.itemNote) : null,
    cancelledBy: d.cancelledBy ? str(d.cancelledBy) : null,
    cancelReason: d.cancelReason ? str(d.cancelReason) : null,
  };
}
