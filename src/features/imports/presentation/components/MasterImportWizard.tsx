/**
 * MasterImportWizard — Dialog 4 pasos para carga desde archivo (ADR-0074).
 * Flujo: archivo → revisión → confirmar → resultado (contrato API intacto).
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import { Progress } from "@shared/ui/progress";
import { Badge } from "@shared/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Download,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { getErrorMessage } from "@shared/utils/errorMapper";
import {
  DEFAULT_IMPORT_OPTIONS,
  IMPORT_IMPLEMENTED_ENTITY_TYPES,
  type ImportCommitResult,
  type ImportImplementedEntityType,
  type ImportOptions,
  type ImportPreviewResult,
} from "../../domain";
import {
  useCommitImport,
  useDownloadImportJobErrors,
  useDownloadImportTemplate,
  useValidateImport,
} from "../../application";
import { importsCopy } from "../copy/importsCopy";
import { ImportTemplateGuidePanel } from "./ImportTemplateGuidePanel";

export interface MasterImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tipo de entidad. Si `lockEntityType`, no se puede cambiar en el paso Archivo. */
  entityType?: ImportImplementedEntityType;
  lockEntityType?: boolean;
  onSuccess?: (result: ImportCommitResult) => void;
}

type WizardStep = "upload" | "validate" | "options" | "result";

const STEP_ORDER: WizardStep[] = ["upload", "validate", "options", "result"];

/**
 * Remount al abrir: estado fresco sin reset en useEffect
 * (evita react-hooks/set-state-in-effect).
 */
export function MasterImportWizard(props: MasterImportWizardProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open ? <MasterImportWizardContent {...props} /> : null}
    </Dialog>
  );
}

function MasterImportWizardContent({
  onOpenChange,
  entityType: entityTypeProp,
  lockEntityType = false,
  onSuccess,
}: MasterImportWizardProps) {
  const copy = importsCopy.wizard;

  const [step, setStep] = useState<WizardStep>("upload");
  const [entityType, setEntityType] = useState<ImportImplementedEntityType>(
    entityTypeProp ?? "clients",
  );
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(
    null,
  );
  const [options, setOptions] = useState<ImportOptions>(DEFAULT_IMPORT_OPTIONS);
  const [actionError, setActionError] = useState<string | null>(null);

  const downloadTemplate = useDownloadImportTemplate({
    onError: (err) =>
      setActionError(getErrorMessage(err) || importsCopy.errors.templateFailed),
  });

  const downloadErrors = useDownloadImportJobErrors({
    onError: (err) =>
      setActionError(
        getErrorMessage(err) || importsCopy.errors.errorsDownloadFailed,
      ),
  });

  const validateMutation = useValidateImport({
    onSuccess: (result) => {
      setPreview(result);
      setOptions(result.optionsDefaults ?? DEFAULT_IMPORT_OPTIONS);
      setActionError(null);
      setStep("validate");
    },
    onError: (err) => {
      setActionError(getErrorMessage(err) || importsCopy.errors.validateFailed);
    },
  });

  const commitMutation = useCommitImport({
    onSuccess: (result) => {
      setCommitResult(result);
      setActionError(null);
      setStep("result");
      onSuccess?.(result);
    },
    onError: (err) => {
      setActionError(getErrorMessage(err) || importsCopy.errors.commitFailed);
    },
  });

  const stepIndex = STEP_ORDER.indexOf(step);
  const progressValue = ((stepIndex + 1) / STEP_ORDER.length) * 100;
  const isBusy =
    validateMutation.isPending ||
    commitMutation.isPending ||
    downloadErrors.isPending;

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setActionError(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && dropped.name.toLowerCase().endsWith(".csv")) {
      handleFileChange(dropped);
    } else if (dropped) {
      setActionError(copy.upload.csvOnly);
    }
  };

  const handleValidate = () => {
    if (!file) return;
    setActionError(null);
    validateMutation.mutate({ entityType, file, options });
  };

  const handleCommit = () => {
    if (!preview?.id) return;
    setActionError(null);
    commitMutation.mutate({ id: preview.id, options });
  };

  const handleDownloadErrors = (jobId: string) => {
    setActionError(null);
    downloadErrors.mutate(jobId);
  };

  const canProceedFromValidate =
    preview != null && preview.status === "validated" && preview.validCount > 0;

  const title =
    lockEntityType || entityTypeProp
      ? copy.title(entityType)
      : copy.titleGeneric;

  const loadOrderHint = copy.loadOrderHint(entityType, lockEntityType);

  const renderUploadStep = () => (
    <div className="space-y-6">
      {loadOrderHint ? (
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertDescription>{loadOrderHint}</AlertDescription>
        </Alert>
      ) : null}

      {!lockEntityType ? (
        <div className="space-y-2">
          <Label htmlFor="import-entity-type">{copy.upload.entityLabel}</Label>
          <Select
            value={entityType}
            onValueChange={(v) =>
              setEntityType(v as ImportImplementedEntityType)
            }
          >
            <SelectTrigger id="import-entity-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMPORT_IMPLEMENTED_ENTITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {importsCopy.entityPicker[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <ImportTemplateGuidePanel entityType={entityType} />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadTemplate.mutate(entityType)}
          disabled={downloadTemplate.isPending}
        >
          {downloadTemplate.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {copy.upload.downloadTemplate}
        </Button>
      </div>

      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{copy.upload.dragHint}</p>
        <Label htmlFor="import-csv-file" className="cursor-pointer">
          <span className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            <Upload className="h-4 w-4" />
            {copy.upload.chooseFile}
          </span>
          <input
            id="import-csv-file"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </Label>
        {file ? (
          <p className="text-sm font-medium">{copy.upload.selected(file.name)}</p>
        ) : null}
      </div>

      {validateMutation.isPending ? (
        <Alert variant="info">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>{copy.pendingHint}</AlertDescription>
        </Alert>
      ) : null}

      {actionError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{importsCopy.errors.validateFailed}</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={handleClose}>
          {copy.cancel}
        </Button>
        <Button
          type="button"
          onClick={handleValidate}
          disabled={!file || validateMutation.isPending}
        >
          {validateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {copy.upload.next}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderValidateStep = () => {
    if (!preview) return null;
    const sampleErrors = preview.errors.slice(0, 10);
    const hiddenErrorCount = Math.max(0, preview.errorCount - sampleErrors.length);
    const sampleRows = preview.previewRows.slice(0, 20);

    return (
      <div className="space-y-6">
        {/* D5: resumen primero */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={canProceedFromValidate ? "default" : "destructive"}
              className="px-3 py-1 text-sm"
            >
              {copy.validate.summary(
                preview.validCount,
                preview.errorCount,
                preview.rowCount,
              )}
            </Badge>
            {preview.errorCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownloadErrors(preview.id)}
                disabled={downloadErrors.isPending}
              >
                {downloadErrors.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {copy.validate.downloadErrors}
              </Button>
            ) : null}
          </div>

          {!canProceedFromValidate ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>{copy.validate.failedTitle}</AlertTitle>
              <AlertDescription>{copy.validate.failedDescription}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        {/* D5: errores antes del preview */}
        {sampleErrors.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{copy.validate.errorsTitle}</h4>
            <ul className="max-h-36 space-y-1.5 overflow-auto rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
              {sampleErrors.map((err) => (
                <li key={`${err.rowNumber}-${err.codes.join(",")}`}>
                  {copy.validate.rowLabel(
                    err.rowNumber,
                    err.messages.join("; "),
                  )}
                </li>
              ))}
            </ul>
            {hiddenErrorCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {copy.validate.moreErrors(hiddenErrorCount)}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* D5: preview secundario */}
        {sampleRows.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {copy.validate.previewTitle}
            </h4>
            <div className="max-h-40 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.validate.colRow}</TableHead>
                    <TableHead>{copy.validate.colKey}</TableHead>
                    <TableHead>{copy.validate.colAction}</TableHead>
                    <TableHead>{copy.validate.colStatus}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleRows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell className="tabular-nums">{row.rowNumber}</TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm">
                        {row.naturalKey ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {copy.validate.rowAction(row.action)}
                      </TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {copy.validate.valid}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <XCircle className="h-3.5 w-3.5" />
                            {copy.validate.invalid}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}

        {actionError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setStep("upload")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {copy.validate.back}
          </Button>
          <Button
            type="button"
            onClick={() => setStep("options")}
            disabled={!canProceedFromValidate}
          >
            {copy.validate.next}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderOptionsStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className="flex items-start gap-3">
          <Checkbox
            checked={options.updateExisting}
            onCheckedChange={(checked) =>
              setOptions((prev) => ({
                ...prev,
                updateExisting: checked === true,
              }))
            }
          />
          <span>
            <span className="block text-sm font-medium">
              {copy.options.updateExisting}
            </span>
            <span className="text-xs text-muted-foreground">
              {copy.options.updateExistingHint}
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <Checkbox
            checked={options.skipErrors}
            onCheckedChange={(checked) =>
              setOptions((prev) => ({
                ...prev,
                skipErrors: checked === true,
              }))
            }
          />
          <span>
            <span className="block text-sm font-medium">
              {copy.options.skipErrors}
            </span>
            <span className="text-xs text-muted-foreground">
              {copy.options.skipErrorsHint}
            </span>
          </span>
        </label>
      </div>

      {commitMutation.isPending ? (
        <Alert variant="info">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>{copy.pendingHint}</AlertDescription>
        </Alert>
      ) : null}

      {actionError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{importsCopy.errors.commitFailed}</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setStep("validate")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {copy.options.back}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            {copy.options.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleCommit}
            disabled={commitMutation.isPending}
          >
            {commitMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {copy.options.confirm}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderResultStep = () => {
    if (!commitResult) return null;
    const hasErrors = commitResult.errorCount > 0;
    return (
      <div className="space-y-6">
        <Alert variant={hasErrors ? "warning" : undefined}>
          {hasErrors ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {hasErrors ? copy.result.partialTitle : copy.result.successTitle}
          </AlertTitle>
          <AlertDescription>
            <p className="text-base font-medium tabular-nums">
              {copy.result.counts(
                commitResult.insertedCount,
                commitResult.updatedCount,
                commitResult.skippedCount,
                commitResult.errorCount,
              )}
            </p>
          </AlertDescription>
        </Alert>

        {actionError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex justify-end gap-2">
          {hasErrors ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDownloadErrors(commitResult.id)}
              disabled={downloadErrors.isPending}
            >
              {downloadErrors.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {copy.result.downloadErrors}
            </Button>
          ) : null}
          <Button type="button" onClick={handleClose}>
            {copy.result.close}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{copy.description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-2" aria-live="polite">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {copy.steps[step]} ({stepIndex + 1}/{STEP_ORDER.length})
            {isBusy ? "…" : ""}
          </span>
        </div>
        <Progress value={progressValue} />
      </div>

      {step === "upload" && renderUploadStep()}
      {step === "validate" && renderValidateStep()}
      {step === "options" && renderOptionsStep()}
      {step === "result" && renderResultStep()}
    </DialogContent>
  );
}
