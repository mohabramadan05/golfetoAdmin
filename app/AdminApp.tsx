"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties } from "react";
import type {
  AdminData,
  AdminUser,
  Config,
  Driver,
  DrawerState,
  Offer,
  Pricing,
  Screen,
  Settlement,
} from "./lib/types";
import { avatar, C, Chip, hexA, Icon, initials, money } from "./lib/ui";
import {
  approveDriver as approveDriverAction,
  approveSettlement as approveSettlementAction,
  createOffer as createOfferAction,
  refreshData as refreshDataAction,
  rejectDriver as rejectDriverAction,
  rejectSettlement as rejectSettlementAction,
  saveConfig as saveConfigAction,
  savePricing as savePricingAction,
  setDriverActive as setDriverActiveAction,
  toggleOffer as toggleOfferAction,
  type ActionResult,
} from "./actions";

const CARD: CSSProperties = {
  background: "#1A1A1A",
  border: "1px solid #2A2A2A",
  borderRadius: "14px",
};
const HEAD_CELL: CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#6E6E6E",
  textTransform: "uppercase",
  letterSpacing: ".4px",
};
const GRAD = "linear-gradient(135deg,#1A3FD4,#2E8BFF 60%,#00C2FF)";

const NAV: { key: Screen; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "settlements", label: "Settlements", icon: "settlement" },
  { key: "drivers", label: "Drivers", icon: "driver" },
  { key: "live", label: "Live Rides", icon: "live" },
  { key: "history", label: "Ride History", icon: "history" },
  { key: "riders", label: "Riders", icon: "rider" },
  { key: "offers", label: "Offers", icon: "offer" },
  { key: "compounds", label: "Compounds", icon: "compound" },
  { key: "pricing", label: "Pricing", icon: "pricing" },
  { key: "settings", label: "Settings", icon: "settings" },
];

const TITLES: Record<Screen, [string, string]> = {
  dashboard: ["Dashboard", "Operational snapshot · Cairo compounds"],
  settlements: ["Settlements", "Weekly app-fee review queue"],
  drivers: ["Drivers", "Approval queue & driver directory"],
  live: ["Live Rides", "Rides in progress right now"],
  history: ["Ride History", "Completed & cancelled rides"],
  riders: ["Riders", "Customer directory"],
  offers: ["Offers", "Promo codes & redemptions"],
  compounds: ["Compounds", "Geofenced operating areas"],
  pricing: ["Pricing", "Global fare formula"],
  settings: ["Settings", "Settlement configuration"],
};

export default function AdminApp({
  initialData,
  user,
  configured,
}: {
  initialData: AdminData;
  user: AdminUser;
  configured: boolean;
}) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [rejectDraft, setRejectDraft] = useState("");
  const [calcDist, setCalcDist] = useState("3.2");
  const [calcType, setCalcType] = useState<"ride" | "delivery">("ride");
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState<boolean>(false);

  const [settleTab, setSettleTab] = useState("submitted");
  const [driverTab, setDriverTab] = useState("all");
  const [histType, setHistType] = useState("all");

  const [drivers, setDrivers] = useState<Driver[]>(initialData.drivers);
  const [settlements, setSettlements] = useState<Settlement[]>(initialData.settlements);
  const [offers, setOffers] = useState<Offer[]>(initialData.offers);
  const [pricing, setPricing] = useState<Pricing>(initialData.pricing);
  const [config, setConfig] = useState<Config>(initialData.config);

  const [riders, setRiders] = useState(initialData.riders);
  const [rides, setRides] = useState(initialData.rides);
  const [compounds, setCompounds] = useState(initialData.compounds);
  const [redemptions, setRedemptions] = useState(initialData.redemptions);

  const [offerDraft, setOfferDraft] = useState({ code: "", title: "", type: "percent", value: "", maxDiscount: "", perUser: "1" });
  const [refreshing, setRefreshing] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  /** Runs a server action when live; surfaces any error as a toast. No-op in demo mode. */
  function sync(action: () => Promise<ActionResult>) {
    if (!configured) return;
    action()
      .then((r) => {
        if (!r.ok) showToast(r.error ?? "Save failed");
      })
      .catch(() => showToast("Save failed"));
  }

  async function logout() {
    if (!configured) return;
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  /** Re-fetches live data and updates only the slice(s) the current screen uses. */
  async function refresh() {
    if (refreshing) return;
    if (!configured) {
      showToast("Demo mode — live refresh is disabled");
      return;
    }
    setRefreshing(true);
    try {
      const d = await refreshDataAction();
      switch (screen) {
        case "dashboard":
          setDrivers(d.drivers);
          setSettlements(d.settlements);
          setRides(d.rides);
          break;
        case "settlements":
          setSettlements(d.settlements);
          break;
        case "drivers":
          setDrivers(d.drivers);
          break;
        case "live":
        case "history":
          setRides(d.rides);
          break;
        case "riders":
          setRiders(d.riders);
          break;
        case "offers":
          setOffers(d.offers);
          setRedemptions(d.redemptions);
          break;
        case "compounds":
          setCompounds(d.compounds);
          break;
        case "pricing":
          setPricing(d.pricing);
          break;
        case "settings":
          setConfig(d.config);
          break;
      }
      showToast("Refreshed · " + TITLES[screen][0]);
    } catch {
      showToast("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  function goto(s: Screen) {
    setScreen(s);
    setDrawer(null);
  }
  function openDrawer(type: DrawerState["type"], id: string) {
    setDrawer({ type, id });
    setRejectDraft("");
    setZoomImg(null);
  }
  const closeDrawer = () => setDrawer(null);

  // ---- actions ----
  function approveSettlement(id: string) {
    setSettlements((list) =>
      list.map((x) =>
        x.id === id
          ? { ...x, status: "approved", reviewedAt: "just now", reviewedBy: user.name }
          : x,
      ),
    );
    setDrawer(null);
    sync(() => approveSettlementAction(id));
    showToast("Settlement approved · driver unblocked by Cloud Function");
  }
  function rejectSettlement(id: string) {
    const reason = rejectDraft.trim() || "Payment could not be verified.";
    setSettlements((list) =>
      list.map((x) =>
        x.id === id
          ? { ...x, status: "rejected", reviewedAt: "just now", reviewedBy: user.name, rejectionReason: reason }
          : x,
      ),
    );
    setDrawer(null);
    sync(() => rejectSettlementAction(id, reason));
    showToast("Settlement rejected · driver notified to re-upload");
  }
  function approveDriver(id: string) {
    setDrivers((l) => l.map((x) => (x.uid === id ? { ...x, approvalStatus: "approved" } : x)));
    setDrawer(null);
    sync(() => approveDriverAction(id));
    showToast("Driver approved");
  }
  function rejectDriver(id: string) {
    setDrivers((l) => l.map((x) => (x.uid === id ? { ...x, approvalStatus: "rejected" } : x)));
    setDrawer(null);
    sync(() => rejectDriverAction(id));
    showToast("Driver application rejected");
  }
  function setDriverActive(id: string, active: boolean) {
    setDrivers((l) =>
      l.map((x) => (x.uid === id ? { ...x, approvalStatus: active ? "approved" : "rejected" } : x)),
    );
    sync(() => setDriverActiveAction(id, active));
    showToast(active ? "Driver reactivated" : "Driver deactivated");
  }

  const pendingDrivers = drivers.filter((d) => d.approvalStatus === "pending").length;
  const subSettlements = settlements.filter((s) => s.status === "submitted").length;
  const [title, subtitle] = TITLES[screen];

  const tabBtn = (active: boolean): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "7px 14px",
    borderRadius: "9px",
    border: "1px solid " + (active ? hexA(C.bright, 0.4) : "#2A2A2A"),
    cursor: "pointer",
    fontSize: "12.5px",
    fontWeight: 700,
    background: active ? hexA(C.bright, 0.14) : "#1A1A1A",
    color: active ? C.light : "#9A9A9A",
  });
  const tabCount = (active: boolean): CSSProperties => ({
    fontSize: "10.5px",
    fontWeight: 800,
    padding: "1px 7px",
    borderRadius: "9px",
    background: active ? hexA(C.bright, 0.25) : "#2A2A2A",
    color: active ? C.light : "#8A8A8A",
  });

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        fontFamily: "var(--font-cairo), sans-serif",
        background: "#121212",
        color: "#F2F2F2",
        fontSize: "13px",
      }}
    >
      {/* ===== SIDEBAR ===== */}
      <aside
        style={{
          width: "236px",
          flexShrink: 0,
          background: "#161616",
          borderRight: "1px solid #2A2A2A",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "18px 20px 16px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "linear-gradient(135deg,#1A3FD4,#2E8BFF 55%,#00C2FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(46,139,255,.35)",
            }}
          >
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2.5px solid #fff" }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "-.3px", lineHeight: 1 }}>Golfeto</div>
            <div style={{ fontSize: "10px", color: "#6E6E6E", fontWeight: 600, letterSpacing: ".4px", marginTop: "3px" }}>
              ADMIN PANEL
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "6px 12px" }}>
          {NAV.map((item) => {
            const active = screen === item.key;
            const badge =
              item.key === "settlements"
                ? subSettlements || null
                : item.key === "drivers"
                  ? pendingDrivers || null
                  : null;
            return (
              <div
                key={item.key}
                onClick={() => goto(item.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  marginBottom: "2px",
                  fontSize: "13px",
                  fontWeight: active ? 700 : 600,
                  color: active ? "#fff" : "#9A9A9A",
                  background: active
                    ? `linear-gradient(135deg,${hexA(C.deep, 0.9)},${hexA(C.bright, 0.85)})`
                    : "transparent",
                  boxShadow: active ? "0 4px 14px " + hexA(C.bright, 0.3) : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                  <Icon name={item.icon} size={18} color={active ? "#fff" : "#8A8A8A"} width={active ? 2.1 : 1.85} />
                  <span>{item.label}</span>
                </div>
                {badge && (
                  <span
                    style={{
                      minWidth: "19px",
                      height: "19px",
                      borderRadius: "10px",
                      background: active ? "rgba(255,255,255,.25)" : C.amber,
                      color: active ? "#fff" : "#1a1200",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 5px",
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        <div
          style={{
            padding: "12px 14px",
            borderTop: "1px solid #2A2A2A",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg,#2E8BFF,#00C2FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "13px",
              color: "#08183a",
            }}
          >
            {initials(user.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "12.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name}
            </div>
            <div style={{ fontSize: "10.5px", color: "#6E6E6E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {configured ? user.email || "Administrator" : "Demo mode"}
            </div>
          </div>
          {configured ? (
            <button
              onClick={logout}
              title="Sign out"
              style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#1E1E1E", border: "1px solid #333", color: "#A0A0A0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              ⎋
            </button>
          ) : (
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FFA726", boxShadow: "0 0 8px #FFA726" }} title="Demo mode — Firebase not configured" />
          )}
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        {/* TOPBAR */}
        <header
          style={{
            height: "60px",
            flexShrink: 0,
            borderBottom: "1px solid #2A2A2A",
            background: "#161616",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "0 24px",
          }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-.2px", lineHeight: 1.1 }}>{title}</div>
            <div style={{ fontSize: "11px", color: "#6E6E6E", marginTop: "2px" }}>{subtitle}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ position: "relative", width: "300px", maxWidth: "34vw" }}>
            <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6E6E6E" }}>
              <Icon name="search" size={16} color="#6E6E6E" />
            </div>
            <input
              placeholder="Search riders, drivers, plates, codes…"
              style={{
                width: "100%",
                height: "38px",
                background: "#1E1E1E",
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "0 12px 0 36px",
                color: "#F2F2F2",
                fontSize: "12.5px",
                outline: "none",
              }}
            />
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            title="Refresh this page"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "#1E1E1E",
              border: "1px solid #333",
              color: "#A0A0A0",
              cursor: refreshing ? "default" : "pointer",
              opacity: refreshing ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ display: "inline-flex", animation: refreshing ? "spin 0.8s linear infinite" : "none" }}>
              <Icon name="refresh" size={17} color="#A0A0A0" />
            </span>
          </button>
          <button
            style={{
              position: "relative",
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "#1E1E1E",
              border: "1px solid #333",
              color: "#A0A0A0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="bell" size={17} color="#A0A0A0" />
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                minWidth: "17px",
                height: "17px",
                borderRadius: "9px",
                background: "#EF4444",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                border: "2px solid #161616",
              }}
            >
              {subSettlements + pendingDrivers}
            </span>
          </button>
        </header>

        {/* CONTENT */}
        <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          <div style={{ padding: "22px 24px 60px", maxWidth: "1500px" }}>
            {screen === "dashboard" && renderDashboard()}
            {screen === "settlements" && renderSettlements()}
            {screen === "drivers" && renderDrivers()}
            {screen === "live" && renderLive()}
            {screen === "history" && renderHistory()}
            {screen === "riders" && renderRiders()}
            {screen === "offers" && renderOffers()}
            {screen === "compounds" && renderCompounds()}
            {screen === "pricing" && renderPricing()}
            {screen === "settings" && renderSettings()}
          </div>
        </main>
      </div>

      {drawer && renderDrawer()}
      {offerForm && renderOfferForm()}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 120,
            background: "#1E1E1E",
            border: "1px solid #3A3A3A",
            borderLeft: "3px solid #1DB76A",
            borderRadius: "11px",
            padding: "13px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 12px 40px rgba(0,0,0,.5)",
            fontSize: "12.5px",
            fontWeight: 600,
          }}
        >
          <span style={{ color: C.green }}>
            <Icon name="check" size={16} color={C.green} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );

  // ===================== SCREENS =====================

  function renderDashboard() {
    const DAY = 86_400_000;
    const now = Date.now();
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const periodStart =
      period === "today" ? startToday.getTime() : period === "week" ? now - 7 * DAY : now - 30 * DAY;
    const inPeriod = (r: { createdAtMs?: number }) => r.createdAtMs === undefined || r.createdAtMs >= periodStart;

    const activeStatuses = ["requested", "accepted", "enRoute", "arrived", "inProgress"];
    const activeRides = rides.filter((r) => activeStatuses.includes(r.status));
    const awaitingDriver = activeRides.filter((r) => r.status === "requested" && !r.driver).length;
    const onlineDrivers = drivers.filter((d) => d.isOnline);
    const freeOnline = onlineDrivers.filter((d) => d.isFree).length;
    const onTrip = onlineDrivers.length - freeOnline;
    const blocked = drivers.filter((d) => d.settlementBlocked).length;

    const periodRides = rides.filter(inPeriod);
    const completedPeriod = periodRides.filter((r) => r.status === "completed");
    const appFeeRevenue = completedPeriod.reduce((a, r) => a + r.appFee, 0);
    const gmv = completedPeriod.reduce((a, r) => a + r.price, 0);
    const ridesCount = periodRides.length;
    const cancelledCount = periodRides.filter((r) => r.status === "cancelled").length;
    const cancelRate = ridesCount ? (cancelledCount / ridesCount) * 100 : 0;
    const periodWord = period === "today" ? "today" : period;

    const kpis: {
      label: string;
      icon: string;
      color: string;
      value: string;
      unit: string;
      sub: string;
      subOk: boolean;
      go?: Screen;
    }[] = [
      { label: "Active rides now", icon: "live", color: C.bright, value: String(activeRides.length), unit: "", sub: awaitingDriver + " awaiting a driver", subOk: false },
      { label: "Online drivers", icon: "driver", color: C.green, value: String(onlineDrivers.length), unit: "online", sub: freeOnline + " free · " + onTrip + " on-trip", subOk: true },
      { label: "Rides (" + periodWord + ")", icon: "route", color: C.cyan, value: String(ridesCount), unit: "", sub: "GMV " + money(Math.round(gmv)), subOk: true },
      { label: "App-fee revenue", icon: "money", color: C.light, value: money(Math.round(appFeeRevenue)), unit: "", sub: "15% of fares · company cut", subOk: true },
      { label: "Pending approvals", icon: "driver", color: C.amber, value: String(pendingDrivers), unit: "drivers", sub: "Tap to review queue →", subOk: false, go: "drivers" },
      { label: "Awaiting settlement review", icon: "settlement", color: C.amber, value: String(subSettlements), unit: "", sub: "Tap to open queue →", subOk: false, go: "settlements" },
      { label: "Cancellation rate", icon: "block", color: C.red, value: cancelRate.toFixed(1), unit: "%", sub: cancelledCount + " of " + ridesCount + " cancelled", subOk: false },
      { label: "Blocked drivers", icon: "block", color: C.red, value: String(blocked), unit: "", sub: blocked ? "Unpaid settlement" : "None blocked", subOk: blocked === 0, go: "drivers" },
    ];

    const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days: [string, number, number][] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = startToday.getTime() - i * DAY;
      const dayEnd = dayStart + DAY;
      const dayRides = rides.filter((r) => r.createdAtMs !== undefined && r.createdAtMs >= dayStart && r.createdAtMs < dayEnd);
      const rev = dayRides.filter((r) => r.status === "completed").reduce((a, r) => a + r.appFee, 0);
      days.push([WD[new Date(dayStart).getDay()], dayRides.length, Math.round(rev)]);
    }
    const maxR = Math.max(1, ...days.map((d) => d[1]));
    const maxV = Math.max(1, ...days.map((d) => d[2]));

    const compMap = new Map<string, number>();
    periodRides.forEach((r) => {
      if (r.compound) compMap.set(r.compound, (compMap.get(r.compound) ?? 0) + 1);
    });
    const comp: [string, number][] = [...compMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const cmax = Math.max(1, ...comp.map((c) => c[1]));

    const submitted = settlements.filter((s) => s.status === "submitted");
    const pending = drivers.filter((d) => d.approvalStatus === "pending");

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
          <span style={{ fontSize: "12px", color: "#6E6E6E", fontWeight: 600 }}>PERIOD</span>
          <div style={{ display: "flex", background: "#1E1E1E", border: "1px solid #333", borderRadius: "9px", padding: "3px", gap: "2px" }}>
            {(["today", "week", "month"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setPeriod(k)}
                style={{
                  padding: "5px 13px",
                  borderRadius: "7px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: period === k ? hexA(C.bright, 0.18) : "transparent",
                  color: period === k ? C.light : "#8A8A8A",
                }}
              >
                {k === "today" ? "Today" : k === "week" ? "This week" : "This month"}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11.5px", color: "#6E6E6E" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1DB76A", boxShadow: "0 0 7px #1DB76A" }} />
            Live · refreshed just now
          </div>
        </div>

        {/* KPI GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "14px" }}>
          {kpis.map((k, i) => (
            <div
              key={i}
              onClick={k.go ? () => setScreen(k.go!) : undefined}
              style={{ ...CARD, padding: "16px 17px", cursor: k.go ? "pointer" : "default", position: "relative", overflow: "hidden" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "11.5px", color: "#A0A0A0", fontWeight: 600 }}>{k.label}</span>
                <span
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: hexA(k.color, 0.14),
                  }}
                >
                  <Icon name={k.icon} size={16} color={k.color} />
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "7px" }}>
                <span style={{ fontSize: "27px", fontWeight: 800, letterSpacing: "-.5px", lineHeight: 1 }}>{k.value}</span>
                <span style={{ fontSize: "12px", color: "#6E6E6E", fontWeight: 600 }}>{k.unit}</span>
              </div>
              <div style={{ marginTop: "8px", fontSize: "11.5px", fontWeight: 600, color: k.subOk ? "#7A7A7A" : k.color }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div style={{ ...CARD, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <div style={{ fontWeight: 700, fontSize: "13.5px" }}>Rides &amp; revenue · last 7 days</div>
              <div style={{ display: "flex", gap: "14px", fontSize: "11px", color: "#A0A0A0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: "#2E8BFF" }} />
                  Rides
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: "#00C2FF" }} />
                  App-fee E£
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "170px", paddingTop: "14px" }}>
              {days.map(([l, r, v]) => (
                <div key={l} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "5px" }}>
                    <div style={{ width: "13px", height: Math.round((r / maxR) * 100) + "%", background: "linear-gradient(180deg,#5BA3FF,#2E8BFF)", borderRadius: "4px 4px 0 0" }} />
                    <div style={{ width: "13px", height: Math.round((v / maxV) * 100) + "%", background: "linear-gradient(180deg,#00C2FF,#0a96c4)", borderRadius: "4px 4px 0 0" }} />
                  </div>
                  <span style={{ fontSize: "10.5px", color: "#6E6E6E", fontWeight: 600 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...CARD, padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "14px" }}>Rides by compound</div>
            {comp.length === 0 && <div style={{ fontSize: "12px", color: "#6E6E6E", padding: "20px 0" }}>No rides in this period.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              {comp.map(([name, count]) => (
                <div key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                    <span style={{ color: "#D5D5D5", fontWeight: 600 }}>{name}</span>
                    <span style={{ color: "#6E6E6E", fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: "7px", background: "#262626", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: Math.round((count / cmax) * 100) + "%", borderRadius: "4px", background: "linear-gradient(90deg,#1A3FD4,#00C2FF)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QUEUES */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div style={{ ...CARD, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid #262626" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", fontWeight: 700, fontSize: "13.5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FFA726" }} />
                Settlements awaiting review
              </div>
              <button onClick={() => setScreen("settlements")} style={{ fontSize: "11.5px", color: "#2E8BFF", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
                View all →
              </button>
            </div>
            {submitted.map((s) => {
              const match = s.amountSent === s.appFeeOwed;
              return (
                <div
                  key={s.id}
                  onClick={() => openDrawer("settlement", s.id)}
                  style={{ display: "flex", alignItems: "center", gap: "11px", padding: "11px 18px", borderBottom: "1px solid #1F1F1F", cursor: "pointer" }}
                >
                  <div style={avatar(s.driverName, 32)}>{initials(s.driverName)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "12.5px" }}>{s.driverName}</div>
                    <div style={{ fontSize: "11px", color: "#6E6E6E" }}>
                      {s.weekId} · {s.referenceNumber || "no ref"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "12.5px" }}>{money(s.amountSent)}</div>
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: match ? C.green : C.amber }}>
                      {match ? "matches owed" : "Δ " + money(Math.abs(s.amountSent - s.appFeeOwed))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ ...CARD, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid #262626" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", fontWeight: 700, fontSize: "13.5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2E8BFF" }} />
                Drivers awaiting approval
              </div>
              <button onClick={() => setScreen("drivers")} style={{ fontSize: "11.5px", color: "#2E8BFF", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>
                View all →
              </button>
            </div>
            {pending.map((d) => {
              const ready = d.hasLicense && d.hasRecord;
              return (
                <div
                  key={d.uid}
                  onClick={() => {
                    setScreen("drivers");
                    setDrawer({ type: "driver", id: d.uid });
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "11px", padding: "11px 18px", borderBottom: "1px solid #1F1F1F", cursor: "pointer" }}
                >
                  <div style={avatar(d.name, 32)}>{initials(d.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "12.5px" }}>{d.name}</div>
                    <div style={{ fontSize: "11px", color: "#6E6E6E" }}>
                      {d.carType} · {d.licensePlate}
                    </div>
                  </div>
                  <Chip color={ready ? C.green : C.amber} label={ready ? "Docs ready" : "Missing doc"} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderSettlements() {
    const tabs: [string, string][] = [
      ["submitted", "Awaiting review"],
      ["pending", "Owed · no upload"],
      ["approved", "Approved"],
      ["rejected", "Rejected"],
      ["all", "All"],
    ];
    const col: Record<string, string> = { pending: C.grey, submitted: C.amber, approved: C.green, rejected: C.red };
    const list = settlements.filter((s) => settleTab === "all" || s.status === settleTab);
    return (
      <div>
        <div
          style={{
            background: "linear-gradient(110deg,rgba(26,63,212,.16),rgba(0,194,255,.06))",
            border: "1px solid #2A2A2A",
            borderRadius: "13px",
            padding: "12px 16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "11px",
            fontSize: "12.5px",
            color: "#B8C4E8",
          }}
        >
          <span style={{ color: "#5BA3FF", fontSize: "15px" }}>ⓘ</span>
          <span>
            Approving only flips <b style={{ color: "#fff" }}>status</b> — a Cloud Function then clears{" "}
            <code style={{ background: "#222", padding: "1px 5px", borderRadius: "4px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "#9CC4FF" }}>settlementBlocked</code> and advances
            the cycle. The panel never writes those driver fields.
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "9px", marginBottom: "16px" }}>
          {tabs.map(([k, l]) => {
            const active = settleTab === k;
            const count = k === "all" ? settlements.length : settlements.filter((s) => s.status === k).length;
            return (
              <div key={k} onClick={() => setSettleTab(k)} style={tabBtn(active)}>
                {l}
                <span style={tabCount(active)}>{count}</span>
              </div>
            );
          })}
        </div>
        <div style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 1fr 1.2fr", gap: "12px", padding: "11px 18px", borderBottom: "1px solid #2A2A2A", ...HEAD_CELL }}>
            <span>Driver</span>
            <span>Period</span>
            <span>Owed</span>
            <span>Sent</span>
            <span>Rides</span>
            <span>Status</span>
          </div>
          {list.map((s) => {
            const match = s.amountSent === s.appFeeOwed;
            return (
              <div
                key={s.id}
                onClick={() => openDrawer("settlement", s.id)}
                style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 1fr 1.2fr", alignItems: "center", gap: "12px", padding: "13px 18px", borderBottom: "1px solid #1F1F1F", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                  <div style={avatar(s.driverName, 38)}>{initials(s.driverName)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>{s.driverName}</div>
                    <div style={{ fontSize: "11px", color: "#6E6E6E", fontFamily: "var(--font-mono)" }}>{s.referenceNumber || "—"}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 600 }}>{s.weekId}</div>
                  <div style={{ fontSize: "11px", color: "#6E6E6E" }}>
                    {s.periodStart} → {s.periodEnd}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "13px" }}>{money(s.appFeeOwed)}</div>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "13px", color: s.status === "pending" ? "#5E5E5E" : match ? "#E5E5E5" : C.amber }}>
                    {s.status === "pending" ? "—" : money(s.amountSent)}
                  </div>
                  <div style={{ fontSize: "10.5px", fontWeight: 700, color: s.status === "pending" ? "#5E5E5E" : match ? C.green : C.amber }}>
                    {s.status === "pending" ? "not uploaded" : match ? "matches" : "mismatch " + money(Math.abs(s.amountSent - s.appFeeOwed))}
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#A0A0A0" }}>{s.totalRides}</div>
                <div>
                  <Chip color={col[s.status]} label={s.status} />
                </div>
              </div>
            );
          })}
          {list.length === 0 && <div style={{ padding: "48px", textAlign: "center", color: "#6E6E6E", fontSize: "13px" }}>No settlements in this view.</div>}
        </div>
      </div>
    );
  }

  function renderDrivers() {
    const tabs: [string, string][] = [
      ["all", "All drivers"],
      ["pending", "Pending approval"],
      ["approved", "Approved"],
      ["online", "Online now"],
      ["blocked", "Blocked"],
    ];
    const acol: Record<string, string> = { pending: C.amber, approved: C.green, rejected: C.red };
    const count = (k: string) =>
      k === "all"
        ? drivers.length
        : k === "online"
          ? drivers.filter((d) => d.isOnline).length
          : k === "blocked"
            ? drivers.filter((d) => d.settlementBlocked).length
            : drivers.filter((d) => d.approvalStatus === k).length;
    const list = drivers.filter((d) =>
      driverTab === "all"
        ? true
        : driverTab === "online"
          ? d.isOnline
          : driverTab === "blocked"
            ? d.settlementBlocked
            : d.approvalStatus === driverTab,
    );
    return (
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "9px", marginBottom: "16px" }}>
          {tabs.map(([k, l]) => {
            const active = driverTab === k;
            return (
              <div key={k} onClick={() => setDriverTab(k)} style={tabBtn(active)}>
                {l}
                <span style={tabCount(active)}>{count(k)}</span>
              </div>
            );
          })}
        </div>
        <div style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2.1fr 1.5fr 1.3fr 1fr 1.1fr 0.9fr", gap: "12px", padding: "11px 18px", borderBottom: "1px solid #2A2A2A", ...HEAD_CELL }}>
            <span>Driver</span>
            <span>Vehicle</span>
            <span>Live status</span>
            <span>Rating</span>
            <span>Totals</span>
            <span>Approval</span>
          </div>
          {list.map((d) => {
            const rating = d.ratingCount ? (d.ratingSum / d.ratingCount).toFixed(2) : "—";
            return (
              <div
                key={d.uid}
                onClick={() => openDrawer("driver", d.uid)}
                style={{ display: "grid", gridTemplateColumns: "2.1fr 1.5fr 1.3fr 1fr 1.1fr 0.9fr", alignItems: "center", gap: "12px", padding: "13px 18px", borderBottom: "1px solid #1F1F1F", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                  <div style={avatar(d.name, 38)}>{initials(d.name)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "7px" }}>
                      {d.name}
                      {d.settlementBlocked && <Chip color={C.red} label="Blocked" />}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6E6E6E" }}>
                      {d.phone} · {d.compound}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 600 }}>{d.carType}</div>
                  <div style={{ fontSize: "11px", color: "#6E6E6E", fontFamily: "var(--font-mono)" }}>
                    {d.licensePlate} · {d.cartNumber} · {d.seatNumber} seats
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: d.isOnline ? (d.isFree ? C.green : C.bright) : C.grey,
                      boxShadow: d.isOnline ? "0 0 7px " + (d.isFree ? C.green : C.bright) : "none",
                    }}
                  />
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: d.isOnline ? (d.isFree ? C.green : C.bright) : "#7A7A7A" }}>
                    {d.isOnline ? (d.isFree ? "Online · free" : "On-trip") : "Offline"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12.5px", fontWeight: 700 }}>
                  <span style={{ color: "#FFA726" }}>★</span>
                  {rating}
                  <span style={{ color: "#6E6E6E", fontWeight: 500, fontSize: "11px" }}>{d.ratingCount ? "(" + d.ratingCount + ")" : ""}</span>
                </div>
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 600 }}>{d.totalRides} rides</div>
                  <div style={{ fontSize: "11px", color: "#6E6E6E", fontFamily: "var(--font-mono)" }}>{money(d.totalEarnings)}</div>
                </div>
                <div>
                  <Chip color={acol[d.approvalStatus]} label={d.approvalStatus} />
                </div>
              </div>
            );
          })}
          {list.length === 0 && <div style={{ padding: "48px", textAlign: "center", color: "#6E6E6E", fontSize: "13px" }}>No drivers in this view.</div>}
        </div>
      </div>
    );
  }

  function renderLive() {
    const live = rides.filter((r) => ["requested", "accepted", "enRoute", "arrived", "inProgress"].includes(r.status));
    const scol: Record<string, string> = { requested: C.bright, accepted: C.amber, enRoute: C.amber, arrived: C.amber, inProgress: C.amber };
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "14px", alignItems: "start" }}>
        <div style={{ ...CARD, overflow: "hidden", height: "560px", position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 30% 20%,rgba(46,139,255,.10),transparent 45%),radial-gradient(circle at 70% 80%,rgba(0,194,255,.08),transparent 45%),#141414",
              backgroundSize: "32px 32px",
              backgroundImage: "linear-gradient(#1F1F1F 1px,transparent 1px),linear-gradient(90deg,#1F1F1F 1px,transparent 1px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              background: "rgba(20,20,20,.85)",
              border: "1px solid #2A2A2A",
              borderRadius: "9px",
              padding: "7px 12px",
              fontSize: "12px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1DB76A", boxShadow: "0 0 7px #1DB76A" }} />
            {live.length} rides in progress · Cairo
          </div>
          {live.map((r, i) => (
            <div
              key={r.id}
              style={{
                position: "absolute",
                left: 12 + ((i * 13) % 76) + "%",
                top: 18 + ((i * 29) % 62) + "%",
                transform: "translate(-50%,-100%)",
              }}
            >
              <Icon name="pin" size={26} color={r.driver ? C.bright : C.amber} />
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              bottom: "14px",
              right: "14px",
              display: "flex",
              gap: "14px",
              background: "rgba(20,20,20,.85)",
              border: "1px solid #2A2A2A",
              borderRadius: "9px",
              padding: "7px 12px",
              fontSize: "11px",
              color: "#A0A0A0",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2E8BFF" }} />
              Driver assigned
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FFA726" }} />
              Awaiting driver
            </span>
          </div>
        </div>
        <div style={{ ...CARD, overflow: "hidden", maxHeight: "560px", overflowY: "auto" }}>
          {live.map((r) => (
            <div
              key={r.id}
              onClick={() => openDrawer("ride", r.id)}
              style={{ padding: "13px 16px", borderBottom: "1px solid #1F1F1F", cursor: "pointer", background: r.status === "requested" ? hexA(C.bright, 0.05) : "transparent" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "12.5px", fontFamily: "var(--font-mono)", color: "#5BA3FF" }}>
                  {r.id}
                  {r.type === "delivery" && (
                    <span style={{ fontFamily: "var(--font-cairo)", fontSize: "10px", color: "#00C2FF", background: "rgba(0,194,255,.14)", padding: "1px 7px", borderRadius: "6px" }}>delivery</span>
                  )}
                </div>
                <Chip color={scol[r.status]} label={r.status} />
              </div>
              <div style={{ fontSize: "12.5px", marginBottom: "3px" }}>
                {r.rider} <span style={{ color: "#6E6E6E" }}>·</span> <span style={{ color: "#A0A0A0" }}>{r.driver || "Searching…"}</span>
              </div>
              <div style={{ fontSize: "11.5px", color: "#8A8A8A", marginBottom: "5px" }}>
                {r.pickup} → {r.dropoff}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6E6E6E" }}>
                <span>
                  {r.compound} · {r.createdAt}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", color: "#A0A0A0" }}>{money(r.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderHistory() {
    const tabs: [string, string][] = [
      ["all", "All"],
      ["completed", "Completed"],
      ["cancelled", "Cancelled"],
      ["delivery", "Deliveries"],
    ];
    const scol: Record<string, string> = { completed: C.green, cancelled: C.red, expired: C.grey, rejected: C.red };
    const hist = rides.filter((r) => ["completed", "cancelled", "expired", "rejected"].includes(r.status));
    const list = hist.filter((r) => (histType === "all" ? true : histType === "delivery" ? r.type === "delivery" : r.status === histType));
    const cols = "1.3fr 1.4fr 1.4fr 1.4fr 0.8fr 0.9fr 1.1fr 0.7fr";
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px" }}>
          {tabs.map(([k, l]) => {
            const active = histType === k;
            return (
              <div
                key={k}
                onClick={() => setHistType(k)}
                style={{
                  padding: "6px 13px",
                  borderRadius: "8px",
                  border: "1px solid " + (active ? hexA(C.bright, 0.4) : "#2A2A2A"),
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: active ? hexA(C.bright, 0.14) : "#1A1A1A",
                  color: active ? C.light : "#9A9A9A",
                }}
              >
                {l}
              </div>
            );
          })}
          <div style={{ flex: 1 }} />
          <button style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "9px", border: "1px solid #2A2A2A", background: "#1A1A1A", color: "#A0A0A0", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
            Export CSV
          </button>
        </div>
        <div style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: "12px", padding: "11px 18px", borderBottom: "1px solid #2A2A2A", ...HEAD_CELL }}>
            <span>Date</span>
            <span>Rider</span>
            <span>Driver</span>
            <span>Compound</span>
            <span>Dist</span>
            <span>Price</span>
            <span>Status</span>
            <span>Rating</span>
          </div>
          {list.map((r) => (
            <div
              key={r.id}
              onClick={() => openDrawer("ride", r.id)}
              style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", gap: "12px", padding: "12px 18px", borderBottom: "1px solid #1F1F1F", cursor: "pointer" }}
            >
              <div style={{ fontSize: "12px", color: "#A0A0A0", fontFamily: "var(--font-mono)" }}>{r.createdAt}</div>
              <div style={{ fontSize: "12.5px", fontWeight: 600 }}>{r.rider}</div>
              <div style={{ fontSize: "12.5px", color: "#A0A0A0" }}>{r.driver || "—"}</div>
              <div style={{ fontSize: "12px", color: "#A0A0A0" }}>{r.compound}</div>
              <div style={{ fontSize: "12px", color: "#A0A0A0" }}>{r.distanceKm ? r.distanceKm.toFixed(1) + " km" : "—"}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "12.5px" }}>
                {money(r.price)}
                {r.discount > 0 && <span style={{ color: "#1DB76A", fontSize: "10px", marginLeft: "4px" }}>−{money(r.discount)}</span>}
              </div>
              <div>
                <Chip color={scol[r.status]} label={r.status} />
              </div>
              <div style={{ color: r.rating ? C.amber : "#5E5E5E", fontWeight: 700, fontSize: "12px" }}>{r.rating ? r.rating + "★" : "—"}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderRiders() {
    const cols = "2fr 1.5fr 1.4fr 1fr 0.8fr 1fr";
    return (
      <div style={{ ...CARD, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: "12px", padding: "11px 18px", borderBottom: "1px solid #2A2A2A", ...HEAD_CELL }}>
          <span>Rider</span>
          <span>Phone</span>
          <span>Compound</span>
          <span>Joined</span>
          <span>Rides</span>
          <span>Total spent</span>
        </div>
        {riders.map((r) => (
          <div key={r.uid} style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", gap: "12px", padding: "13px 18px", borderBottom: "1px solid #1F1F1F" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
              <div style={avatar(r.name, 38)}>{initials(r.name)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "13px" }}>{r.name}</div>
                <div style={{ fontSize: "11px", color: "#6E6E6E" }}>{r.language === "ar" ? "عربي" : "English"}</div>
              </div>
            </div>
            <div style={{ fontSize: "12.5px", color: "#A0A0A0", fontFamily: "var(--font-mono)" }}>{r.phone}</div>
            <div style={{ fontSize: "12.5px", color: "#A0A0A0" }}>{r.compound}</div>
            <div style={{ fontSize: "12px", color: "#6E6E6E" }}>{r.createdAt}</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{r.rides}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "12.5px", color: "#1DB76A" }}>{money(r.spent)}</div>
          </div>
        ))}
      </div>
    );
  }

  function renderOffers() {
    const redCols = "1fr 1.4fr 1fr 0.8fr 1fr 1.2fr";
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ fontSize: "12.5px", color: "#8A8A8A" }}>The company absorbs every discount, capped at the 15% app fee — drivers are never affected.</div>
          <button
            onClick={() => setOfferForm(true)}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", borderRadius: "10px", border: "none", background: GRAD, color: "#fff", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(46,139,255,.3)" }}
          >
            + New offer
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px", marginBottom: "18px" }}>
          {offers.map((o) => {
            const exhausted = !!o.usageLimit && o.usedCount >= o.usageLimit;
            const statusColor = !o.active ? C.grey : exhausted ? C.amber : C.green;
            const statusLabel = !o.active ? "inactive" : exhausted ? "exhausted" : "active";
            return (
              <div key={o.id} style={{ ...CARD, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "15px", letterSpacing: ".5px", color: "#fff", background: "rgba(46,139,255,.14)", border: "1px dashed rgba(46,139,255,.5)", padding: "3px 10px", borderRadius: "8px" }}>
                      {o.code}
                    </span>
                    <Chip color={statusColor} label={statusLabel} />
                  </div>
                  <div
                    onClick={() => {
                      setOffers((l) => l.map((x) => (x.id === o.id ? { ...x, active: !x.active } : x)));
                      sync(() => toggleOfferAction(o.id, !o.active));
                      showToast(o.active ? "Offer " + o.code + " deactivated" : "Offer " + o.code + " activated");
                    }}
                    style={{ width: "38px", height: "22px", borderRadius: "12px", padding: "2px", cursor: "pointer", background: o.active ? C.green : "#3A3A3A", display: "flex", justifyContent: o.active ? "flex-end" : "flex-start", transition: "all .15s" }}
                  >
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#fff" }} />
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "3px" }}>{o.title}</div>
                <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#A0A0A0", margin: "10px 0 12px" }}>
                  <span>
                    <span style={{ color: "#6E6E6E" }}>Discount</span>{" "}
                    <b style={{ color: "#E5E5E5" }}>{o.type === "percent" ? o.value + "% off" : money(o.value) + " off"}</b>
                  </span>
                  <span>
                    <span style={{ color: "#6E6E6E" }}>Cap</span> {o.maxDiscount ? money(o.maxDiscount) : o.type === "percent" ? "uncapped*" : "—"}
                  </span>
                  <span>
                    <span style={{ color: "#6E6E6E" }}>Scope</span> {o.compound}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11.5px", color: "#6E6E6E" }}>
                  <span>
                    {o.startsAt} → {o.expiresAt}
                  </span>
                  <div style={{ flex: 1, height: "6px", background: "#262626", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: (o.usageLimit ? Math.min(100, (o.usedCount / o.usageLimit) * 100) : 35) + "%", borderRadius: "3px", background: exhausted ? C.amber : "linear-gradient(90deg,#2E8BFF,#00C2FF)" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#A0A0A0" }}>
                    {o.usedCount}
                    {o.usageLimit ? " / " + o.usageLimit : " / ∞"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #262626", fontWeight: 700, fontSize: "13.5px" }}>Recent redemptions</div>
          <div style={{ display: "grid", gridTemplateColumns: redCols, gap: "12px", padding: "10px 18px", borderBottom: "1px solid #262626", ...HEAD_CELL }}>
            <span>Code</span>
            <span>Rider</span>
            <span>Ride</span>
            <span>Discount</span>
            <span>Status</span>
            <span>When</span>
          </div>
          {redemptions.map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: redCols, gap: "12px", padding: "11px 18px", borderBottom: "1px solid #1F1F1F", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "12px", color: "#5BA3FF" }}>{r.code}</span>
              <span style={{ fontSize: "12.5px" }}>{r.rider}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#A0A0A0" }}>{r.rideId}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#1DB76A" }}>{money(r.discount)}</span>
              <span>
                <Chip color={r.status === "applied" ? C.green : C.grey} label={r.status} />
              </span>
              <span style={{ fontSize: "11.5px", color: "#6E6E6E" }}>{r.createdAt}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderCompounds() {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "14px", alignItems: "start" }}>
        <div style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #262626" }}>
            <span style={{ fontWeight: 700, fontSize: "13.5px" }}>Operating compounds</span>
            <button onClick={() => showToast("Compound editor coming soon")} style={{ padding: "7px 13px", borderRadius: "9px", border: "none", background: GRAD, color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              + Add compound
            </button>
          </div>
          {compounds.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 18px", borderBottom: "1px solid #1F1F1F" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "3px" }}>
                  <span style={{ fontWeight: 700, fontSize: "13.5px" }}>{c.name}</span>
                  <Chip color={c.isActive ? C.green : C.grey} label={c.isActive ? "active" : "inactive"} />
                </div>
                <div style={{ fontSize: "11.5px", color: "#6E6E6E" }}>
                  {c.city} · {c.centerLat.toFixed(3)}, {c.centerLng.toFixed(3)} · radius {(c.radius / 1000).toFixed(1)} km
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px" }}>
                <div style={{ color: "#A0A0A0" }}>{c.drivers} drivers</div>
                <div style={{ color: "#6E6E6E", fontSize: "11px" }}>{c.activeRides} active rides</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...CARD, overflow: "hidden", height: "430px", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "#141414", backgroundImage: "linear-gradient(#1F1F1F 1px,transparent 1px),linear-gradient(90deg,#1F1F1F 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
          <div style={{ position: "absolute", top: "12px", left: "14px", fontSize: "12px", fontWeight: 700, color: "#A0A0A0" }}>Geofence coverage</div>
          {compounds.map((c) => {
            const left = ((20 + (c.centerLng - 30.9) * 60) % 70) + "%";
            const top = ((15 + (30.11 - c.centerLat) * 200) % 70) + "%";
            return (
              <div
                key={c.id}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: c.radius / 30 + "px",
                  height: c.radius / 30 + "px",
                  borderRadius: "50%",
                  transform: "translate(-50%,-50%)",
                  border: "1.5px solid " + hexA(c.isActive ? C.cyan : C.grey, 0.6),
                  background: hexA(c.isActive ? C.cyan : C.grey, 0.1),
                }}
              />
            );
          })}
          {compounds.map((c) => {
            const left = ((20 + (c.centerLng - 30.9) * 60) % 70) + "%";
            const top = ((15 + (30.11 - c.centerLat) * 200) % 70) + "%";
            return (
              <div key={c.id} style={{ position: "absolute", left, top, width: "8px", height: "8px", borderRadius: "50%", transform: "translate(-50%,-50%)", background: c.isActive ? C.cyan : C.grey }} />
            );
          })}
        </div>
      </div>
    );
  }

  function renderPricing() {
    const p = pricing;
    const d = parseFloat(calcDist) || 0;
    const isDel = calcType === "delivery";
    let price = p.baseFare + p.pricePerKm * d;
    if (isDel) price *= p.deliveryMarkup;
    price = Math.max(price, p.minimumFare);
    price = Math.round(price * 2) / 2;
    const driverNet = Math.round(price * 0.85 * 100) / 100;
    const appFee = Math.round((price - driverNet) * 100) / 100;
    const fields: { key: keyof Pricing; label: string; hint: string; unit: string }[] = [
      { key: "baseFare", label: "Base fare", hint: "Flat starting amount", unit: p.currency },
      { key: "pricePerKm", label: "Price per km", hint: "Per-kilometer rate", unit: p.currency + "/km" },
      { key: "minimumFare", label: "Minimum fare", hint: "Floor price", unit: p.currency },
      { key: "deliveryMarkup", label: "Delivery markup", hint: "Multiplier (1.2 = +20%)", unit: "×" },
      { key: "waitingPrice", label: "Waiting price", hint: "Hourly, after 5-min free grace", unit: p.currency + "/hr" },
    ];
    const calcTab = (on: boolean): CSSProperties => ({
      flex: 1,
      padding: "8px",
      borderRadius: "8px",
      border: "1px solid #2A2A2A",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: "12.5px",
      background: on ? hexA(C.bright, 0.16) : "#1A1A1A",
      color: on ? C.light : "#9A9A9A",
    });
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "14px", alignItems: "start", maxWidth: "1000px" }}>
        <div style={{ ...CARD, padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>Global fare formula</div>
          <div style={{ fontSize: "12px", color: "#6E6E6E", marginBottom: "18px" }}>Single document · applies to every new ride instantly.</div>
          {fields.map((f) => (
            <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", padding: "11px 0", borderBottom: "1px solid #232323" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>{f.label}</div>
                <div style={{ fontSize: "11px", color: "#6E6E6E" }}>{f.hint}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  value={String(p[f.key])}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setPricing((prev) => ({ ...prev, [f.key]: v }));
                  }}
                  style={{ width: "90px", height: "36px", background: "#121212", border: "1px solid #333", borderRadius: "9px", textAlign: "right", padding: "0 10px", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "13px", outline: "none" }}
                />
                <span style={{ fontSize: "11px", color: "#6E6E6E", width: "44px" }}>{f.unit}</span>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              sync(() => savePricingAction(pricing));
              showToast("Pricing saved · applies to every new ride");
            }}
            style={{ marginTop: "18px", width: "100%", padding: "11px", borderRadius: "10px", border: "none", background: GRAD, color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 14px rgba(46,139,255,.3)" }}
          >
            Save pricing
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "linear-gradient(135deg,#15233f,#101822)", border: "1px solid #2A3550", borderRadius: "14px", padding: "18px 20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#7FA8E8", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "10px" }}>Formula</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", lineHeight: 1.9, color: "#C8D6F0" }}>
              price = baseFare + pricePerKm × km
              <br />
              if delivery: price ×= deliveryMarkup
              <br />
              price = max(price, minimumFare)
              <br />
              <span style={{ color: "#6E84B0" }}>→ rounded to nearest 0.5</span>
            </div>
            <div style={{ marginTop: "12px", fontSize: "11px", color: "#7FA8E8" }}>First 5 min of waiting are free, then waitingPrice is pro-rated per minute.</div>
          </div>
          <div style={{ ...CARD, padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "14px" }}>Live preview calculator</div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <button onClick={() => setCalcType("ride")} style={calcTab(!isDel)}>
                Ride
              </button>
              <button onClick={() => setCalcType("delivery")} style={calcTab(isDel)}>
                Delivery
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <span style={{ fontSize: "12.5px", color: "#A0A0A0" }}>Distance</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input value={calcDist} onChange={(e) => setCalcDist(e.target.value)} style={{ width: "70px", height: "34px", background: "#121212", border: "1px solid #333", borderRadius: "8px", textAlign: "right", padding: "0 10px", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 600, outline: "none" }} />
                <span style={{ fontSize: "12px", color: "#6E6E6E" }}>km</span>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #262626", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "9px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "13px", color: "#A0A0A0" }}>Rider pays</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "22px", color: "#00C2FF" }}>{money(price)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#6E6E6E" }}>Driver net (85%)</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#1DB76A" }}>{money(driverNet)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#6E6E6E" }}>App fee (15%)</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px", color: "#5BA3FF" }}>{money(appFee)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderSettings() {
    const c = config;
    const cfgEmpty = !c.payeeName || !c.walletNumber;
    const inputStyle: CSSProperties = { width: "100%", height: "40px", background: "#121212", border: "1px solid #333", borderRadius: "10px", padding: "0 13px", color: "#fff", fontSize: "13px", outline: "none" };
    const labelStyle: CSSProperties = { display: "block", fontSize: "12px", fontWeight: 600, color: "#A0A0A0", marginBottom: "7px" };
    return (
      <div style={{ maxWidth: "640px" }}>
        {cfgEmpty && (
          <div style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.4)", borderRadius: "12px", padding: "13px 16px", marginBottom: "16px", fontSize: "12.5px", color: "#FCA5A5" }}>
            ⚠ Config is incomplete — drivers can&apos;t see where to send payments, which blocks all settlements.
          </div>
        )}
        <div style={{ ...CARD, padding: "22px" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>Settlement destination</div>
          <div style={{ fontSize: "12px", color: "#6E6E6E", marginBottom: "20px" }}>Shown verbatim in the driver app&apos;s settlement screen. Changes are immediately visible to all drivers.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Payee name</label>
              <input value={c.payeeName} onChange={(e) => setConfig((s) => ({ ...s, payeeName: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Wallet number</label>
                <input value={c.walletNumber} onChange={(e) => setConfig((s) => ({ ...s, walletNumber: e.target.value }))} style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
              </div>
              <div>
                <label style={labelStyle}>InstaPay handle</label>
                <input value={c.instapay} onChange={(e) => setConfig((s) => ({ ...s, instapay: e.target.value }))} style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Instructions</label>
              <textarea value={c.instructions} onChange={(e) => setConfig((s) => ({ ...s, instructions: e.target.value }))} style={{ ...inputStyle, height: "110px", padding: "11px 13px", lineHeight: 1.6, resize: "vertical" }} />
            </div>
          </div>
          <button
            onClick={() => {
              sync(() => saveConfigAction(config));
              showToast("Settlement config saved · visible to all drivers");
            }}
            style={{ marginTop: "20px", padding: "11px 22px", borderRadius: "10px", border: "none", background: GRAD, color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 14px rgba(46,139,255,.3)" }}
          >
            Save config
          </button>
        </div>
      </div>
    );
  }

  // ===================== DRAWER =====================

  function renderDrawer() {
    if (!drawer) return null;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 90 }}>
        <div onClick={closeDrawer} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)" }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%",
            width: "480px",
            maxWidth: "94vw",
            background: "#161616",
            borderLeft: "1px solid #2A2A2A",
            boxShadow: "-20px 0 60px rgba(0,0,0,.5)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {drawer.type === "settlement" && renderSettlementDrawer()}
          {drawer.type === "driver" && renderDriverDrawer()}
          {drawer.type === "ride" && renderRideDrawer()}
        </div>
        {zoomImg && (
          <div onClick={() => setZoomImg(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", zIndex: 5, padding: "40px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomImg} alt="Full-size review document" style={{ maxWidth: "min(80vw,900px)", maxHeight: "88vh", borderRadius: "14px", border: "1px solid #333", objectFit: "contain", background: "#0E0E0E" }} />
          </div>
        )}
      </div>
    );
  }

  function drawerHeader(t: string, sub: string) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #262626" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px" }}>{t}</div>
          <div style={{ fontSize: "11.5px", color: "#6E6E6E", marginTop: "2px" }}>{sub}</div>
        </div>
        <button onClick={closeDrawer} style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#1E1E1E", border: "1px solid #333", color: "#A0A0A0", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>
          ✕
        </button>
      </div>
    );
  }

  function renderSettlementDrawer() {
    const s = settlements.find((x) => x.id === drawer!.id);
    if (!s) return null;
    const match = s.amountSent === s.appFeeOwed;
    const diff = s.amountSent - s.appFeeOwed;
    const col: Record<string, string> = { pending: C.grey, submitted: C.amber, approved: C.green, rejected: C.red };
    const canReview = s.status === "submitted";
    const proofPlate: CSSProperties = { background: "repeating-linear-gradient(45deg,#1c1c1c,#1c1c1c 12px,#191919 12px,#191919 24px)" };
    const statCard: CSSProperties = { background: "#1E1E1E", border: "1px solid #2A2A2A", borderRadius: "12px", padding: "14px" };
    const rowCell: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "11px 14px", fontSize: "12.5px" };
    return (
      <>
        {drawerHeader("Settlement review", s.weekId + " · " + s.periodStart + " → " + s.periodEnd)}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "13px", marginBottom: "20px" }}>
            <div style={avatar(s.driverName, 46)}>{initials(s.driverName)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>{s.driverName}</div>
              <div style={{ fontSize: "12px", color: "#6E6E6E", fontFamily: "var(--font-mono)" }}>{s.driverPhone}</div>
            </div>
            <Chip color={col[s.status]} label={s.status} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div style={statCard}>
              <div style={{ fontSize: "11px", color: "#6E6E6E", fontWeight: 600, marginBottom: "6px" }}>APP FEE OWED</div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "20px" }}>{money(s.appFeeOwed)}</div>
            </div>
            <div style={statCard}>
              <div style={{ fontSize: "11px", color: "#6E6E6E", fontWeight: 600, marginBottom: "6px" }}>AMOUNT SENT</div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "20px" }}>{s.status === "pending" ? "not uploaded" : money(s.amountSent)}</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,167,38,.08)", border: "1px solid rgba(255,167,38,.25)", borderRadius: "10px", padding: "10px 14px", marginBottom: "18px", fontSize: "12.5px", fontWeight: 600, color: "#FFD08A", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FFA726" }} />
            {match ? "Amount matches what is owed" : diff < 0 ? "Short by " + money(Math.abs(diff)) : "Over by " + money(diff)}
          </div>

          <div style={{ background: "#1E1E1E", border: "1px solid #2A2A2A", borderRadius: "12px", overflow: "hidden", marginBottom: "18px" }}>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>Reference</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{s.referenceNumber || "—"}</span>
            </div>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>Rides in period</span>
              <span>{s.totalRides}</span>
            </div>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>Gross earnings</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{money(s.grossEarnings)}</span>
            </div>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>Driver net (85%)</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "#1DB76A" }}>{money(s.driverNet)}</span>
            </div>
            <div style={rowCell}>
              <span style={{ color: "#6E6E6E" }}>Submitted</span>
              <span>{s.submittedAt || "—"}</span>
            </div>
          </div>

          <div style={{ fontSize: "11px", color: "#6E6E6E", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "9px" }}>Payment proof</div>
          {s.proofImageUrl ? (
            <div onClick={() => setZoomImg(s.proofImageUrl ?? null)} style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #2A2A2A", cursor: "zoom-in", marginBottom: "18px", height: "200px", background: "#121212" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.proofImageUrl} alt="Payment proof" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              <div style={{ position: "absolute", top: "10px", right: "10px", width: "28px", height: "28px", borderRadius: "7px", background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>
                <Icon name="zoom" size={15} color="#ccc" />
              </div>
            </div>
          ) : (
            <div style={{ ...proofPlate, borderRadius: "12px", border: "1px solid #2A2A2A", marginBottom: "18px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center", color: "#5E5E5E", fontSize: "12px" }}>
              No payment proof uploaded yet.
            </div>
          )}

          {s.rejectionReason && (
            <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#FCA5A5", fontWeight: 700, marginBottom: "5px" }}>REJECTION REASON</div>
              <div style={{ fontSize: "12.5px", color: "#E5B4B4", lineHeight: 1.5 }}>{s.rejectionReason}</div>
              <div style={{ fontSize: "11px", color: "#8A6060", marginTop: "7px" }}>
                — {s.reviewedBy} · {s.reviewedAt}
              </div>
            </div>
          )}

          {canReview && (
            <div>
              <textarea
                value={rejectDraft}
                onChange={(e) => setRejectDraft(e.target.value)}
                placeholder="Rejection reason (required if rejecting)…"
                style={{ width: "100%", height: "64px", background: "#121212", border: "1px solid #333", borderRadius: "10px", padding: "10px 12px", color: "#fff", fontSize: "12.5px", lineHeight: 1.5, resize: "none", outline: "none", marginBottom: "12px" }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => rejectSettlement(s.id)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid rgba(239,68,68,.4)", background: "rgba(239,68,68,.12)", color: "#F87171", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                  Reject
                </button>
                <button onClick={() => approveSettlement(s.id)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#0f8f52,#1DB76A)", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 14px rgba(29,183,106,.3)" }}>
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  function renderDriverDrawer() {
    const dr = drivers.find((x) => x.uid === drawer!.id);
    if (!dr) return null;
    const acol: Record<string, string> = { pending: C.amber, approved: C.green, rejected: C.red };
    const rating = dr.ratingCount ? (dr.ratingSum / dr.ratingCount).toFixed(2) : "—";
    const isPending = dr.approvalStatus === "pending";
    const missingDoc = !dr.hasLicense || !dr.hasRecord;
    const rowCell: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "11px 14px", fontSize: "12.5px" };
    const stat: CSSProperties = { background: "#1E1E1E", border: "1px solid #2A2A2A", borderRadius: "11px", padding: "13px", textAlign: "center" };
    const docPlate: CSSProperties = { borderRadius: "11px", overflow: "hidden", border: "1px solid #2A2A2A", cursor: "default", height: "120px", background: "repeating-linear-gradient(45deg,#1c1c1c,#1c1c1c 12px,#191919 12px,#191919 24px)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#5E5E5E" };
    const docTile = (label: string, src: string | null | undefined) =>
      src ? (
        <div onClick={() => setZoomImg(src)} style={{ position: "relative", borderRadius: "11px", overflow: "hidden", border: "1px solid #2A2A2A", cursor: "zoom-in", height: "120px", background: "#121212" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,.55)", color: "#ccc", fontSize: "10px", padding: "3px 7px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
            <span>zoom</span>
          </div>
        </div>
      ) : (
        <div style={docPlate}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{label}</div>
            <div style={{ fontSize: "10px", marginTop: "3px" }}>not uploaded</div>
          </div>
        </div>
      );
    return (
      <>
        {drawerHeader("Driver review", dr.cartNumber + " · " + dr.compound)}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "13px", marginBottom: "20px" }}>
            <div style={avatar(dr.name, 46)}>{initials(dr.name)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>{dr.name}</div>
              <div style={{ fontSize: "12px", color: "#6E6E6E", fontFamily: "var(--font-mono)" }}>{dr.phone}</div>
            </div>
            <Chip color={acol[dr.approvalStatus]} label={dr.approvalStatus} />
          </div>

          {dr.settlementBlocked && (
            <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: "10px", padding: "11px 14px", marginBottom: "16px", fontSize: "12.5px", color: "#FCA5A5", fontWeight: 600 }}>
              ⛔ Settlement-blocked — approved but can&apos;t go online until they pay.{" "}
              <span style={{ color: "#8A6060" }}>(managed by Cloud Function, not editable here)</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "18px" }}>
            <div style={stat}>
              <div style={{ fontSize: "18px", fontWeight: 800 }}>
                {rating}
                <span style={{ color: "#FFA726", fontSize: "13px" }}> ★</span>
              </div>
              <div style={{ fontSize: "10.5px", color: "#6E6E6E", marginTop: "3px" }}>{dr.ratingCount ? dr.ratingCount + " ratings" : "no ratings yet"}</div>
            </div>
            <div style={stat}>
              <div style={{ fontSize: "18px", fontWeight: 800 }}>{dr.totalRides}</div>
              <div style={{ fontSize: "10.5px", color: "#6E6E6E", marginTop: "3px" }}>total rides</div>
            </div>
            <div style={stat}>
              <div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1DB76A" }}>{money(dr.totalEarnings)}</div>
              <div style={{ fontSize: "10.5px", color: "#6E6E6E", marginTop: "3px" }}>earnings</div>
            </div>
          </div>

          <div style={{ background: "#1E1E1E", border: "1px solid #2A2A2A", borderRadius: "12px", overflow: "hidden", marginBottom: "18px" }}>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>Vehicle</span>
              <span>{dr.carType}</span>
            </div>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>Plate · Cart</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {dr.licensePlate} · {dr.cartNumber}
              </span>
            </div>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>Seats · Compound</span>
              <span>
                {dr.seatNumber} · {dr.compound}
              </span>
            </div>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>Last settlement</span>
              <span>{dr.lastSettlementAt || "—"}</span>
            </div>
            <div style={rowCell}>
              <span style={{ color: "#6E6E6E" }}>Joined</span>
              <span>{dr.joined}</span>
            </div>
          </div>

          <div style={{ fontSize: "11px", color: "#6E6E6E", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "9px" }}>Documents to review</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
            {docTile("license.jpg", dr.licenseImageUrl)}
            {docTile("criminal-record.jpg", dr.criminalRecordUrl)}
          </div>
          {missingDoc && (
            <div style={{ background: "rgba(255,167,38,.1)", border: "1px solid rgba(255,167,38,.3)", borderRadius: "10px", padding: "11px 14px", marginBottom: "18px", fontSize: "12.5px", color: "#FFD08A", fontWeight: 600 }}>
              ⚠ A required document is missing — can&apos;t approve responsibly until uploaded.
            </div>
          )}

          {isPending && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => rejectDriver(dr.uid)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid rgba(239,68,68,.4)", background: "rgba(239,68,68,.12)", color: "#F87171", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                Reject
              </button>
              <button onClick={() => approveDriver(dr.uid)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#0f8f52,#1DB76A)", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 14px rgba(29,183,106,.3)" }}>
                Approve driver
              </button>
            </div>
          )}
          {dr.approvalStatus === "approved" && (
            <button onClick={() => setDriverActive(dr.uid, false)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgba(239,68,68,.4)", background: "rgba(239,68,68,.1)", color: "#F87171", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
              Deactivate driver
            </button>
          )}
          {dr.approvalStatus === "rejected" && (
            <button onClick={() => setDriverActive(dr.uid, true)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#0f8f52,#1DB76A)", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
              Reactivate driver
            </button>
          )}
        </div>
      </>
    );
  }

  function renderRideDrawer() {
    const r = rides.find((x) => x.id === drawer!.id);
    if (!r) return null;
    const scol: Record<string, string> = { requested: C.bright, accepted: C.amber, enRoute: C.amber, arrived: C.amber, inProgress: C.amber, completed: C.green, cancelled: C.red, expired: C.grey, rejected: C.red };
    const steps = ["requested", "accepted", "enRoute", "arrived", "inProgress", "completed"];
    const curIdx = steps.indexOf(r.status);
    const isLive = ["requested", "accepted", "enRoute", "arrived", "inProgress"].includes(r.status);
    const rowCell: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "10px 14px", fontSize: "12.5px" };
    return (
      <>
        {drawerHeader(r.id, r.compound + " · " + r.createdAt)}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#A0A0A0" }}>{r.rider}</span>
              <span style={{ color: "#6E6E6E" }}>→</span>
              <span style={{ fontSize: "13px", color: "#A0A0A0" }}>{r.driver || "—"}</span>
            </div>
            <Chip color={scol[r.status]} label={r.status} />
          </div>

          <div style={{ background: "#1E1E1E", border: "1px solid #2A2A2A", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "11px", marginBottom: "10px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#2E8BFF", marginTop: "3px" }} />
              <div>
                <div style={{ fontSize: "11px", color: "#6E6E6E" }}>Pickup</div>
                <div style={{ fontSize: "13px" }}>{r.pickup}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "11px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#00C2FF", marginTop: "3px" }} />
              <div>
                <div style={{ fontSize: "11px", color: "#6E6E6E" }}>Dropoff</div>
                <div style={{ fontSize: "13px" }}>{r.dropoff}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #262626", fontSize: "12px", color: "#A0A0A0" }}>
              <span>{r.distanceKm ? r.distanceKm.toFixed(1) + " km" : "—"}</span>
              <span>{r.passengerCount} pax</span>
              <span>{r.type}</span>
            </div>
            {r.type === "delivery" && <div style={{ marginTop: "10px", fontSize: "12px", color: "#7FB8E0", background: "rgba(0,194,255,.08)", borderRadius: "8px", padding: "8px 11px" }}>📦 {r.itemNote}</div>}
          </div>

          <div style={{ fontSize: "11px", color: "#6E6E6E", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "9px" }}>Fare breakdown</div>
          <div style={{ background: "#1E1E1E", border: "1px solid #2A2A2A", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" }}>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>Original price</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{money(r.originalPrice)}</span>
            </div>
            {r.discount > 0 && (
              <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
                <span style={{ color: "#6E6E6E" }}>
                  Discount ({r.offerCode || "—"}) <span style={{ color: "#5E5E5E" }}>· company-funded</span>
                </span>
                <span style={{ fontFamily: "var(--font-mono)", color: "#1DB76A" }}>−{money(r.discount)}</span>
              </div>
            )}
            <div style={{ ...rowCell, borderBottom: "1px solid #262626", fontSize: "13px", fontWeight: 700 }}>
              <span>Rider paid</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "#00C2FF" }}>{money(r.price)}</span>
            </div>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>Driver net (85%)</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "#1DB76A" }}>{money(r.driverNet)}</span>
            </div>
            <div style={{ ...rowCell, borderBottom: "1px solid #262626" }}>
              <span style={{ color: "#6E6E6E" }}>App fee (Golfeto)</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "#5BA3FF" }}>{money(r.appFee)}</span>
            </div>
            <div style={rowCell}>
              <span style={{ color: "#6E6E6E" }}>Waiting fee</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{money(r.waitingFee)}</span>
            </div>
          </div>

          {isLive && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#6E6E6E", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: "11px" }}>Status timeline</div>
              {steps.map((st, i) => {
                const done = curIdx >= 0 && i <= curIdx;
                const current = i === curIdx;
                return (
                  <div key={st} style={{ display: "flex", alignItems: "center", gap: "11px", padding: "5px 0" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, background: done ? C.bright : "#3A3A3A", boxShadow: current ? "0 0 8px " + C.bright : "none" }} />
                    <span style={{ fontSize: "12px", fontWeight: current ? 700 : 600, color: done ? "#E5E5E5" : "#6E6E6E" }}>{st}</span>
                  </div>
                );
              })}
            </div>
          )}

          {r.review && (
            <div style={{ background: "#1E1E1E", border: "1px solid #2A2A2A", borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "7px" }}>
                <span style={{ color: "#FFA726", fontSize: "15px" }}>★ {r.rating}/5</span>
              </div>
              <div style={{ fontSize: "12.5px", color: "#C5C5C5", lineHeight: 1.5, fontStyle: "italic" }}>&ldquo;{r.review}&rdquo;</div>
            </div>
          )}

          {r.cancelledBy && (
            <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ fontSize: "11px", color: "#FCA5A5", fontWeight: 700, marginBottom: "5px" }}>CANCELLED BY {r.cancelledBy}</div>
              <div style={{ fontSize: "12.5px", color: "#E5B4B4" }}>{r.cancelReason}</div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ===================== OFFER FORM =====================

  function renderOfferForm() {
    const label: CSSProperties = { display: "block", fontSize: "11.5px", fontWeight: 600, color: "#A0A0A0", marginBottom: "6px" };
    const field: CSSProperties = { width: "100%", height: "38px", background: "#121212", border: "1px solid #333", borderRadius: "9px", padding: "0 12px", color: "#fff", outline: "none" };
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 95, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div onClick={() => setOfferForm(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }} />
        <div style={{ position: "relative", width: "440px", maxWidth: "92vw", background: "#161616", border: "1px solid #2A2A2A", borderRadius: "16px", boxShadow: "0 24px 70px rgba(0,0,0,.6)", overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #262626", fontWeight: 700, fontSize: "15px" }}>New offer</div>
          <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={label}>Code (UPPERCASE)</label>
                <input value={offerDraft.code} onChange={(e) => setOfferDraft((s) => ({ ...s, code: e.target.value }))} placeholder="SUMMER25" style={{ ...field, fontFamily: "var(--font-mono)", textTransform: "uppercase" }} />
              </div>
              <div>
                <label style={label}>Type</label>
                <select value={offerDraft.type} onChange={(e) => setOfferDraft((s) => ({ ...s, type: e.target.value }))} style={{ ...field, padding: "0 10px" }}>
                  <option value="percent">percent</option>
                  <option value="fixed">fixed</option>
                </select>
              </div>
            </div>
            <div>
              <label style={label}>Title</label>
              <input value={offerDraft.title} onChange={(e) => setOfferDraft((s) => ({ ...s, title: e.target.value }))} placeholder="25% off your ride" style={field} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={label}>Value</label>
                <input value={offerDraft.value} onChange={(e) => setOfferDraft((s) => ({ ...s, value: e.target.value }))} placeholder="25" style={field} />
              </div>
              <div>
                <label style={label}>Max cap</label>
                <input value={offerDraft.maxDiscount} onChange={(e) => setOfferDraft((s) => ({ ...s, maxDiscount: e.target.value }))} placeholder="15" style={field} />
              </div>
              <div>
                <label style={label}>Per-user</label>
                <input value={offerDraft.perUser} onChange={(e) => setOfferDraft((s) => ({ ...s, perUser: e.target.value }))} placeholder="1" style={field} />
              </div>
            </div>
            <div style={{ background: "rgba(46,139,255,.08)", border: "1px solid rgba(46,139,255,.2)", borderRadius: "9px", padding: "10px 13px", fontSize: "11.5px", color: "#9CC4FF" }}>
              The discount is capped at 15% of the fare (the app fee). The driver is never affected.
            </div>
          </div>
          <div style={{ padding: "16px 22px", borderTop: "1px solid #262626", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={() => setOfferForm(false)} style={{ padding: "10px 18px", borderRadius: "9px", border: "1px solid #333", background: "#1E1E1E", color: "#A0A0A0", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}>
              Cancel
            </button>
            <button
              onClick={() => {
                const code = offerDraft.code.trim().toUpperCase();
                if (!code) {
                  showToast("Offer code is required");
                  return;
                }
                const type = offerDraft.type === "fixed" ? "fixed" : "percent";
                const value = parseFloat(offerDraft.value) || 0;
                const maxDiscount = offerDraft.maxDiscount ? parseFloat(offerDraft.maxDiscount) : null;
                const perUser = parseInt(offerDraft.perUser, 10) || 1;
                sync(() => createOfferAction({ code, title: offerDraft.title, type, value, maxDiscount, perUserLimit: perUser }));
                if (!configured) {
                  setOffers((l) => [
                    {
                      id: "local-" + Date.now(),
                      code,
                      title: offerDraft.title || code,
                      description: "",
                      type,
                      value,
                      maxDiscount,
                      minFare: 0,
                      active: true,
                      startsAt: "now",
                      expiresAt: "+30d",
                      usageLimit: null,
                      perUserLimit: perUser,
                      compound: "All compounds",
                      usedCount: 0,
                    },
                    ...l,
                  ]);
                }
                setOfferForm(false);
                setOfferDraft({ code: "", title: "", type: "percent", value: "", maxDiscount: "", perUser: "1" });
                showToast("Offer saved");
              }}
              style={{ padding: "10px 18px", borderRadius: "9px", border: "none", background: GRAD, color: "#fff", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
            >
              Create offer
            </button>
          </div>
        </div>
      </div>
    );
  }
}
