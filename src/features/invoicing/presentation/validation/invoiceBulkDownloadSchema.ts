import { z } from "zod";
import {
  inclusiveMonthSpan,
  isValidPeriodMonth,
} from "../utils/invoiceBulkDownloadPeriod";
import { invoiceBulkDownloadCopy } from "../copy/invoiceBulkDownloadCopy";

const MAX_MONTHS = 12;

export const invoiceBulkDownloadFormSchema = z
  .object({
    periodPreset: z.enum(["previous", "current", "custom"]),
    periodFrom: z.string().min(1),
    periodTo: z.string().min(1),
    clientId: z.string().optional(),
    content: z.enum(["xml_pdf", "xml"]),
    includePayments: z.boolean(),
    includeCancelled: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!isValidPeriodMonth(values.periodFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mes inicial inválido",
        path: ["periodFrom"],
      });
    }
    if (!isValidPeriodMonth(values.periodTo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mes final inválido",
        path: ["periodTo"],
      });
    }
    if (
      isValidPeriodMonth(values.periodFrom) &&
      isValidPeriodMonth(values.periodTo) &&
      values.periodTo < values.periodFrom
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El mes final debe ser mayor o igual al inicial",
        path: ["periodTo"],
      });
    }
    if (
      isValidPeriodMonth(values.periodFrom) &&
      isValidPeriodMonth(values.periodTo) &&
      inclusiveMonthSpan(values.periodFrom, values.periodTo) > MAX_MONTHS
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: invoiceBulkDownloadCopy.period.maxRange,
        path: ["periodTo"],
      });
    }
  });

export type InvoiceBulkDownloadFormValues = z.infer<
  typeof invoiceBulkDownloadFormSchema
>;
