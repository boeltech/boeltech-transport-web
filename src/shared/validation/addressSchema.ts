import { z } from "zod";

const ADDRESS_TYPES = [
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

export const addressSchema = z
  .object({
    id: z.string().uuid().optional(),
    addressType: z.enum(ADDRESS_TYPES),
    street: z.string().min(1, "Calle requerida").max(200),
    exteriorNumber: z.string().min(1, "Numero exterior requerido").max(20),
    interiorNumber: z.string().max(20).optional().nullable(),
    reference: z.string().max(250).optional().nullable(),
    postalCode: z.string().regex(/^\d{5}$/, "CP: 5 digitos"),
    satCountryCode: z.string().default("MEX"),
    satStateCode: z
      .string()
      .min(2, "Estado requerido")
      .max(5, "Codigo de estado invalido"),
    /** En Carta Porte 3.1 el domicilio puede omitir municipio/localidad/colonia si no se envían. */
    satMunicipalityCode: z.preprocess(
      (v) => (v === undefined || v === null ? "" : v),
      z.union([
        z.literal(""),
        z
          .string()
          .min(2, "Codigo de municipio invalido")
          .max(5, "Codigo de municipio invalido"),
      ]),
    ),
    satLocalityCode: z
      .string()
      // SAT localidad puede venir como código corto ("01")
      // o compuesto por estado + consecutivo ("AGU-01").
      .max(10, "Codigo de localidad invalido")
      .regex(/^[A-Z0-9-]*$/i, "Codigo de localidad invalido")
      .optional()
      .nullable(),
    satNeighborhoodCode: z
      .string()
      .max(10, "Codigo de colonia SAT invalido")
      .optional()
      .nullable(),
    neighborhoodName: z.string().max(120).optional().nullable(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    isPrimary: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    const hasLat = value.latitude != null;
    const hasLng = value.longitude != null;

    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Latitud y longitud deben informarse juntas",
      });
    }
  });

/**
 * Mismo contrato que `addressSchema`.
 * El SAT no exige localidad ni colonia en el complemento si no se envían;
 * no añadimos refinamientos extra frente al formulario canónico de domicilio.
 */
export const cartaPorteReadyAddressSchema = addressSchema;

export type AddressFormValues = z.infer<typeof addressSchema>;
