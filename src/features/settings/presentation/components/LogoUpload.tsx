/**
 * LogoUpload Component
 *
 * Componente para subir y gestionar el logo de la empresa.
 *
 * Ubicación: src/features/settings/ui/components/LogoUpload.tsx
 */

import { memo, useCallback, useState } from "react";
import { ImagePlus, Trash2, Loader2, Upload } from "lucide-react";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@shared/ui/alert-dialog";
import { SettingsCard } from "./SettingsLayout";
import {
  useCompanySettings,
  useUploadLogo,
  useDeleteLogo,
} from "../../application/hooks";

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

// ============================================================================
// COMPONENT
// ============================================================================

export const LogoUpload = memo(function LogoUpload() {
  const { data: settings, isLoading } = useCompanySettings();
  const uploadMutation = useUploadLogo();
  const deleteMutation = useDeleteLogo();

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [cacheBustTs] = useState(() => Date.now());

  const logoSrc = !settings?.logoUrl
    ? null
    : `${settings.logoUrl}${settings.logoUrl.includes("?") ? "&" : "?"}v=${settings.updatedAt?.getTime?.() ?? cacheBustTs}`;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Formato no soportado. Usa PNG, JPG, WebP o SVG.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "El archivo es muy grande. Máximo 2MB.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setImageFailed(false);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      uploadMutation.mutate(file);
    },
    [validateFile, uploadMutation],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input para permitir seleccionar el mismo archivo
      e.target.value = "";
    },
    [handleFile],
  );

  const handleDelete = useCallback(() => {
    setImageFailed(false);
    deleteMutation.mutate();
  }, [deleteMutation]);

  const isProcessing = uploadMutation.isPending || deleteMutation.isPending;

  return (
    <SettingsCard
      title="Logo de la empresa"
      description="Tu logo aparecerá en facturas y comprobantes PDF fiscales"
    >
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Preview */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              "w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25",
              isLoading && "animate-pulse bg-muted",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isProcessing ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : settings?.logoUrl && logoSrc && !imageFailed ? (
              <img
                src={logoSrc}
                alt="Logo de la empresa"
                className="w-full h-full object-contain p-2"
                onError={() => {
                  setImageFailed(true);
                  setError(
                    "No se pudo cargar el logo. Intenta subirlo nuevamente.",
                  );
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-2 text-center">
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                {settings?.logoUrl && imageFailed && (
                  <span className="text-[11px] leading-tight text-muted-foreground">
                    Logo no disponible
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <input
              type="file"
              id="logo-upload"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileChange}
              className="sr-only"
              disabled={isProcessing}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isProcessing}
              asChild
            >
              <label htmlFor="logo-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {settings?.logoUrl ? "Cambiar logo" : "Subir logo"}
              </label>
            </Button>

            {settings?.logoUrl && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto ml-0 sm:ml-2 text-destructive hover:text-destructive"
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar logo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El logo se eliminará de todos los documentos. Esta acción
                      no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <p className="text-xs text-muted-foreground">
            PNG, JPG, WebP o SVG. Máximo 2MB. Para PDFs fiscales usa
            preferentemente PNG, JPG o WebP de 512x512px con fondo transparente.
          </p>
        </div>
      </div>
    </SettingsCard>
  );
});
