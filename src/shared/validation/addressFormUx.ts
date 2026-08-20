/**
 * Primitivos Zod compartidos para formularios de domicilio (solo UX).
 * Reglas SAT / CP31: `@boeltech/cfdi-domain` vía `@shared/cfdi/addressPayloadBridge`.
 *
 * Schemas por módulo:
 * - `@features/clients/presentation/validation/clientAddressSchema`
 * - `@features/settings/presentation/validation/companyFiscalAddressSchema`
 * - `@features/employees/presentation/validation/employeePersonalAddressSchema`
 * - `@features/trips/presentation/pages/create/components/validation` (paradas)
 */

import { z } from "zod";

export const ADDRESS_TYPES = [
  "billing",
  "shipping",
  "pickup",
  "warehouse",
  "office",
  "personal",
  "trip_origin",
  "trip_destination",
  "trip_stop",
  "company",
  "branch",
  "other",
] as const;

export type AddressTypeValue = (typeof ADDRESS_TYPES)[number];

export const optionalTrimmed = (max: number) =>
  z.union([z.literal(""), z.string().max(max)]).optional();

export const requiredTrimmed = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} es requerido`)
    .max(max, `${label} es muy largo`);

/** Calle y número opcionales (perfil cp31_min / personal_lax en paquete). */
export const cp31OptionalStreetFields = {
  street: z.union([z.literal(""), z.string().max(200)]).default(""),
  exteriorNumber: z.union([z.literal(""), z.string().max(20)]).default(""),
};

const CP_POSTAL_REGEX = /^\d{5}$/;

/**
 * Estado y CP obligatorios en formularios CP31 (mensajes en español, alineados al paquete).
 * Sustituye `postalCode` / `satStateCode` de {@link cp31AddressDomUxFields} al extender el schema.
 */
export const cp31RequiredSatLocationUxFields = {
  postalCode: z
    .string()
    .trim()
    .min(1, "El código postal es requerido")
    .regex(CP_POSTAL_REGEX, "El código postal debe tener 5 dígitos"),
  satStateCode: z
    .string()
    .trim()
    .min(1, "El estado es requerido")
    .max(10, "El código de estado es muy largo"),
} as const;

/** Campos núcleo SAT compartidos en formularios (sin `addressType` ni extensiones de módulo). */
export const cp31AddressDomUxFields = {
  ...cp31OptionalStreetFields,
  interiorNumber: z.string().max(20).optional().nullable(),
  reference: z.string().max(250).optional().nullable(),
  postalCode: z.string().max(5).default(""),
  satCountryCode: z.string().max(3).default("MEX"),
  satStateCode: z.string().max(10).default(""),
  satMunicipalityCode: z.string().max(10).optional().default(""),
  satLocalityCode: z.string().max(10).optional().nullable(),
  localityName: z.string().max(120).optional().nullable(),
  satNeighborhoodCode: z.string().max(10).optional().nullable(),
  neighborhoodName: z.string().max(120).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
};

function hasFiniteCoord(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

export function withLatLngPairRefinement<T extends z.ZodTypeAny>(schema: T): T {
  return schema.superRefine((value, ctx) => {
    const record = value as { latitude?: unknown; longitude?: unknown };
    const hasLat = hasFiniteCoord(record.latitude);
    const hasLng = hasFiniteCoord(record.longitude);
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Latitud y longitud deben informarse juntas",
      });
    }
  }) as T;
}

/** Base UX CP31 (sin obligar calle/número). No sustituye validación al guardar del paquete. */
export const cp31AddressDomUxSchema = withLatLngPairRefinement(
  z.object({
    id: z.string().uuid().optional(),
    addressType: z.enum(ADDRESS_TYPES),
    isPrimary: z.boolean().default(false),
    ...cp31AddressDomUxFields,
  }),
);

export type Cp31AddressDomUxValues = z.infer<typeof cp31AddressDomUxSchema>;
