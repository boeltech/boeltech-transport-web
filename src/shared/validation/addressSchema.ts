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
    satMunicipalityCode: z
      .string()
      .min(2, "Municipio requerido")
      .max(5, "Codigo de municipio invalido"),
    satLocalityCode: z
      .string()
      .max(5, "Codigo de localidad invalido")
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
    const hasNeighborhoodCode = Boolean(value.satNeighborhoodCode);
    const hasNeighborhoodName = Boolean(value.neighborhoodName);

    if (!hasNeighborhoodCode && !hasNeighborhoodName) {
      ctx.addIssue({
        code: "custom",
        path: ["satNeighborhoodCode"],
        message:
          "Debes seleccionar colonia SAT o capturar una colonia manual",
      });
    }

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

export const cartaPorteReadyAddressSchema = addressSchema.superRefine(
  (value, ctx) => {
    if (!value.satLocalityCode) {
      ctx.addIssue({
        code: "custom",
        path: ["satLocalityCode"],
        message: "Localidad requerida para Carta Porte",
      });
    }

    if (!value.satNeighborhoodCode) {
      ctx.addIssue({
        code: "custom",
        path: ["satNeighborhoodCode"],
        message: "Colonia SAT requerida para Carta Porte",
      });
    }
  },
);

export type AddressFormValues = z.infer<typeof addressSchema>;
