import {
  seedCompounds,
  seedDrivers,
  seedOffers,
  seedRedemptions,
  seedRides,
  seedRiders,
  seedSettlements,
} from "./seed";
import type { AdminData } from "./types";

/** Seed-data snapshot used when Firebase isn't configured yet (demo mode). */
export function demoData(): AdminData {
  // Spread the seed rides across the last 7 days so the dashboard charts/period
  // metrics have realistic timestamps in demo mode.
  const DAY = 86_400_000;
  const rides = seedRides().map((r, i) => ({ ...r, createdAtMs: Date.now() - (i % 7) * DAY }));
  return {
    drivers: seedDrivers(),
    settlements: seedSettlements(),
    offers: seedOffers(),
    riders: seedRiders(),
    rides,
    compounds: seedCompounds(),
    redemptions: seedRedemptions(),
    pricing: {
      baseFare: 8,
      pricePerKm: 4.5,
      minimumFare: 12,
      deliveryMarkup: 1.2,
      waitingPrice: 30,
      currency: "EGP",
    },
    config: {
      payeeName: "Golfeto Mobility LLC",
      walletNumber: "010 2244 8890",
      instapay: "golfeto@instapay",
      instructions:
        "Send the EXACT app-fee amount shown above to the wallet/InstaPay. Keep the transfer receipt, then upload a clear screenshot here. Settlements are reviewed within 24h. Short or missing payments will be rejected and may block you from going online.",
    },
  };
}
