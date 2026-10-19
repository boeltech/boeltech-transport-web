import type { GpsPositionStatusType } from "../../domain";
import { GPS_STATUS_COLOR } from "../config/gpsStatusStyles";

const FILL: Record<GpsPositionStatusType, string> = {
  online: "#10b981",
  stale: "#f59e0b",
  offline: "#a1a1aa",
};

/**
 * Marcador SVG map-first: flecha direccional si online+course; punto si stale/offline.
 */
export function createFleetMarkerElement(params: {
  status: GpsPositionStatusType;
  courseDeg: number | null;
  label: string;
  /** CA-47 — badge rojo si hay alertas sin leer. */
  unreadAlertCount?: number;
}): HTMLDivElement {
  const { status, courseDeg, label, unreadAlertCount = 0 } = params;
  const el = document.createElement("div");
  el.className = "fleet-map-marker";
  el.style.cssText =
    "position:relative;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;";
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", label);
  el.tabIndex = 0;

  const color = FILL[status];
  const showArrow =
    status === "online" && courseDeg != null && Number.isFinite(courseDeg);
  const rotation = showArrow ? courseDeg! : 0;
  const alertBadge =
    unreadAlertCount > 0
      ? `<span style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:9999px;background:#ef4444;border:2px solid #fff;box-shadow:0 0 0 1px rgba(239,68,68,.35);" aria-hidden="true"></span>`
      : "";

  if (showArrow) {
    el.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"
        style="transform:rotate(${rotation}deg);filter:drop-shadow(0 1px 3px rgba(0,0,0,.45));">
        <path d="M14 3 L22 23 L14 18 L6 23 Z" fill="${color}" stroke="#fff" stroke-width="1.5"
          stroke-linejoin="round"/>
      </svg>${alertBadge}`;
  } else {
    const stroke = status === "offline" ? color : "#fff";
    const fill = status === "offline" ? "transparent" : color;
    const ring = GPS_STATUS_COLOR[status].hex;
    el.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"
        style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));">
        <circle cx="11" cy="11" r="7" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
        ${
          status === "stale"
            ? `<circle cx="11" cy="11" r="10" fill="none" stroke="#${ring}" stroke-opacity="0.35" stroke-width="2"/>`
            : ""
        }
      </svg>${alertBadge}`;
  }

  return el;
}
