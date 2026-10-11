import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useActiveClients } from "@features/clients/application";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Progress } from "@shared/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  isInvoiceBulkDownloadActive,
  isInvoiceBulkDownloadReady,
  type InvoiceBulkDownloadCriteria,
  type InvoiceBulkDownloadJob,
} from "@features/invoicing/domain";
import {
  getBulkDownloadInProgressActiveId,
  invalidateNotificationsAfterBulkDownloadTerminal,
  useCreateInvoiceBulkDownload,
  useDownloadInvoiceBulkDownloadPart,
  useInvoiceBulkDownload,
  useInvoiceBulkDownloadPreview,
} from "../../application/hooks/useInvoiceBulkDownload";
import { invoiceBulkDownloadCopy as copy } from "../copy/invoiceBulkDownloadCopy";
import {
  getMexicoCityPeriodMonth,
  getPreviousMexicoCityPeriodMonth,
} from "../utils/invoiceBulkDownloadPeriod";
import {
  invoiceBulkDownloadFormSchema,
  type InvoiceBulkDownloadFormValues,
} from "../validation/invoiceBulkDownloadSchema";

const CLIENT_NONE = "__none__";

export interface InvoiceBulkDownloadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Deep link / 409: abre en modo estado. */
  initialJobId?: string | null;
}

function defaultFormValues(
  now: Date = new Date(),
): InvoiceBulkDownloadFormValues {
  const previous = getPreviousMexicoCityPeriodMonth(now);
  return {
    periodPreset: "previous",
    periodFrom: previous,
    periodTo: previous,
    clientId: undefined,
    content: "xml_pdf",
    includePayments: true,
    includeCancelled: false,
  };
}

function resolveApiErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return copy.error.generic;
  }
  switch (error.code) {
    case "BULK_DOWNLOAD_IN_PROGRESS":
      return copy.error.inProgress;
    case "BULK_DOWNLOAD_OUTSIDE_PLAN_HISTORY": {
      const earliest = error.details?.earliest_allowed_period;
      if (typeof earliest === "string" && earliest.length > 0) {
        return copy.error.outsidePlan(earliest);
      }
      return error.message || copy.error.generic;
    }
    case "BULK_DOWNLOAD_TOO_MANY":
      return copy.error.tooMany;
    case "BULK_DOWNLOAD_EMPTY":
      return copy.error.empty;
    case "BULK_DOWNLOAD_EXPIRED":
      return copy.error.expired;
    case "INVOICE_BULK_DOWNLOAD_DISABLED":
      return copy.error.disabled;
    case "BULK_DOWNLOAD_RANGE_INVALID":
      return error.message || copy.period.maxRange;
    default:
      return error.message || copy.error.generic;
  }
}

export function InvoiceBulkDownloadSheet({
  open,
  onOpenChange,
  initialJobId = null,
}: InvoiceBulkDownloadSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-md overflow-y-auto"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{copy.sheet.title}</SheetTitle>
          <SheetDescription>{copy.sheet.description}</SheetDescription>
        </SheetHeader>
        {open ? (
          <InvoiceBulkDownloadSheetBody
            key={initialJobId ?? "form"}
            initialJobId={initialJobId}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function InvoiceBulkDownloadSheetBody({
  initialJobId = null,
}: {
  initialJobId?: string | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionJobId, setSessionJobId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState(!initialJobId);
  const previousStatusRef = useRef<string | undefined>(undefined);
  const jobId = formMode ? null : (sessionJobId ?? initialJobId ?? null);

  const form = useForm<InvoiceBulkDownloadFormValues>({
    resolver: zodResolver(
      invoiceBulkDownloadFormSchema,
    ) as Resolver<InvoiceBulkDownloadFormValues>,
    defaultValues: defaultFormValues(),
    mode: "onChange",
  });

  const { data: clients = [] } = useActiveClients({ enabled: !jobId });

  const watched = useWatch({ control: form.control });
  const parsedForm = invoiceBulkDownloadFormSchema.safeParse(watched);
  const formValid = parsedForm.success;

  const selectedClient = clients.find((c) => c.id === watched?.clientId);
  const receiverRfc = selectedClient?.taxId
    ? selectedClient.taxId.trim().toUpperCase()
    : null;

  let criteria: InvoiceBulkDownloadCriteria | null = null;
  if (parsedForm.success) {
    const values = parsedForm.data;
    criteria = {
      periodFrom: values.periodFrom,
      periodTo: values.periodTo,
      receiverRfc,
      content: values.content,
      includePayments: values.includePayments,
      includeCancelled: values.includeCancelled,
    };
  }

  const previewQuery = useInvoiceBulkDownloadPreview(criteria, {
    enabled: !jobId && formValid,
  });

  const jobQuery = useInvoiceBulkDownload(jobId, {
    enabled: Boolean(jobId),
  });

  useEffect(() => {
    const job = jobQuery.data;
    if (!job) return;
    invalidateNotificationsAfterBulkDownloadTerminal(
      queryClient,
      previousStatusRef.current,
      job,
    );
    previousStatusRef.current = job.status;
  }, [jobQuery.data, queryClient]);

  const createMutation = useCreateInvoiceBulkDownload();
  const downloadMutation = useDownloadInvoiceBulkDownloadPart({
    onSuccess: () => {
      toast({ title: copy.toasts.downloadStarted, variant: "success" });
    },
    onError: (error) => {
      toast({
        title: copy.error.downloadFailed,
        description: resolveApiErrorMessage(error),
        variant: "error",
      });
    },
  });

  const applyPreset = (preset: InvoiceBulkDownloadFormValues["periodPreset"]) => {
    const now = new Date();
    if (preset === "previous") {
      const month = getPreviousMexicoCityPeriodMonth(now);
      form.setValue("periodPreset", preset, { shouldValidate: true });
      form.setValue("periodFrom", month, { shouldValidate: true });
      form.setValue("periodTo", month, { shouldValidate: true });
      return;
    }
    if (preset === "current") {
      const month = getMexicoCityPeriodMonth(now);
      form.setValue("periodPreset", preset, { shouldValidate: true });
      form.setValue("periodFrom", month, { shouldValidate: true });
      form.setValue("periodTo", month, { shouldValidate: true });
      return;
    }
    form.setValue("periodPreset", "custom", { shouldValidate: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const client = clients.find((c) => c.id === values.clientId);
    const payload: InvoiceBulkDownloadCriteria = {
      periodFrom: values.periodFrom,
      periodTo: values.periodTo,
      receiverRfc: client?.taxId ? client.taxId.trim().toUpperCase() : null,
      content: values.content,
      includePayments: values.includePayments,
      includeCancelled: values.includeCancelled,
    };
    try {
      const job = await createMutation.mutateAsync(payload);
      toast({ title: copy.toasts.queued, variant: "success" });
      setFormMode(false);
      setSessionJobId(job.id);
    } catch (error) {
      const activeId = getBulkDownloadInProgressActiveId(error);
      if (activeId) {
        toast({
          title: copy.error.inProgress,
          variant: "warning",
        });
        setFormMode(false);
        setSessionJobId(activeId);
        return;
      }
      toast({
        title: resolveApiErrorMessage(error),
        variant: "error",
      });
    }
  });

  const summaryErrors = collectFieldErrorMessages(form.formState.errors);
  const preview = previewQuery.data;
  const previewEmpty =
    preview != null &&
    preview.invoiceCount === 0 &&
    preview.paymentCount === 0 &&
    preview.filesTotal === 0;
  const canPrepare =
    formValid &&
    preview != null &&
    !previewEmpty &&
    !preview.exceedsLimit &&
    !createMutation.isPending;

  const job = jobQuery.data;
  const statusMode = Boolean(jobId);
  const periodPreset = watched?.periodPreset;
  const periodFrom = watched?.periodFrom;
  const periodTo = watched?.periodTo;
  const clientId = watched?.clientId;
  const content = watched?.content;
  const includePayments = watched?.includePayments ?? true;
  const includeCancelled = watched?.includeCancelled ?? false;

  if (statusMode) {
    return (
      <JobStatusPanel
        job={job}
        isLoading={jobQuery.isLoading}
        isError={jobQuery.isError}
        error={jobQuery.error}
        onRetryForm={() => {
          setFormMode(true);
          setSessionJobId(null);
          form.reset(defaultFormValues());
        }}
        onDownload={(part, fileName) => {
          if (!jobId) return;
          downloadMutation.mutate({ id: jobId, part, fileName });
        }}
        downloading={downloadMutation.isPending}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {summaryErrors.length > 0 && form.formState.isSubmitted ? (
        <FormValidationSummary messages={summaryErrors} />
      ) : null}

      <fieldset className="space-y-2">
        <Legend>{copy.period.label}</Legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["previous", copy.period.previous],
              ["current", copy.period.current],
              ["custom", copy.period.custom],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={periodPreset === value ? "default" : "outline"}
              onClick={() => applyPreset(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        {periodPreset === "custom" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bulk-period-from">{copy.period.from}</Label>
              <Input
                id="bulk-period-from"
                type="month"
                {...form.register("periodFrom")}
                {...getRegisterFieldErrorProps(
                  "bulk-period-from",
                  form.formState.errors.periodFrom?.message,
                )}
              />
              <FieldInlineError
                fieldId="bulk-period-from"
                message={form.formState.errors.periodFrom?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-period-to">{copy.period.to}</Label>
              <Input
                id="bulk-period-to"
                type="month"
                {...form.register("periodTo")}
                {...getRegisterFieldErrorProps(
                  "bulk-period-to",
                  form.formState.errors.periodTo?.message,
                )}
              />
              <FieldInlineError
                fieldId="bulk-period-to"
                message={form.formState.errors.periodTo?.message}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {periodFrom === periodTo
              ? periodFrom
              : `${periodFrom} – ${periodTo}`}
          </p>
        )}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="bulk-client">{copy.client.label}</Label>
        <Select
          value={clientId ?? CLIENT_NONE}
          onValueChange={(value) => {
            form.setValue(
              "clientId",
              value === CLIENT_NONE ? undefined : value,
              { shouldValidate: true },
            );
          }}
        >
          <SelectTrigger id="bulk-client">
            <SelectValue placeholder={copy.client.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CLIENT_NONE}>{copy.client.none}</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {(client.tradeName || client.legalName) +
                  (client.taxId ? ` · ${client.taxId}` : "")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-2">
        <Legend>{copy.content.label}</Legend>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              className="accent-primary"
              checked={content === "xml_pdf"}
              onChange={() =>
                form.setValue("content", "xml_pdf", {
                  shouldValidate: true,
                })
              }
            />
            {copy.content.xmlPdf}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              className="accent-primary"
              checked={content === "xml"}
              onChange={() =>
                form.setValue("content", "xml", { shouldValidate: true })
              }
            />
            {copy.content.xmlOnly}
          </label>
        </div>
      </fieldset>

      <div className="space-y-3">
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={includePayments}
            onCheckedChange={(checked) =>
              form.setValue("includePayments", checked === true, {
                shouldValidate: true,
              })
            }
          />
          <span>{copy.includePayments}</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={includeCancelled}
            onCheckedChange={(checked) =>
              form.setValue("includeCancelled", checked === true, {
                shouldValidate: true,
              })
            }
          />
          <span>{copy.includeCancelled}</span>
        </label>
      </div>

      <p className="text-xs text-muted-foreground">{copy.help}</p>

      <PreviewBlock
        loading={previewQuery.isFetching && !preview}
        preview={preview}
        empty={previewEmpty}
        error={
          previewQuery.isError
            ? resolveApiErrorMessage(previewQuery.error)
            : null
        }
      />

      <SheetFooter className="gap-2 sm:flex-col">
        <Button type="submit" disabled={!canPrepare} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          {createMutation.isPending ? "…" : copy.prepare}
        </Button>
      </SheetFooter>
    </form>
  );
}

function Legend({ children }: { children: ReactNode }) {
  return (
    <legend className="text-sm font-medium text-foreground">{children}</legend>
  );
}

function PreviewBlock({
  loading,
  preview,
  empty,
  error,
}: {
  loading: boolean;
  preview: ReturnType<typeof useInvoiceBulkDownloadPreview>["data"];
  empty: boolean;
  error: string | null;
}) {
  if (error) {
    return <AlertWithIcon variant="destructive" title={error} />;
  }
  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">{copy.preview.loading}</p>
    );
  }
  if (!preview) return null;
  if (empty) {
    return (
      <AlertWithIcon variant="info" title={copy.preview.emptyTitle}>
        <p className="text-sm">{copy.preview.emptyHint}</p>
      </AlertWithIcon>
    );
  }
  if (preview.exceedsLimit) {
    return (
      <AlertWithIcon variant="warning" title={copy.preview.exceedsLimit} />
    );
  }
  return (
    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
      {copy.preview.summary(preview.invoiceCount, preview.paymentCount)}
    </div>
  );
}

function JobStatusPanel({
  job,
  isLoading,
  isError,
  error,
  onRetryForm,
  onDownload,
  downloading,
}: {
  job: InvoiceBulkDownloadJob | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetryForm: () => void;
  onDownload: (part: number, fileName?: string) => void;
  downloading: boolean;
}) {
  if (isLoading && !job) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">{copy.queued}</p>
    );
  }

  if (isError && !job) {
    const message = resolveApiErrorMessage(error);
    return (
      <div className="mt-6 space-y-4">
        <AlertWithIcon variant="destructive" title={message} />
        <Button type="button" variant="outline" onClick={onRetryForm}>
          {copy.error.retry}
        </Button>
      </div>
    );
  }

  if (!job) return null;

  if (job.status === "expired") {
    return (
      <div className="mt-6 space-y-4">
        <AlertWithIcon variant="warning" title={copy.error.expired} />
        <Button type="button" onClick={onRetryForm}>
          {copy.newDownload}
        </Button>
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="mt-6 space-y-4">
        <AlertWithIcon
          variant="destructive"
          title={copy.statusFailed}
        >
          <p className="text-sm">
            {job.errorMessage || copy.error.generic}
          </p>
        </AlertWithIcon>
        <Button type="button" onClick={onRetryForm}>
          {copy.error.retry}
        </Button>
      </div>
    );
  }

  if (isInvoiceBulkDownloadActive(job.status)) {
    const total = Math.max(job.filesTotal, 1);
    const pct = Math.min(
      100,
      Math.round((job.filesDone / total) * 100),
    );
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          {job.status === "queued"
            ? copy.queued
            : copy.preparing(job.filesDone, job.filesTotal)}
        </p>
        <Progress value={job.status === "queued" ? 5 : pct} />
      </div>
    );
  }

  if (isInvoiceBulkDownloadReady(job.status)) {
    const parts = job.parts.length > 0 ? job.parts : [{ part: 1, fileName: undefined as string | undefined, bytes: 0, fileCount: 0 }];
    const multi = parts.length > 1;
    const okFiles = Math.max(0, job.filesTotal - job.warningsCount);

    return (
      <div className="mt-6 space-y-4">
        <AlertWithIcon variant="success" title={copy.statusReady} />
        {job.status === "completed_with_errors" || job.warningsCount > 0 ? (
          <AlertWithIcon
            variant="warning"
            title={copy.partial(okFiles, job.filesTotal, job.warningsCount)}
          />
        ) : null}
        {job.expiresAt ? (
          <p className="text-xs text-muted-foreground">
            {copy.expires(formatDateTime(job.expiresAt))}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          {parts.map((part) => (
            <Button
              key={part.part}
              type="button"
              disabled={downloading}
              onClick={() => onDownload(part.part, part.fileName)}
            >
              <Download className="mr-2 h-4 w-4" />
              {multi
                ? copy.downloadPart(part.part, parts.length)
                : copy.downloadZip}
            </Button>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={onRetryForm}>
          {copy.newDownload}
        </Button>
      </div>
    );
  }

  return null;
}
