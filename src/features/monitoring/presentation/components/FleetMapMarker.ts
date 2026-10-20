import type { GpsPositionStatusType } from "../../domain";
import { GPS_STATUS_COLOR } from "../config/gpsStatusStyles";

const FILL: Record<GpsPositionStatusType, string> = {
  online: "#10b981",
  stale: "#f59e0b",
  offline: "#a1a1aa",
};

/**
 * Camión esquemático vista superior (nariz arriba = norte / course 0°).
 * Un solo path: cabina + cuerpo; fill = semáforo.
 */
const TRUCK_TOP_DOWN_PATH =
  "M14 2.5 L18.5 7.5 L18.5 11 L20.5 11 L20.5 24.5 L7.5 24.5 L7.5 11 L9.5 11 L9.5 7.5 Z";

function truckSvgHtml(color: string, rotationDeg: number | null): string {
  const transform =
    rotationDeg != null
      ? `transform:rotate(${rotationDeg}deg);`
      : "";
  return `
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"
      data-fleet-marker-glyph="truck"
      style="${transform}filter:drop-shadow(0 1px 3px rgba(0,0,0,.45));">
      <path d="${TRUCK_TOP_DOWN_PATH}" fill="${color}" stroke="#fff" stroke-width="1.5"
        stroke-linejoin="round"/>
    </svg>`;
}

function pointSvgHtml(status: GpsPositionStatusType, color: string): string {
  const stroke = status === "offline" ? color : "#fff";
  const fill = status === "offline" ? "transparent" : color;
  const ring = GPS_STATUS_COLOR[status].hex;
  return `
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"
      data-fleet-marker-glyph="point"
      style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));">
      <circle cx="11" cy="11" r="7" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      ${
        status === "stale"
          ? `<circle cx="11" cy="11" r="10" fill="none" stroke="#${ring}" stroke-opacity="0.35" stroke-width="2"/>`
          : ""
      }
    </svg>`;
}

/**
 * Marcador SVG map-first compartido (flota + TripGpsMiniMap).
 * Online: camión top-down; rotación solo con course válido.
 * Stale/offline: punto (sin rotación engañosa).
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
  const rotateTruck =
    status === "online" && courseDeg != null && Number.isFinite(courseDeg);
  const alertBadge =
    unreadAlertCount > 0
      ? `<span data-fleet-marker-badge="unread" style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:9999px;background:#ef4444;border:2px solid #fff;box-shadow:0 0 0 1px rgba(239,68,68,.35);" aria-hidden="true"></span>`
      : "";

  if (status === "online") {
    el.innerHTML = `${truckSvgHtml(color, rotateTruck ? courseDeg! : null)}${alertBadge}`;
  } else {
    el.innerHTML = `${pointSvgHtml(status, color)}${alertBadge}`;
  }

  return el;
}
