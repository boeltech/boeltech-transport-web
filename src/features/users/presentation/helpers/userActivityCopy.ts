import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { USER_STATUS_LABELS, type UserStatusType } from "../../domain";

export function formatUserActivityAction(action: string): string {
  switch (action) {
    case "user_created":
      return "Usuario creado";
    case "user_updated":
      return "Datos actualizados";
    case "status_changed":
      return "Estatus actualizado";
    case "invitation_sent":
      return "Invitación enviada";
    case "invitation_resent":
      return "Invitación reenviada";
    case "invitation_cancelled":
      return "Invitación cancelada";
    case "password_changed_self":
      return "Contraseña actualizada";
    case "onboarding_completed_product":
      return "Onboarding de producto completado";
    default:
      return action;
  }
}

function roleLabel(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "—");
  return ROLE_LABELS[value as UserRole] ?? value;
}

function statusLabel(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "—");
  return USER_STATUS_LABELS[value as UserStatusType] ?? value;
}

export function summarizeUserActivityPayload(
  action: string,
  payload: Record<string, unknown>,
): string {
  if (action === "user_created") {
    const parts: string[] = [];
    if (payload.via === "invitation") parts.push("vía invitación");
    if (payload.via === "auth_register") parts.push("vía registro admin (auth)");
    if (typeof payload.email === "string") parts.push(payload.email);
    if (payload.role) parts.push(`Rol: ${roleLabel(payload.role)}`);
    return parts.join(" · ");
  }

  if (
    action === "invitation_sent" ||
    action === "invitation_resent" ||
    action === "invitation_cancelled"
  ) {
    const parts: string[] = [];
    if (typeof payload.email === "string") parts.push(payload.email);
    if (payload.role) parts.push(`Rol: ${roleLabel(payload.role)}`);
    if (typeof payload.invitation_id === "string") {
      parts.push(`Invitación: ${payload.invitation_id.slice(0, 8)}…`);
    }
    return parts.join(" · ");
  }

  if (action === "password_changed_self") {
    return "Sesiones persistentes en otros dispositivos cerradas (refresh revocados).";
  }

  if (action === "onboarding_completed_product") {
    if (typeof payload.completed_at === "string") {
      return `Registrado en servidor (${payload.completed_at}).`;
    }
    return "Asistente de primer acceso completado.";
  }

  if (action === "status_changed") {
    return `${statusLabel(payload.from)} → ${statusLabel(payload.to)}`;
  }

  if (action === "user_updated" && payload.changes && typeof payload.changes === "object") {
    const changes = payload.changes as Record<string, { from?: unknown; to?: unknown }>;
    const parts: string[] = [];
    if (changes.role) {
      parts.push(`Rol: ${roleLabel(changes.role.from)} → ${roleLabel(changes.role.to)}`);
    }
    if (changes.email) {
      parts.push(`Email: ${String(changes.email.from)} → ${String(changes.email.to)}`);
    }
    if (changes.first_name) {
      parts.push("Nombre actualizado");
    }
    if (changes.last_name) {
      parts.push("Apellido actualizado");
    }
    return parts.length > 0 ? parts.join(" · ") : "Cambios guardados";
  }

  return "";
}
