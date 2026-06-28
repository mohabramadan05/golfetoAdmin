import type { CSSProperties, ReactNode } from "react";

export const C = {
  deep: "#1A3FD4",
  bright: "#2E8BFF",
  light: "#5BA3FF",
  cyan: "#00C2FF",
  green: "#1DB76A",
  amber: "#FFA726",
  red: "#EF4444",
  grey: "#9E9E9E",
};

export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function money(n: number, d?: number): string {
  const dec = d === undefined ? (n % 1 ? 2 : 0) : d;
  return (
    "E£" +
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    })
  );
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_PALETTE = ["#2E8BFF", "#00C2FF", "#5BA3FF", "#7C6FF0", "#3FB0D8"];

export function avColor(name: string): string {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
  return AVATAR_PALETTE[h];
}

export function avatar(name: string, size = 30): CSSProperties {
  const c = avColor(name);
  return {
    width: size + "px",
    height: size + "px",
    borderRadius: "50%",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: (size >= 40 ? 15 : 12) + "px",
    background: hexA(c, 0.18),
    color: c,
    border: "1px solid " + hexA(c, 0.3),
  };
}

export function chipStyle(color: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "2px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
    background: hexA(color, 0.15),
    color,
    whiteSpace: "nowrap",
  };
}

export function Chip({
  color,
  label,
  dot,
}: {
  color: string;
  label: ReactNode;
  dot?: boolean;
}) {
  return (
    <span style={chipStyle(color)}>
      {dot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: color,
          }}
        />
      )}
      {label}
    </span>
  );
}

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  width?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 18, color = "currentColor", width = 1.9, style }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: width,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style,
  };
  const paths: Record<string, ReactNode> = {
    dashboard: (
      <>
        <rect x={3} y={3} width={7} height={9} rx={1.5} />
        <rect x={14} y={3} width={7} height={5} rx={1.5} />
        <rect x={14} y={12} width={7} height={9} rx={1.5} />
        <rect x={3} y={16} width={7} height={5} rx={1.5} />
      </>
    ),
    settlement: (
      <>
        <rect x={2.5} y={6} width={19} height={12} rx={2} />
        <circle cx={12} cy={12} r={2.6} />
        <path d="M6 9.5v5M18 9.5v5" />
      </>
    ),
    driver: (
      <>
        <rect x={3} y={5} width={18} height={14} rx={2.5} />
        <circle cx={8.5} cy={11} r={2} />
        <path d="M5.5 16c.6-1.7 4.3-1.7 5 0M14 9.5h4M14 13h4" />
      </>
    ),
    live: (
      <>
        <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" />
        <circle cx={12} cy={10} r={2.4} />
      </>
    ),
    history: (
      <>
        <circle cx={12} cy={12} r={8.5} />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
    rider: (
      <>
        <circle cx={12} cy={8} r={3.6} />
        <path d="M5.5 19.5c.8-3.4 4-5 6.5-5s5.7 1.6 6.5 5" />
      </>
    ),
    offer: (
      <>
        <path d="M3.5 12.5 11 5h7.5V12.5L11 20Z" />
        <circle cx={15} cy={9} r={1.4} />
      </>
    ),
    compound: (
      <>
        <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2Z" />
        <path d="M9 4v14M15 6v14" />
      </>
    ),
    pricing: (
      <>
        <rect x={5} y={3} width={14} height={18} rx={2.5} />
        <path d="M9 7h6M9 11h.01M12 11h.01M15 11v4M9 14h.01M12 14h.01M9 17h3" />
      </>
    ),
    settings: (
      <>
        <path d="M5 7h14M5 12h14M5 17h14" />
        <circle cx={9} cy={7} r={1.8} fill={color} />
        <circle cx={15} cy={12} r={1.8} fill={color} />
        <circle cx={8} cy={17} r={1.8} fill={color} />
      </>
    ),
    search: (
      <>
        <circle cx={11} cy={11} r={7} />
        <path d="m20 20-3.2-3.2" />
      </>
    ),
    bell: (
      <>
        <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </>
    ),
    check: <path d="M5 12.5 10 17l9-10" />,
    car: (
      <>
        <path d="M4 13l1.5-4.5A2 2 0 0 1 7.4 7h9.2a2 2 0 0 1 1.9 1.5L20 13v5h-2.5M4 18v-5m0 5h2.5M4 13h16" />
        <circle cx={7.5} cy={18} r={1.6} />
        <circle cx={16.5} cy={18} r={1.6} />
      </>
    ),
    money: (
      <>
        <circle cx={12} cy={12} r={8.5} />
        <path d="M12 7.5v9M14.2 9.3c-.5-.7-1.4-1-2.2-1-1.3 0-2.3.7-2.3 1.8 0 2.5 4.8 1.2 4.8 3.8 0 1.1-1.1 1.8-2.5 1.8-1 0-1.9-.4-2.4-1.1" />
      </>
    ),
    block: (
      <>
        <circle cx={12} cy={12} r={8.5} />
        <path d="m6.5 6.5 11 11" />
      </>
    ),
    star: <path d="M12 4l2.2 4.7 5 .6-3.7 3.5 1 5L12 15.9 7.5 18.3l1-5L4.8 9.8l5-.6Z" />,
    route: (
      <>
        <circle cx={6} cy={7} r={2.2} />
        <circle cx={18} cy={17} r={2.2} />
        <path d="M6 9.2v3.3a4 4 0 0 0 4 4h5.8" />
      </>
    ),
    percent: (
      <>
        <path d="M6 18 18 6" />
        <circle cx={7.5} cy={7.5} r={2} />
        <circle cx={16.5} cy={16.5} r={2} />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    zoom: (
      <>
        <circle cx={11} cy={11} r={7} />
        <path d="m20 20-3.2-3.2M11 8.5v5M8.5 11h5" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s6-5 6-10a6 6 0 0 0-12 0c0 5 6 10 6 10Z" />
        <circle cx={12} cy={11} r={2} />
      </>
    ),
    flag: <path d="M6 21V4M6 4h11l-2 3.5L17 11H6" />,
    doc: (
      <>
        <path d="M7 3h7l4 4v14H7Z" />
        <path d="M14 3v4h4M9.5 13h5M9.5 16.5h5" />
      </>
    ),
    clock: (
      <>
        <circle cx={12} cy={12} r={8.5} />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
    refresh: (
      <>
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        <path d="M3 21v-5h5" />
      </>
    ),
  };
  return <svg {...common}>{paths[name] ?? <circle cx={12} cy={12} r={8} />}</svg>;
}
