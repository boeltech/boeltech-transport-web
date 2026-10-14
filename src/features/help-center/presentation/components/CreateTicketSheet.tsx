import { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  FieldInlineError,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Textarea } from "@shared/ui/text-area";
import { useToast } from "@shared/hooks/useToast";
import { cn } from "@shared/lib/utils/cn";
import { useCreateHelpTicket } from "../../application";
import { trackHelpEvent } from "../../application/trackHelpEvent";
import { hasHelpArticleViewed } from "../../infrastructure/helpSessionFlags";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const copy = helpCenterCopy.createTicket;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const ACCEPT_STRING = "image/jpeg,image/png,image/webp,application/pdf";

const BODY_FIELD_ID = "ticket-body";
const ATTACHMENT_FIELD_ID = "ticket-attachment";

const createTicketFormSchema = z.object({
  body: z
    .string()
    .trim()
    .min(10, copy.bodyMinChars),
});

type CreateTicketFormValues = z.infer<typeof createTicketFormSchema>;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface CreateTicketSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId?: string | null;
  articleTitle?: string | null;
  route: string;
  tenantName?: string;
}

export function CreateTicketSheet({
  open,
  onOpenChange,
  articleId,
  articleTitle,
  route,
  tenantName,
}: CreateTicketSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-md"
      >
        <SheetHeader className="shrink-0 px-0">
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription className="sr-only">
            {copy.title}
          </SheetDescription>
        </SheetHeader>
        {open ? (
          <CreateTicketSheetForm
            onOpenChange={onOpenChange}
            articleId={articleId}
            articleTitle={articleTitle}
            route={route}
            tenantName={tenantName}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function CreateTicketSheetForm({
  onOpenChange,
  articleId,
  articleTitle,
  route,
  tenantName,
}: Omit<CreateTicketSheetProps, "open">) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { success: toastSuccess, error: toastError } = useToast();
  const createTicket = useCreateHelpTicket();

  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketFormSchema),
    defaultValues: { body: "" },
    mode: "onSubmit",
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const validateFile = useCallback((f: File): boolean => {
    if (f.size > MAX_FILE_SIZE) {
      setFileError(copy.attachmentTooLarge);
      return false;
    }
    if (!ACCEPTED_MIME_TYPES.includes(f.type)) {
      setFileError(copy.attachmentInvalidType);
      return false;
    }
    setFileError(null);
    return true;
  }, []);

  const handleFileSelect = useCallback(
    (f: File | null) => {
      if (!f) {
        setFile(null);
        setFileError(null);
        return;
      }
      if (validateFile(f)) {
        setFile(f);
      } else {
        setFile(null);
      }
    },
    [validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFileSelect(dropped);
    },
    [handleFileSelect],
  );

  const onValidSubmit = useCallback(
    async (values: CreateTicketFormValues) => {
      if (fileError) return;

      const formData = new FormData();
      formData.append("body", values.body.trim());
      formData.append("route", route);
      if (articleId) formData.append("article_id", articleId);
      if (file) formData.append("attachment", file);

      try {
        const result = await createTicket.mutateAsync(formData);
        if (articleId && hasHelpArticleViewed(articleId)) {
          trackHelpEvent({
            eventName: "help_ticket_created_after_article",
            articleId,
            route,
            payload: { ticketId: result.id },
          });
        }
        toastSuccess(result.message);
        handleClose(false);
      } catch {
        toastError(copy.errorCreate);
      }
    },
    [
      fileError,
      route,
      articleId,
      file,
      createTicket,
      toastSuccess,
      toastError,
      handleClose,
    ],
  );

  const bodyError = errors.body?.message;

  return (
    <form
      className="mt-4 flex flex-1 flex-col gap-5 overflow-y-auto pb-4"
      onSubmit={handleSubmit(onValidSubmit)}
      noValidate
    >
      <section className="space-y-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {copy.contextSection}
        </h3>
        <dl className="space-y-1 text-sm">
          {tenantName && (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground">
                {copy.companyLabel}:
              </dt>
              <dd>{tenantName}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="font-medium text-muted-foreground">
              {copy.pageLabel}:
            </dt>
            <dd className="truncate font-mono text-xs">{route}</dd>
          </div>
          {articleTitle && (
            <div className="flex gap-2">
              <dt className="font-medium text-muted-foreground">
                {copy.articleLabel}:
              </dt>
              <dd>{articleTitle}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="space-y-1.5">
        <label htmlFor={BODY_FIELD_ID} className="text-sm font-medium">
          {copy.bodyLabel} *
        </label>
        <Controller
          control={control}
          name="body"
          render={({ field }) => (
            <Textarea
              id={BODY_FIELD_ID}
              {...field}
              placeholder={copy.bodyPlaceholder}
              rows={4}
              maxLength={2000}
              className="resize-none"
              error={Boolean(bodyError)}
              {...getFieldErrorAriaProps(BODY_FIELD_ID, bodyError)}
            />
          )}
        />
        {!bodyError ? (
          <p className="text-xs text-muted-foreground">{copy.bodyMinChars}</p>
        ) : (
          <FieldInlineError fieldId={BODY_FIELD_ID} message={bodyError} />
        )}
      </section>

      <section className="space-y-1.5">
        <p className="text-sm font-medium" id={`${ATTACHMENT_FIELD_ID}-label`}>
          {copy.attachmentLabel}
        </p>

        {!file && (
          <div
            role="button"
            tabIndex={0}
            aria-labelledby={`${ATTACHMENT_FIELD_ID}-label`}
            aria-invalid={fileError ? true : undefined}
            aria-describedby={
              fileError ? `${ATTACHMENT_FIELD_ID}-error` : undefined
            }
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : fileError
                  ? "border-destructive"
                  : "border-muted-foreground/25 hover:border-primary/50",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {copy.attachmentDrop}
            </span>
            <span className="text-xs text-muted-foreground/70">
              {copy.attachmentAccepted}
            </span>
          </div>
        )}

        <input
          ref={fileInputRef}
          id={ATTACHMENT_FIELD_ID}
          type="file"
          accept={ACCEPT_STRING}
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />

        {file && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              ({formatFileSize(file.size)})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => handleFileSelect(null)}
              aria-label={copy.remove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <FieldInlineError
          fieldId={ATTACHMENT_FIELD_ID}
          message={fileError ?? undefined}
        />
      </section>

      <div className="mt-auto shrink-0 border-t pt-4">
        <Button
          type="submit"
          className="w-full"
          disabled={createTicket.isPending}
        >
          {createTicket.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {createTicket.isPending ? copy.submitting : copy.submit}
        </Button>
      </div>
    </form>
  );
}
