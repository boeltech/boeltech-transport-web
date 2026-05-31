/**
 * CatalogImportWizard Component
 * Clean Architecture - Presentation Layer
 *
 * Wizard de 4 pasos para importar catálogos desde CSV:
 * 1. Selección de archivo
 * 2. Validación y preview
 * 3. Configuración e importación
 * 4. Resultado
 *
 * ACTUALIZADO: Usa useCatalogType para mostrar versión actual y sugerir siguiente
 */

import { useState, useCallback, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import { Progress } from "@shared/ui/progress";
import { Badge } from "@shared/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
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
  AlertTriangle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Download,
  Info,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import {
  FormFieldShell,
  FormValidationSummary,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import {
  useCatalogImportWizard,
  useCatalogType,
} from "../../application/hooks";
import {
  type CatalogImportOptions,
  type CatalogImportResult,
  CATALOG_TYPE_LABELS,
} from "../../domain";
import { suggestNextVersion } from "@shared/utils/dateUtils";

// ============================================================================
// TYPES
// ============================================================================

export interface CatalogImportWizardProps {
  typeCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: CatalogImportResult) => void;
}

type WizardStep = "upload" | "validate" | "import" | "result";

// ============================================================================
// SCHEMAS
// ============================================================================

const importOptionsSchema = z.object({
  version: z.string().min(1, "La versión es requerida"),
  sourceUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  notes: z.string().optional(),
  skipErrors: z.boolean(),
  updateExisting: z.boolean(),
  deactivateMissing: z.boolean(),
});

type ImportOptionsForm = z.infer<typeof importOptionsSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export function CatalogImportWizard({
  typeCode,
  open,
  onOpenChange,
  onSuccess,
}: CatalogImportWizardProps) {
  // ══════════════════════════════════════════════════════════════════════════
  // State
  // ══════════════════════════════════════════════════════════════════════════

  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // Obtener el tipo de catálogo con su versión actual
  const { data: catalogType, isLoading: isLoadingType } =
    useCatalogType(typeCode);

  const {
    validate,
    isValidating,
    validationResult,
    resetValidation,
    import: importCatalog,
    isImporting,
    importResult,
    resetAll,
  } = useCatalogImportWizard();

  // Calcular versión sugerida basada en la versión actual
  const suggestedVersion = suggestNextVersion(
    catalogType?.currentVersion?.version,
  );

  const form = useForm<ImportOptionsForm>({
    resolver: zodResolver(importOptionsSchema),
    defaultValues: {
      version: suggestedVersion,
      sourceUrl: "",
      notes: "",
      skipErrors: true,
      updateExisting: true,
      deactivateMissing: false,
    },
  });
  const skipErrors = useWatch({ control: form.control, name: "skipErrors" });
  const updateExisting = useWatch({ control: form.control, name: "updateExisting" });
  const deactivateMissing = useWatch({
    control: form.control,
    name: "deactivateMissing",
  });

  // Actualizar el valor de versión cuando cambie la versión sugerida
  useEffect(() => {
    if (suggestedVersion && !form.formState.isDirty) {
      form.setValue("version", suggestedVersion);
    }
  }, [suggestedVersion, form]);

  const typeName = CATALOG_TYPE_LABELS[typeCode] ?? typeCode;

  // ══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ══════════════════════════════════════════════════════════════════════════

  const handleClose = useCallback(() => {
    setStep("upload");
    setFile(null);
    resetAll();
    form.reset();
    onOpenChange(false);
  }, [onOpenChange, resetAll, form]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    },
    [],
  );

  const handleValidate = useCallback(() => {
    if (!file) return;

    validate(
      { typeCode, file },
      {
        onSuccess: () => {
          setStep("validate");
        },
      },
    );
  }, [file, typeCode, validate]);

  const handleImport = useCallback(
    (data: ImportOptionsForm) => {
      if (!file) return;

      const options: CatalogImportOptions = {
        version: data.version,
        sourceUrl: data.sourceUrl || undefined,
        notes: data.notes || undefined,
        skipErrors: data.skipErrors,
        updateExisting: data.updateExisting,
        deactivateMissing: data.deactivateMissing,
      };

      importCatalog(
        { typeCode, file, options },
        {
          onSuccess: (result) => {
            setStep("result");
            onSuccess?.(result);
          },
        },
      );
    },
    [file, typeCode, importCatalog, onSuccess],
  );

  const handleBack = useCallback(() => {
    if (step === "validate") {
      setStep("upload");
      resetValidation();
    } else if (step === "import") {
      setStep("validate");
    }
  }, [step, resetValidation]);

  const handleNext = useCallback(() => {
    if (step === "validate" && validationResult?.isValid) {
      setStep("import");
    }
  }, [step, validationResult]);

  // ══════════════════════════════════════════════════════════════════════════
  // Render Steps
  // ══════════════════════════════════════════════════════════════════════════

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Información del catálogo actual */}
      {isLoadingType ? (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Cargando información del catálogo...
          </span>
        </div>
      ) : catalogType ? (
        <div className="p-4 rounded-lg bg-muted space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{catalogType.name}</span>
            {catalogType.currentVersion ? (
              <Badge variant="secondary">
                v{catalogType.currentVersion.version}
              </Badge>
            ) : (
              <Badge variant="outline">Sin versión</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <strong>{catalogType.itemsCount.toLocaleString()}</strong> items
              actuales
            </span>
            {catalogType.currentVersion && (
              <span>
                Última actualización:{" "}
                {new Date(
                  catalogType.currentVersion.publishedAt,
                ).toLocaleDateString("es-MX")}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          file && "border-green-500 bg-green-50 dark:bg-green-950",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet className="h-12 w-12 text-green-600" />
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFile(null)}
              className="mt-2"
            >
              Cambiar archivo
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium">
              Arrastra un archivo CSV aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-muted-foreground">
              Formato: código, nombre, descripción (opcional), código padre
              (opcional)
            </p>
            <label htmlFor="csv-upload">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="outline" className="mt-2" asChild>
                <span>Seleccionar archivo</span>
              </Button>
            </label>
          </div>
        )}
      </div>

      {/* Info */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Formato del archivo CSV</AlertTitle>
        <AlertDescription>
          El archivo debe contener columnas con los encabezados: <br />
          <code className="text-xs bg-muted px-1 rounded">
            codigo, nombre, descripcion, codigo_padre
          </code>
          <br />
          También se aceptan variantes en inglés (code, name, description,
          parent_code).
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handleValidate} disabled={!file || isValidating}>
          {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Validar archivo
        </Button>
      </div>
    </div>
  );

  const renderValidateStep = () => {
    if (!validationResult) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
          {validationResult.isValid ? (
            <CheckCircle className="h-8 w-8 text-green-600" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600" />
          )}
          <div>
            <p className="font-medium">
              {validationResult.isValid
                ? "Archivo válido"
                : "Archivo con errores"}
            </p>
            <p className="text-sm text-muted-foreground">
              {validationResult.validRows} de {validationResult.totalRows}{" "}
              registros válidos
            </p>
          </div>
        </div>

        {/* Errors */}
        {validationResult.errors.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-red-600">
              Errores encontrados ({validationResult.errors.length}):
            </p>
            <div className="max-h-40 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Fila</TableHead>
                    <TableHead>Errores</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResult.errors.slice(0, 10).map((err, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono">{err.row}</TableCell>
                      <TableCell className="text-red-600">
                        {err.errors.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {validationResult.errors.length > 10 && (
              <p className="text-sm text-muted-foreground">
                Y {validationResult.errors.length - 10} errores más...
              </p>
            )}
          </div>
        )}

        {/* Preview */}
        {validationResult.preview.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">Vista previa (primeros 10 registros):</p>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Padre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResult.preview.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono">{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {item.description || "—"}
                      </TableCell>
                      <TableCell className="font-mono">
                        {item.parentCode || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleNext} disabled={!validationResult.isValid}>
              Continuar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderImportStep = () => (
    <form
      onSubmit={form.handleSubmit(
        (data) => {
          setShowValidationSummary(false);
          handleImport(data);
        },
        () => setShowValidationSummary(true),
      )}
      className="space-y-6"
    >
      {/* Current version info */}
      {catalogType?.currentVersion && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Versión actual</AlertTitle>
          <AlertDescription>
            La versión actual del catálogo es{" "}
            <strong>{catalogType.currentVersion.version}</strong> con{" "}
            <strong>
              {catalogType.currentVersion.itemsCount.toLocaleString()}
            </strong>{" "}
            items.
          </AlertDescription>
        </Alert>
      )}

      <FormFieldShell
        fieldId="version"
        label="Nueva versión"
        required
        errorMessage={form.formState.errors.version?.message}
        description={
          <>
            Formato sugerido: X.Y.YYYYMMDD (ej: {suggestedVersion})
          </>
        }
      >
        <Input
          id="version"
          placeholder="ej: 1.0.20260325"
          error={Boolean(form.formState.errors.version)}
          {...form.register("version")}
          {...getFieldErrorAriaProps(
            "version",
            form.formState.errors.version?.message,
          )}
        />
      </FormFieldShell>

      <FormFieldShell
        fieldId="sourceUrl"
        label="URL de origen (opcional)"
        errorMessage={form.formState.errors.sourceUrl?.message}
      >
        <Input
          id="sourceUrl"
          placeholder="https://www.sat.gob.mx/..."
          error={Boolean(form.formState.errors.sourceUrl)}
          {...form.register("sourceUrl")}
          {...getFieldErrorAriaProps(
            "sourceUrl",
            form.formState.errors.sourceUrl?.message,
          )}
        />
      </FormFieldShell>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Input
          id="notes"
          placeholder="Notas sobre esta versión..."
          {...form.register("notes")}
        />
      </div>

      {/* Options */}
      <div className="space-y-4">
        <p className="font-medium">Opciones de importación</p>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="skipErrors"
            checked={skipErrors}
            onCheckedChange={(checked) =>
              form.setValue("skipErrors", checked === true)
            }
          />
          <Label htmlFor="skipErrors" className="font-normal">
            Omitir registros con errores y continuar
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="updateExisting"
            checked={updateExisting}
            onCheckedChange={(checked) =>
              form.setValue("updateExisting", checked === true)
            }
          />
          <Label htmlFor="updateExisting" className="font-normal">
            Actualizar registros existentes
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="deactivateMissing"
            checked={deactivateMissing}
            onCheckedChange={(checked) =>
              form.setValue("deactivateMissing", checked === true)
            }
          />
          <Label
            htmlFor="deactivateMissing"
            className="font-normal text-amber-600"
          >
            Desactivar registros que no estén en el archivo
          </Label>
        </div>
      </div>

      {/* Summary */}
      <Alert>
        <Download className="h-4 w-4" />
        <AlertTitle>Resumen de importación</AlertTitle>
        <AlertDescription>
          Se importarán <strong>{validationResult?.validRows ?? 0}</strong>{" "}
          registros al catálogo <strong>{typeName}</strong>.
          {catalogType?.itemsCount ? (
            <>
              {" "}
              Actualmente tiene{" "}
              <strong>{catalogType.itemsCount.toLocaleString()}</strong> items.
            </>
          ) : null}
        </AlertDescription>
      </Alert>

      {showValidationSummary && !form.formState.isValid ? (
        <FormValidationSummary
          messages={collectFieldErrorMessages(form.formState.errors)}
          title="Revisa la configuración de importación"
        />
      ) : null}

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isImporting}>
            {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Importar catálogo
          </Button>
        </div>
      </div>
    </form>
  );

  const renderResultStep = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-6">
        {/* Result summary */}
        <div
          className={cn(
            "flex items-center gap-4 p-6 rounded-lg",
            importResult.success
              ? "bg-green-50 dark:bg-green-950"
              : "bg-red-50 dark:bg-red-950",
          )}
        >
          {importResult.success ? (
            <CheckCircle className="h-12 w-12 text-green-600" />
          ) : (
            <AlertTriangle className="h-12 w-12 text-amber-600" />
          )}
          <div>
            <p className="text-lg font-medium">
              {importResult.success
                ? "Importación completada"
                : "Importación completada con errores"}
            </p>
            <p className="text-sm text-muted-foreground">
              Versión: {importResult.version} • Tiempo:{" "}
              {(importResult.duration / 1000).toFixed(2)} segundos
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted text-center">
            <p className="text-2xl font-bold">{importResult.totalRows}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {importResult.insertedCount}
            </p>
            <p className="text-sm text-muted-foreground">Insertados</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900 text-center">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {importResult.updatedCount}
            </p>
            <p className="text-sm text-muted-foreground">Actualizados</p>
          </div>
          <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900 text-center">
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {importResult.errorCount}
            </p>
            <p className="text-sm text-muted-foreground">Errores</p>
          </div>
        </div>

        {/* Errors detail */}
        {importResult.errors.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium text-red-600">Errores:</p>
            <div className="max-h-40 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Fila</TableHead>
                    <TableHead>Errores</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResult.errors.slice(0, 20).map((err, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono">{err.row}</TableCell>
                      <TableCell className="text-red-600">
                        {err.errors.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={handleClose}>Cerrar</Button>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  const stepTitles: Record<WizardStep, string> = {
    upload: "Seleccionar archivo",
    validate: "Validar datos",
    import: "Configurar importación",
    result: "Resultado",
  };

  const stepProgress: Record<WizardStep, number> = {
    upload: 25,
    validate: 50,
    import: 75,
    result: 100,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar catálogo: {typeName}
          </DialogTitle>
          <DialogDescription>{stepTitles[step]}</DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground" aria-live="polite">
            <span>Paso {Object.keys(stepTitles).indexOf(step) + 1} de 4</span>
            <span>{stepProgress[step]}%</span>
          </div>
          <Progress value={stepProgress[step]} className="h-2" />
        </div>

        {/* Step content */}
        <div className="py-4">
          {step === "upload" && renderUploadStep()}
          {step === "validate" && renderValidateStep()}
          {step === "import" && renderImportStep()}
          {step === "result" && renderResultStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CatalogImportWizard;
