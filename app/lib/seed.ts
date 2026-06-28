import type {
  Compound,
  Driver,
  Offer,
  Redemption,
  Ride,
  Rider,
  Settlement,
} from "./types"; 

export function seedDrivers(): Driver[] {
  return [
    { uid: "d1", name: "Mahmoud Sobhy", phone: "+20 101 224 8890", compound: "Madinaty", approvalStatus: "pending", isOnline: false, isFree: true, cartNumber: "C-114", licensePlate: "ص د 4821", carType: "EZGO RXV", seatNumber: 4, ratingSum: 0, ratingCount: 0, totalRides: 0, totalEarnings: 0, settlementBlocked: false, lastSettlementAt: null, hasLicense: true, hasRecord: true, joined: "Jun 26, 2026" },
    { uid: "d2", name: "Karim El-Gohary", phone: "+20 109 778 4412", compound: "Mivida", approvalStatus: "pending", isOnline: false, isFree: true, cartNumber: "C-209", licensePlate: "ب ر 7730", carType: "Club Car Onward", seatNumber: 6, ratingSum: 0, ratingCount: 0, totalRides: 0, totalEarnings: 0, settlementBlocked: false, lastSettlementAt: null, hasLicense: true, hasRecord: false, joined: "Jun 27, 2026" },
    { uid: "d3", name: "Tarek Mansour", phone: "+20 100 559 2031", compound: "Mountain View iCity", approvalStatus: "approved", isOnline: true, isFree: false, cartNumber: "C-031", licensePlate: "ع ف 1190", carType: "EZGO RXV", seatNumber: 4, ratingSum: 1184, ratingCount: 248, totalRides: 251, totalEarnings: 18420, settlementBlocked: false, lastSettlementAt: "Jun 20, 2026", hasLicense: true, hasRecord: true, joined: "Feb 11, 2026" },
    { uid: "d4", name: "Hossam Adel", phone: "+20 122 401 7765", compound: "Madinaty", approvalStatus: "approved", isOnline: true, isFree: true, cartNumber: "C-077", licensePlate: "س ن 3344", carType: "Yamaha Drive2", seatNumber: 4, ratingSum: 903, ratingCount: 189, totalRides: 194, totalEarnings: 14100, settlementBlocked: false, lastSettlementAt: "Jun 20, 2026", hasLicense: true, hasRecord: true, joined: "Mar 2, 2026" },
    { uid: "d5", name: "Sherif Naguib", phone: "+20 111 882 3019", compound: "Palm Hills", approvalStatus: "approved", isOnline: false, isFree: true, cartNumber: "C-152", licensePlate: "ق م 9087", carType: "Club Car Onward", seatNumber: 6, ratingSum: 612, ratingCount: 131, totalRides: 138, totalEarnings: 11260, settlementBlocked: true, lastSettlementAt: "Jun 6, 2026", hasLicense: true, hasRecord: true, joined: "Jan 28, 2026" },
    { uid: "d6", name: "Amir Fouad", phone: "+20 128 330 5567", compound: "Katameya Heights", approvalStatus: "approved", isOnline: false, isFree: true, cartNumber: "C-198", licensePlate: "د ل 2218", carType: "EZGO Express", seatNumber: 6, ratingSum: 489, ratingCount: 104, totalRides: 109, totalEarnings: 8640, settlementBlocked: false, lastSettlementAt: "Jun 20, 2026", hasLicense: true, hasRecord: true, joined: "Apr 9, 2026" },
    { uid: "d7", name: "Walid Ezzat", phone: "+20 115 667 1204", compound: "Mivida", approvalStatus: "rejected", isOnline: false, isFree: true, cartNumber: "C-061", licensePlate: "ر ه 5540", carType: "Yamaha Drive2", seatNumber: 4, ratingSum: 0, ratingCount: 0, totalRides: 0, totalEarnings: 0, settlementBlocked: false, lastSettlementAt: null, hasLicense: true, hasRecord: true, joined: "Jun 18, 2026" },
  ];
}

export function seedSettlements(): Settlement[] {
  return [
    { id: "d3_2026-06-26", driverId: "d3", driverName: "Tarek Mansour", driverPhone: "+20 100 559 2031", weekId: "2026-06-26", periodStart: "Jun 20", periodEnd: "Jun 26", dueDate: "Jun 28", totalRides: 58, grossEarnings: 4180, appFeeOwed: 627, driverNet: 3553, amountSent: 627, referenceNumber: "INSTA-9920451", hasProof: true, status: "submitted", submittedAt: "Jun 27, 08:14", reviewedAt: null, reviewedBy: null, rejectionReason: null },
    { id: "d4_2026-06-26", driverId: "d4", driverName: "Hossam Adel", driverPhone: "+20 122 401 7765", weekId: "2026-06-26", periodStart: "Jun 20", periodEnd: "Jun 26", dueDate: "Jun 28", totalRides: 41, grossEarnings: 2960, appFeeOwed: 444, driverNet: 2516, amountSent: 400, referenceNumber: "WALLET-77310", hasProof: true, status: "submitted", submittedAt: "Jun 27, 10:02", reviewedAt: null, reviewedBy: null, rejectionReason: null },
    { id: "d6_2026-06-26", driverId: "d6", driverName: "Amir Fouad", driverPhone: "+20 128 330 5567", weekId: "2026-06-26", periodStart: "Jun 20", periodEnd: "Jun 26", dueDate: "Jun 28", totalRides: 33, grossEarnings: 2410, appFeeOwed: 361.5, driverNet: 2048.5, amountSent: 361.5, referenceNumber: "INSTA-4471092", hasProof: true, status: "submitted", submittedAt: "Jun 27, 11:47", reviewedAt: null, reviewedBy: null, rejectionReason: null },
    { id: "d5_2026-06-26", driverId: "d5", driverName: "Sherif Naguib", driverPhone: "+20 111 882 3019", weekId: "2026-06-26", periodStart: "Jun 20", periodEnd: "Jun 26", dueDate: "Jun 28", totalRides: 29, grossEarnings: 2080, appFeeOwed: 312, driverNet: 1768, amountSent: 0, referenceNumber: "", hasProof: false, status: "pending", submittedAt: null, reviewedAt: null, reviewedBy: null, rejectionReason: null },
    { id: "d3_2026-06-19", driverId: "d3", driverName: "Tarek Mansour", driverPhone: "+20 100 559 2031", weekId: "2026-06-19", periodStart: "Jun 13", periodEnd: "Jun 19", dueDate: "Jun 21", totalRides: 52, grossEarnings: 3740, appFeeOwed: 561, driverNet: 3179, amountSent: 561, referenceNumber: "INSTA-8820113", hasProof: true, status: "approved", submittedAt: "Jun 20, 09:30", reviewedAt: "Jun 20, 14:12", reviewedBy: "Rana Adel", rejectionReason: null },
    { id: "d4_2026-06-19", driverId: "d4", driverName: "Hossam Adel", driverPhone: "+20 122 401 7765", weekId: "2026-06-19", periodStart: "Jun 13", periodEnd: "Jun 19", dueDate: "Jun 21", totalRides: 38, grossEarnings: 2720, appFeeOwed: 408, driverNet: 2312, amountSent: 300, referenceNumber: "WALLET-55021", hasProof: true, status: "rejected", submittedAt: "Jun 20, 12:00", reviewedAt: "Jun 20, 16:40", reviewedBy: "Rana Adel", rejectionReason: "Amount sent (E£300) is short of the E£408 owed. Please send the remaining E£108 and re-upload the receipt." },
  ];
}

export function seedRiders(): Rider[] {
  return [
    { uid: "r1", name: "Youssef Hany", phone: "+20 100 112 4456", compound: "Madinaty", createdAt: "Apr 12, 2026", language: "ar", rides: 34, spent: 1290 },
    { uid: "r2", name: "Mariam Adel", phone: "+20 122 887 6610", compound: "Mountain View iCity", createdAt: "May 3, 2026", language: "en", rides: 21, spent: 842 },
    { uid: "r3", name: "Omar Khaled", phone: "+20 109 554 2231", compound: "Mivida", createdAt: "Feb 19, 2026", language: "ar", rides: 58, spent: 2410 },
    { uid: "r4", name: "Salma Tarek", phone: "+20 111 330 9087", compound: "Madinaty", createdAt: "Jun 1, 2026", language: "en", rides: 9, spent: 318 },
    { uid: "r5", name: "Ahmed Fathy", phone: "+20 128 776 5540", compound: "Palm Hills", createdAt: "Mar 27, 2026", language: "ar", rides: 47, spent: 1980 },
    { uid: "r6", name: "Laila Mostafa", phone: "+20 115 220 1199", compound: "Katameya Heights", createdAt: "May 22, 2026", language: "ar", rides: 16, spent: 604 },
    { uid: "r7", name: "Karim Sobhy", phone: "+20 101 998 3320", compound: "Mivida", createdAt: "Jun 18, 2026", language: "en", rides: 4, spent: 142 },
    { uid: "r8", name: "Nour El-Din", phone: "+20 106 445 7781", compound: "Madinaty", createdAt: "Jan 30, 2026", language: "ar", rides: 72, spent: 3120 },
  ];
}

export function seedCompounds(): Compound[] {
  return [
    { id: "c1", name: "Madinaty", city: "New Cairo", isActive: true, centerLat: 30.103, centerLng: 31.642, radius: 2600, drivers: 9, activeRides: 4 },
    { id: "c2", name: "Mountain View iCity", city: "New Cairo", isActive: true, centerLat: 30.045, centerLng: 31.611, radius: 1800, drivers: 6, activeRides: 2 },
    { id: "c3", name: "Mivida", city: "New Cairo", isActive: true, centerLat: 30.02, centerLng: 31.52, radius: 1500, drivers: 5, activeRides: 2 },
    { id: "c4", name: "Palm Hills", city: "6th of October", isActive: true, centerLat: 29.975, centerLng: 30.945, radius: 2200, drivers: 4, activeRides: 1 },
    { id: "c5", name: "Katameya Heights", city: "New Cairo", isActive: false, centerLat: 30.0, centerLng: 31.43, radius: 2000, drivers: 2, activeRides: 0 },
  ];
}

export function seedOffers(): Offer[] {
  return [
    { id: "o1", code: "GOLF20", title: "20% off your ride", description: "Save 20% on any ride this week", type: "percent", value: 20, maxDiscount: 15, minFare: 20, active: true, startsAt: "Jun 22", expiresAt: "Jun 29", usageLimit: 1000, perUserLimit: 1, compound: "All compounds", usedCount: 412 },
    { id: "o2", code: "WELCOME", title: "E£10 welcome credit", description: "First ride discount for new riders", type: "fixed", value: 10, maxDiscount: null, minFare: 15, active: true, startsAt: "Jun 1", expiresAt: "Jul 31", usageLimit: null, perUserLimit: 1, compound: "All compounds", usedCount: 188 },
    { id: "o3", code: "MADINATY15", title: "Madinaty 15% off", description: "Compound-only promo", type: "percent", value: 15, maxDiscount: 12, minFare: 0, active: true, startsAt: "Jun 15", expiresAt: "Jun 30", usageLimit: 500, perUserLimit: 2, compound: "Madinaty", usedCount: 97 },
    { id: "o4", code: "EID25", title: "Eid 25% off", description: "Holiday promo (ended)", type: "percent", value: 25, maxDiscount: 15, minFare: 25, active: false, startsAt: "May 1", expiresAt: "May 10", usageLimit: 800, perUserLimit: 1, compound: "All compounds", usedCount: 800 },
  ];
}

export function seedRedemptions(): Redemption[] {
  return [
    { code: "GOLF20", rider: "Youssef Hany", rideId: "RD-8841", discount: 9, status: "applied", createdAt: "Jun 27, 14:22" },
    { code: "WELCOME", rider: "Karim Sobhy", rideId: "RD-8830", discount: 10, status: "applied", createdAt: "Jun 27, 11:04" },
    { code: "GOLF20", rider: "Salma Tarek", rideId: "RD-8809", discount: 7.5, status: "released", createdAt: "Jun 26, 19:50" },
    { code: "MADINATY15", rider: "Nour El-Din", rideId: "RD-8795", discount: 6, status: "applied", createdAt: "Jun 26, 16:31" },
  ];
}

export function seedRides(): Ride[] {
  const mk = (o: Partial<Ride> & Pick<Ride, "id" | "rider" | "compound" | "status" | "distanceKm" | "price" | "originalPrice" | "appFee" | "driverNet" | "createdAt" | "pickup" | "dropoff">): Ride => ({
    type: "ride",
    passengerCount: 1,
    discount: 0,
    offerCode: null,
    waitingFee: 0,
    rating: null,
    review: null,
    itemNote: null,
    cancelledBy: null,
    cancelReason: null,
    driver: null,
    ...o,
  });
  return [
    // live
    mk({ id: "RD-8861", rider: "Mariam Adel", driver: "Tarek Mansour", compound: "Mountain View iCity", status: "inProgress", distanceKm: 2.4, price: 18.5, originalPrice: 18.5, appFee: 2.78, driverNet: 15.72, createdAt: "2 min ago", pickup: "Club House", dropoff: "Gate 4 Villas", passengerCount: 2 }),
    mk({ id: "RD-8860", rider: "Omar Khaled", driver: "Hossam Adel", compound: "Madinaty", status: "enRoute", distanceKm: 1.8, price: 15, originalPrice: 15, appFee: 2.25, driverNet: 12.75, createdAt: "4 min ago", pickup: "Craft Zone", dropoff: "B6 Residences" }),
    mk({ id: "RD-8859", rider: "Ahmed Fathy", driver: "Sherif Naguib", compound: "Palm Hills", status: "arrived", distanceKm: 3.1, price: 22, originalPrice: 22, appFee: 3.3, driverNet: 18.7, createdAt: "6 min ago", pickup: "Palm Strip", dropoff: "Lake View" }),
    mk({ id: "RD-8858", rider: "Salma Tarek", driver: null, compound: "Madinaty", status: "requested", distanceKm: 2.0, price: 16, originalPrice: 16, appFee: 2.4, driverNet: 13.6, createdAt: "just now", pickup: "South Park", dropoff: "Gate 1" }),
    mk({ id: "RD-8857", rider: "Laila Mostafa", driver: null, compound: "Katameya Heights", status: "requested", distanceKm: 1.2, price: 12, originalPrice: 12, appFee: 1.8, driverNet: 10.2, createdAt: "1 min ago", pickup: "Sports Club", dropoff: "C Zone" }),
    mk({ id: "RD-8856", rider: "Karim Sobhy", driver: "Amir Fouad", compound: "Mivida", status: "accepted", type: "delivery", distanceKm: 2.6, price: 24, originalPrice: 24, appFee: 3.6, driverNet: 20.4, createdAt: "3 min ago", pickup: "Mivida Mall", dropoff: "Parcel 12", itemNote: "2 grocery bags — leave at door" }),
    // history
    mk({ id: "RD-8855", rider: "Youssef Hany", driver: "Tarek Mansour", compound: "Madinaty", status: "completed", distanceKm: 2.4, originalPrice: 20, discount: 9, offerCode: "GOLF20", price: 11, appFee: 2, driverNet: 17, createdAt: "Jun 27, 14:22", arrivedAt: "Jun 27, 14:25", pickup: "Open Air Mall", dropoff: "D2 Villas", rating: 5, review: "Very smooth ride, polite driver." }),
    mk({ id: "RD-8854", rider: "Nour El-Din", driver: "Hossam Adel", compound: "Madinaty", status: "completed", distanceKm: 3.8, originalPrice: 25, price: 25, appFee: 3.75, driverNet: 21.25, waitingFee: 5, createdAt: "Jun 27, 13:10", pickup: "Gate 1", dropoff: "Golf Clubhouse", passengerCount: 3, rating: 4, review: "Slight wait but good." }),
    mk({ id: "RD-8853", rider: "Omar Khaled", driver: "Amir Fouad", compound: "Mivida", status: "cancelled", distanceKm: 0, originalPrice: 14, price: 14, appFee: 0, driverNet: 0, createdAt: "Jun 27, 12:40", pickup: "Mivida Mall", dropoff: "Parcel 5", cancelledBy: "rider", cancelReason: "Found a closer cart" }),
    mk({ id: "RD-8852", rider: "Ahmed Fathy", driver: "Sherif Naguib", compound: "Palm Hills", status: "completed", distanceKm: 1.6, originalPrice: 13, price: 13, appFee: 1.95, driverNet: 11.05, createdAt: "Jun 27, 11:55", pickup: "Palm Strip", dropoff: "Club", rating: 5, review: null }),
    mk({ id: "RD-8851", rider: "Karim Sobhy", driver: "Tarek Mansour", compound: "Mountain View iCity", status: "completed", type: "delivery", distanceKm: 2.9, originalPrice: 28, discount: 10, offerCode: "WELCOME", price: 18, appFee: 2.8, driverNet: 25.2, createdAt: "Jun 27, 11:04", pickup: "iCity Hub", dropoff: "Block 9", itemNote: "Pharmacy order", rating: 5, review: "Fast delivery!" }),
    mk({ id: "RD-8850", rider: "Laila Mostafa", driver: null, compound: "Katameya Heights", status: "expired", distanceKm: 0, originalPrice: 15, price: 15, appFee: 0, driverNet: 0, createdAt: "Jun 27, 10:20", pickup: "Sports Club", dropoff: "A Zone" }),
    mk({ id: "RD-8849", rider: "Mariam Adel", driver: "Hossam Adel", compound: "Madinaty", status: "completed", distanceKm: 2.1, originalPrice: 17, price: 17, appFee: 2.55, driverNet: 14.45, createdAt: "Jun 26, 21:30", pickup: "Gate 4", dropoff: "Club House", rating: 3, review: "Cart was a bit slow." }),
  ];
}
