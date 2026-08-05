export type Screen =
  | "dashboard"
  | "settlements"
  | "drivers"
  | "cases"
  | "live"
  | "history"
  | "riders"
  | "offers"
  | "referrals"
  | "compounds"
  | "pricing"
  | "settings";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Driver {
  uid: string;
  name: string;
  phone: string;
  compound: string;
  approvalStatus: ApprovalStatus;
  isOnline: boolean;
  isFree: boolean;
  cartNumber: string;
  licensePlate: string;
  carType: string;
  seatNumber: number;
  ratingSum: number;
  ratingCount: number;
  totalRides: number;
  totalEarnings: number;
  settlementBlocked: boolean;
  lastSettlementAt: string | null;
  strikesCount: number;
  isBlocked: boolean;
  hasLicense: boolean;
  hasRecord: boolean;
  licenseImageUrl?: string | null;
  criminalRecordUrl?: string | null;
  // Extended onboarding — the driver app collects all of these at signup.
  dob: string | null;
  city: string;
  driverPhotoUrl?: string | null;
  idImageUrl?: string | null;
  carImageUrl?: string | null;
  /// The driver ticked "my information is accurate" / "I accept the terms".
  infoConfirmed: boolean;
  termsAccepted: boolean;
  joined: string;
}

export type SettlementStatus = "pending" | "submitted" | "approved" | "rejected";

export interface Settlement {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  weekId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  totalRides: number;
  grossEarnings: number;
  appFeeOwed: number;
  driverNet: number;
  amountSent: number;
  referenceNumber: string;
  hasProof: boolean;
  proofImageUrl?: string | null;
  status: SettlementStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
}

export interface Rider {
  uid: string;
  name: string;
  phone: string;
  compound: string;
  createdAt: string;
  language: "ar" | "en";
  rides: number;
  spent: number;
  walletBalance: number;
  /// The rider's own invite code, and who invited them (blank when neither).
  referralCode: string;
  referredByName: string | null;
}

export type ReferralStatus = "pending" | "rewarded";

/** One invite relationship. Paid only after the invitee's first completed ride. */
export interface Referral {
  id: string;
  inviterUid: string;
  inviterName: string;
  inviteeUid: string;
  inviteeName: string;
  code: string;
  status: ReferralStatus;
  inviterReward: number;
  inviteeReward: number;
  createdAt: string;
  createdAtMs?: number;
  rewardedAt: string | null;
}

export interface Compound {
  id: string;
  name: string;
  city: string;
  isActive: boolean;
  centerLat: number;
  centerLng: number;
  radius: number;
  drivers: number;
  activeRides: number;
}

export interface Offer {
  id: string;
  code: string;
  title: string;
  description: string;
  type: "percent" | "fixed";
  value: number;
  maxDiscount: number | null;
  minFare: number;
  active: boolean;
  startsAt: string;
  expiresAt: string;
  usageLimit: number | null;
  perUserLimit: number;
  compound: string;
  usedCount: number;
}

export interface Redemption {
  code: string;
  rider: string;
  rideId: string;
  discount: number;
  status: "applied" | "released";
  createdAt: string;
}

export type RideStatus =
  | "requested"
  | "accepted"
  | "enRoute"
  | "arrived"
  | "inProgress"
  | "completed"
  | "cancelled"
  | "expired"
  | "rejected";

export interface Ride {
  id: string;
  rider: string;
  riderId?: string;
  driver: string | null;
  driverId?: string | null;
  compound: string;
  status: RideStatus;
  type: "ride" | "delivery";
  distanceKm: number;
  price: number;
  originalPrice: number;
  appFee: number;
  driverNet: number;
  createdAt: string;
  createdAtMs?: number;
  pickup: string;
  dropoff: string;
  passengerCount: number;
  discount: number;
  offerCode: string | null;
  waitingFee: number;
  rating: number | null;
  review: string | null;
  itemNote: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  arrivedAt?: string;
}

export interface Pricing {
  baseFare: number;
  pricePerKm: number;
  minimumFare: number;
  deliveryMarkup: number;
  waitingPrice: number;
  currency: string;
}

export interface Config {
  payeeName: string;
  walletNumber: string;
  instapay: string;
  instructions: string;
}

/** `app_config/referral` — read by both the app and the payout Cloud Function,
 *  so what's advertised in the invite screen is what actually gets credited. */
export interface ReferralConfig {
  enabled: boolean;
  inviterReward: number;
  inviteeReward: number;
}

/** `app_config/support` — powers the rider app's Safety screen SOS button. */
export interface SupportConfig {
  emergencyPhone: string;
  supportPhone: string;
  supportEmail: string;
}

export type CaseSource = "email" | "manual" | "rider";
export type CaseCategory =
  | "route_dispute"
  | "billing_dispute"
  | "driver_behavior"
  | "vehicle_condition"
  | "safety"
  | "other";
export type CasePriority = "low" | "medium" | "high" | "critical";
export type CaseStatus = "new" | "under_investigation" | "resolved";

export interface CaseNote {
  id: string;
  caseId: string;
  adminId: string;
  adminName: string;
  noteText: string;
  createdAt: string;
  createdAtMs?: number;
}

export interface Case {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  driverId: string;
  driverName: string;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  source: CaseSource;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  passengerComplaintText: string;
  resolutionSummary: string | null;
  strikeIssued: boolean;
  refundAmount: number;
  createdAt: string;
  createdAtMs?: number;
  updatedAt: string | null;
}

export interface DrawerState {
  type: "settlement" | "driver" | "ride" | "case";
  id: string;
}

export interface AdminData {
  drivers: Driver[];
  settlements: Settlement[];
  offers: Offer[];
  riders: Rider[];
  rides: Ride[];
  compounds: Compound[];
  redemptions: Redemption[];
  referrals: Referral[];
  cases: Case[];
  caseNotes: CaseNote[];
  pricing: Pricing;
  config: Config;
  referralConfig: ReferralConfig;
  supportConfig: SupportConfig;
}

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
}
