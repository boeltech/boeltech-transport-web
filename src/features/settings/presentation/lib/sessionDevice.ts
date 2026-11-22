/**
 * Helpers de dispositivo / sesión para Mi cuenta → Seguridad (MC8).
 * Sin user agent crudo en UI (puede ir en title).
 */

import type { AuthSessionItem } from "@features/auth";
import { securitySettingsCopy as copy } from "../copy/securitySettingsCopy";

export function describeUserAgent(ua: string | null): string {
  if (!ua?.trim()) {
    return copy.sessions.unknownDevice;
  }

  let browser = "Navegador";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";

  let os = "";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";

  return os ? `${browser} · ${os}` : browser;
}

export function sessionDeviceKind(
  ua: string | null,
): "tablet" | "phone" | "laptop" | "monitor" {
  if (ua && /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (ua && /Mobile|iPhone|Android/i.test(ua)) return "phone";
  if (ua) return "laptop";
  return "monitor";
}

export function formatSessionWhen(
  iso: string | null,
  nowMs: number = Date.now(),
): string {
  if (!iso) return "—";
  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return iso;
    const diffMs = nowMs - then;
    if (diffMs >= 0 && diffMs < 2 * 60 * 1000) {
      return copy.sessions.lastUsedNow;
    }
    return new Date(iso).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function formatSessionStarted(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Current session first; stable order for the rest. */
export function sortSessionsCurrentFirst(
  sessions: AuthSessionItem[],
): AuthSessionItem[] {
  return [...sessions].sort((a, b) => {
    if (a.current === b.current) return 0;
    return a.current ? -1 : 1;
  });
}

/** Lista natural ES: «A y B» / «A, B y C». */
export function formatSpanishNaturalList(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} y ${labels[1]}`;
  const head = labels.slice(0, -1).join(", ");
  return `${head} y ${labels[labels.length - 1]}`;
}

/**
 * Body del confirm «Cerrar las demás» (VIS H1 / V3 Estados).
 * - N=1 → singular
 * - N=2–3 etiquetas distintas → lista natural + plural
 * - N>3 o repeticiones → copy por conteo (legible con N grande)
 */
export function formatRevokeOthersDescription(deviceLabels: string[]): string {
  const n = deviceLabels.length;
  if (n === 0) return "";
  if (n === 1) {
    return copy.revokeOthersDialog.descriptionSingular(deviceLabels[0]!);
  }
  const unique = [...new Set(deviceLabels)];
  if (n <= 3 && unique.length === n) {
    return copy.revokeOthersDialog.descriptionList(
      formatSpanishNaturalList(unique),
    );
  }
  return copy.revokeOthersDialog.descriptionCount(n);
}
