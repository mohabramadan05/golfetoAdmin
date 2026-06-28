export type Screen =
  | "dashboard"
  | "settlements"
  | "drivers"
  | "live"
  | "history"
  | "riders"
  | "offers"
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
  hasLicense: boolean;
  hasRecord: boolean;
  licenseImageUrl?: string | null;
  criminalRecordUrl?: string | null;
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
  driver: string | null;
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

export interface DrawerState {
  type: "settlement" | "driver" | "ride";
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
  pricing: Pricing;
  config: Config;
}

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
}
