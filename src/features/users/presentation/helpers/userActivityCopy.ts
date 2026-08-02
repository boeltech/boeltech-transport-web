/**
 * Diccionario de eventos del historial de usuarios.
 *
 * Convierte un `UserManagementEvent` en una frase legible («Ana Ruiz cambió el
 * rol de Luis Pérez») en lugar de un código de acción y un volcado de payload.
 * Lo consumen la página `/users/activity` y la tarjeta del detalle de usuario;
 * en la tarjeta el sujeto es implícito (`includeSubject: false`).
 *
 * El payload llega camelCase (`deepToCamel` en el mapper), pero el backend lo
 * escribe en snake_case: las lecturas aceptan ambas grafías.
 */

import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import {
  USER_STATUS_LABELS,
  type UserManagementEvent,
  type UserStatusType,
} from "../../domain";

/** Categoría visual del evento (define ícono y énfasis). */
export type UserActivityCategory =
  | "alta"
  | "rol"
  | "baja"
  | "invitacion"
  | "contrasena"
  | "otro";

export type UserActivitySegment =
  | { readonly kind: "text"; readonly text: string }
  | {
      readonly kind: "person";
      readonly text: string;
      /** `null` cuando no hay ficha a la que enlazar (sistema, cuenta eliminada, invitado). */
      readonly userId: string | null;
    };

export interface UserActivityDescription {
  readonly category: UserActivityCategory;
  /** Cambios sensibles (rol y suspensión) que se resaltan en la lista. */
  readonly emphasis: boolean;
  readonly sentence: readonly UserActivitySegment[];
  readonly detail: string | null;
}

export interface DescribeUserActivityOptions {
  /** Nombre del sujeto ya resuelto contra el directorio de usuarios. */
  readonly subjectName?: string | null;
  /** `false` en la tarjeta del detalle: el sujeto es la cuenta que ya se está viendo. */
  readonly includeSubject?: boolean;
}

const SYSTEM_ACTOR = "El sistema";
const DELETED_SUBJECT = "una cuenta eliminada";
const UNKNOWN_SUBJECT = "una cuenta";
const UNKNOWN_VALUE = "—";

type Payload = Record<string, unknown>;

function text(value: string): UserActivitySegment {
  return { kind: "text", text: value };
}

function readValue(payload: Payload, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function readString(payload: Payload, ...keys: string[]): string | null {
  const value = readValue(payload, ...keys);
  return typeof value === "string" && value.trim() ? value : null;
}

function readRecord(payload: Payload, ...keys: string[]): Payload | null {
  const value = readValue(payload, ...keys);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Payload;
  }
  return null;
}

function roleLabel(value: unknown): string {
  if (typeof value !== "string") return UNKNOWN_VALUE;
  return ROLE_LABELS[value as UserRole] ?? value;
}

function statusLabel(value: unknown): string {
  if (typeof value !== "string") return UNKNOWN_VALUE;
  return USER_STATUS_LABELS[value as UserStatusType] ?? value;
}

/** Nombre completo, correo o «El sistema» cuando el cambio no lo hizo una persona. */
function buildActor(event: UserManagementEvent): UserActivitySegment {
  const fullName = [event.actorFirstName, event.actorLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const label = fullName || event.actorEmail || SYSTEM_ACTOR;
  return {
    kind: "person",
    text: label,
    userId: label === SYSTEM_ACTOR ? null : event.actorUserId,
  };
}

/**
 * Sujeto del evento: nombre resuelto, correo del payload o, si la cuenta ya no
 * existe, un texto legible. Nunca un identificador.
 */
function buildSubject(
  event: UserManagementEvent,
  options: DescribeUserActivityOptions,
): UserActivitySegment | null {
  if (options.includeSubject === false) return null;

  const resolved = options.subjectName?.trim();
  if (resolved) {
    return { kind: "person", text: resolved, userId: event.subjectUserId };
  }

  const email = readString(event.payload, "email");
  if (email) {
    return { kind: "person", text: email, userId: event.subjectUserId };
  }

  return {
    kind: "person",
    text: event.subjectUserId ? DELETED_SUBJECT : UNKNOWN_SUBJECT,
    userId: null,
  };
}

interface ChangePart {
  readonly label: string;
  readonly value: string;
}

function transition(from: unknown, to: unknown): string {
  const before = typeof from === "string" && from ? from : UNKNOWN_VALUE;
  const after = typeof to === "string" && to ? to : UNKNOWN_VALUE;
  return `${before} → ${after}`;
}

function buildChangeParts(changes: Payload | null): {
  readonly parts: ChangePart[];
  readonly hasRole: boolean;
  readonly hasEmail: boolean;
} {
  if (!changes) return { parts: [], hasRole: false, hasEmail: false };

  const parts: ChangePart[] = [];
  const role = readRecord(changes, "role");
  const email = readRecord(changes, "email");
  const firstName = readRecord(changes, "firstName", "first_name");
  const lastName = readRecord(changes, "lastName", "last_name");

  if (role) {
    parts.push({
      label: "Rol",
      value: `${roleLabel(role.from)} → ${roleLabel(role.to)}`,
    });
  }
  if (email) {
    parts.push({ label: "Correo", value: transition(email.from, email.to) });
  }
  if (firstName) {
    parts.push({ label: "Nombre", value: transition(firstName.from, firstName.to) });
  }
  if (lastName) {
    parts.push({ label: "Apellido", value: transition(lastName.from, lastName.to) });
  }

  return { parts, hasRole: !!role, hasEmail: !!email };
}

function formatChangeDetail(parts: ChangePart[]): string | null {
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0].value;
  return parts.map((part) => `${part.label}: ${part.value}`).join(" · ");
}

/**
 * Frase, detalle y categoría de un evento del historial de usuarios.
 * Las acciones sin mapeo se describen como «otro cambio»: nunca se expone el código.
 */
export function describeUserActivityEvent(
  event: UserManagementEvent,
  options: DescribeUserActivityOptions = {},
): UserActivityDescription {
  const payload = event.payload ?? {};
  const actor = buildActor(event);
  const subject = buildSubject(event, options);
  const role = readString(payload, "role");
  const roleSuffix = role ? ` como ${roleLabel(role)}` : "";

  switch (event.action) {
    case "user_created": {
      const via = readString(payload, "via");
      const detail =
        via === "invitation"
          ? "Aceptó la invitación."
          : via === "auth_register"
            ? "Alta directa, sin invitación."
            : null;

      return {
        category: "alta",
        emphasis: false,
        sentence: subject
          ? [
              actor,
              text(" dio de alta a "),
              subject,
              ...(roleSuffix ? [text(roleSuffix)] : []),
            ]
          : [actor, text(` dio de alta esta cuenta${roleSuffix}`)],
        detail,
      };
    }

    case "user_updated": {
      const { parts, hasRole, hasEmail } = buildChangeParts(
        readRecord(payload, "changes"),
      );
      const detail = formatChangeDetail(parts) ?? "Se guardaron los cambios.";

      if (hasRole) {
        return {
          category: "rol",
          emphasis: true,
          sentence: subject
            ? [actor, text(" cambió el rol de "), subject]
            : [actor, text(" cambió el rol")],
          detail,
        };
      }

      if (hasEmail) {
        return {
          category: "otro",
          emphasis: false,
          sentence: subject
            ? [actor, text(" cambió el correo de "), subject]
            : [actor, text(" cambió el correo")],
          detail,
        };
      }

      return {
        category: "otro",
        emphasis: false,
        sentence: subject
          ? [actor, text(" actualizó los datos de "), subject]
          : [actor, text(" actualizó los datos de esta cuenta")],
        detail,
      };
    }

    case "status_changed": {
      const to = readString(payload, "to");
      const from = readString(payload, "from");

      if (to === "suspended") {
        return {
          category: "baja",
          emphasis: true,
          sentence: subject
            ? [actor, text(" suspendió el acceso de "), subject]
            : [actor, text(" suspendió el acceso")],
          detail: null,
        };
      }

      if (to === "inactive") {
        return {
          category: "baja",
          emphasis: false,
          sentence: subject
            ? [actor, text(" dio de baja a "), subject]
            : [actor, text(" dio de baja esta cuenta")],
          detail: null,
        };
      }

      if (to === "active") {
        return {
          category: "alta",
          emphasis: false,
          sentence: subject
            ? [actor, text(" reactivó a "), subject]
            : [actor, text(" reactivó esta cuenta")],
          detail: null,
        };
      }

      return {
        category: "otro",
        emphasis: false,
        sentence: subject
          ? [actor, text(" cambió el estado de la cuenta de "), subject]
          : [actor, text(" cambió el estado de la cuenta")],
        detail: `${statusLabel(from)} → ${statusLabel(to)}`,
      };
    }

    case "invitation_sent": {
      return {
        category: "invitacion",
        emphasis: false,
        sentence: subject
          ? [
              actor,
              text(" invitó a "),
              subject,
              ...(roleSuffix ? [text(roleSuffix)] : []),
            ]
          : [actor, text(` envió una invitación de acceso${roleSuffix}`)],
        detail: null,
      };
    }

    case "invitation_resent": {
      return {
        category: "invitacion",
        emphasis: false,
        sentence: subject
          ? [actor, text(" reenvió la invitación a "), subject]
          : [actor, text(" reenvió la invitación de acceso")],
        detail: null,
      };
    }

    case "invitation_cancelled": {
      return {
        category: "invitacion",
        emphasis: false,
        sentence: subject
          ? [actor, text(" canceló la invitación de "), subject]
          : [actor, text(" canceló la invitación de acceso")],
        detail: null,
      };
    }

    case "password_changed_self": {
      return {
        category: "contrasena",
        emphasis: false,
        sentence: [actor, text(" cambió su contraseña")],
        detail: "Se cerró la sesión en sus demás dispositivos.",
      };
    }

    case "onboarding_completed_product": {
      return {
        category: "otro",
        emphasis: false,
        sentence: [actor, text(" completó la guía de primer uso")],
        detail: null,
      };
    }

    default: {
      return {
        category: "otro",
        emphasis: false,
        sentence: subject
          ? [actor, text(" hizo otro cambio en la cuenta de "), subject]
          : [actor, text(" hizo otro cambio en la cuenta")],
        detail: null,
      };
    }
  }
}

/** Texto plano de una frase (tooltips, tests, accesibilidad). */
export function userActivitySentenceToText(
  sentence: readonly UserActivitySegment[],
): string {
  return sentence.map((segment) => segment.text).join("");
}
