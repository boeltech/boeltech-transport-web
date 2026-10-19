import { z } from "zod";
import { monitoringCopy } from "./copy/monitoringCopy";

const copy = monitoringCopy.linkSheet;

export const linkGpsDeviceSchema = z.object({
  imei: z
    .string({ error: copy.imeiRequired })
    .trim()
    .min(1, copy.imeiRequired)
    .regex(/^\d{15}$/, copy.imeiInvalid),
});

export type LinkGpsDeviceFormValues = z.infer<typeof linkGpsDeviceSchema>;
