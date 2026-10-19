import type { FleetVehiclePosition } from "../../domain";
import { fleetHistoryPath } from "../../domain";
import { monitoringCopy } from "../copy/monitoringCopy";
import { addressDisplay } from "../utils/addressDisplay";
import { formatCardinalHeading } from "../utils/cardinalHeading";
import { formatAbsoluteTime } from "../utils/formatAbsoluteTime";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import { movementLabel } from "../utils/movementLabel";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const STATUS_COLOR: Record<FleetVehiclePosition["status"], string> = {
  online: "#10b981",
  stale: "#f59e0b",
  offline: "#a1a1aa",
};

function metaLine(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}

/**
 * HTML del popup Mapbox (sin React root): evita Link fuera de Router
 * y el placeholder roto al seleccionar desde el panel.
 */
export function buildFleetPopupHtml(position: FleetVehiclePosition): string {
  const copy = monitoringCopy.fleet;
  const modelLine = [position.vehicleBrand, position.vehicleModel]
    .filter(Boolean)
    .join(" ");
  const hasCoords =
    position.latitude != null && position.longitude != null;
  const title = escapeHtml(position.vehicleEconomicNumber);
  const model = modelLine ? ` · ${escapeHtml(modelLine)}` : "";
  const statusLabel = escapeHtml(copy.status[position.status]);
  const statusColor = STATUS_COLOR[position.status];
  const coords = hasCoords
    ? `${position.latitude!.toFixed(4)}, ${position.longitude!.toFixed(4)}`
    : escapeHtml(copy.noSignal);
  const speed =
    position.speedKmh != null && hasCoords
      ? escapeHtml(copy.speed(position.speedKmh))
      : "";
  const absolute = position.recordedAt
    ? escapeHtml(formatAbsoluteTime(position.recordedAt))
    : "";
  const relative = position.recordedAt
    ? escapeHtml(formatRelativeTime(position.recordedAt, Date.now()))
    : "";
  const movement = escapeHtml(
    movementLabel(position.movementStatus, {
      moving: copy.movement.moving,
      stopped: copy.movement.stopped,
      empty: copy.movement.empty,
    }),
  );
  const heading = formatCardinalHeading(position.courseDeg);
  const course = heading ? escapeHtml(heading.label) : "";
  const addressRaw = addressDisplay(
    position.address,
    position.addressStatus,
    copy.addressUnavailable,
  );
  const address = addressRaw ? escapeHtml(addressRaw) : "";
  const sats =
    position.satellites != null
      ? escapeHtml(copy.sats(position.satellites))
      : hasCoords
        ? escapeHtml(copy.satsEmpty)
        : "";
  const battery =
    position.batteryPct != null
      ? escapeHtml(copy.battery(position.batteryPct))
      : hasCoords
        ? escapeHtml(copy.batteryEmpty)
        : "";
  const phone = position.phone
    ? escapeHtml(copy.phone(position.phone))
    : "";
  const odometer =
    position.odometerKm != null
      ? escapeHtml(copy.odometer(position.odometerKm))
      : hasCoords
        ? escapeHtml(copy.odometerEmpty)
        : "";

  const vehicleHref = `/vehicles/${encodeURIComponent(position.vehicleId)}`;
  const historyHref = fleetHistoryPath(position.vehicleId);

  const secondaryMeta = metaLine([course, sats, battery, phone, odometer]);

  return `
    <div style="min-width:240px;max-width:280px;padding:2px 2px 4px;color:#18181b;font-family:ui-sans-serif,system-ui,sans-serif;">
      <div style="display:flex;align-items:flex-start;gap:8px;">
        <span style="margin-top:5px;width:10px;height:10px;border-radius:9999px;background:${statusColor};flex-shrink:0;"></span>
        <div style="min-width:0;">
          <p style="margin:0;font-size:13px;font-weight:600;line-height:1.25;">
            ${title}<span style="font-weight:400;color:#71717a;">${model}</span>
          </p>
          <p style="margin:2px 0 0;font-size:11px;font-weight:500;color:${statusColor};">
            ${statusLabel}${hasCoords && position.movementStatus ? ` · <span style="color:#52525b;font-weight:500;">${movement}</span>` : ""}
          </p>
        </div>
      </div>
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e4e4e7;font-size:12px;color:#52525b;">
        ${absolute ? `<p style="margin:0;font-size:12px;color:#18181b;">${absolute}</p>` : ""}
        ${relative ? `<p style="margin:2px 0 0;font-size:11px;color:#71717a;">${relative}</p>` : ""}
        ${address ? `<p style="margin:6px 0 0;font-size:11px;line-height:1.35;color:#3f3f46;">${address}</p>` : ""}
        <p style="margin:6px 0 0;font-family:ui-monospace,monospace;">${coords}</p>
        ${speed || secondaryMeta ? `<p style="margin:4px 0 0;">${metaLine([speed, secondaryMeta])}</p>` : ""}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;">
        <a href="${historyHref}" style="display:inline-flex;font-size:12px;font-weight:500;color:#059669;text-decoration:none;">
          ${escapeHtml(copy.viewHistory)} →
        </a>
        <a href="${vehicleHref}" style="display:inline-flex;font-size:12px;font-weight:500;color:#71717a;text-decoration:none;">
          ${escapeHtml(copy.viewVehicle)} →
        </a>
      </div>
    </div>
  `.trim();
}
