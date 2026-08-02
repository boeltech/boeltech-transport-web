/**
 * Control de logo dentro de la tarjeta de identidad.
 *
 * Preview con zona de arrastre + subir / cambiar / eliminar.
 */

import { memo, useCallback, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@shared/ui/button";
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
import { cn } from "@shared/lib/utils/cn";

import { useDeleteLogo, useUploadLogo } from "../../application/hooks";
import { generalSettingsCopy } from "../copy/generalSettingsCopy";

const copy = generalSettingsCopy.logo;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

export interface CompanyLogoFieldProps {
  /** URL ya versionada del logo actual, o `null` si no hay. */
  logoSrc: string | null;
}

export const CompanyLogoField = memo(function CompanyLogoField({
  logoSrc,
}: CompanyLogoFieldProps) {
  const uploadMutation = useUploadLogo();
  const deleteMutation = useDeleteLogo();

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const isProcessing = uploadMutation.isPending || deleteMutation.isPending;
  const hasLogo = Boolean(logoSrc);

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setImageFailed(false);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(copy.invalidType);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(copy.tooLarge);
        return;
      }
      setError(null);
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      const file = event.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) handleFile(file);
      // Permite volver a elegir el mismo archivo tras un error.
      event.target.value = "";
    },
    [handleFile],
  );

  const handleDelete = useCallback(() => {
    setImageFailed(false);
    setError(null);
    deleteMutation.mutate();
  }, [deleteMutation]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        className={cn(
          "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isProcessing ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : hasLogo && !imageFailed ? (
          <img
            src={logoSrc ?? undefined}
            alt={copy.previewAlt}
            className="h-full w-full object-contain p-1.5"
            onError={() => {
              setImageFailed(true);
              setError(copy.loadFailed);
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 p-2 text-center">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            {hasLogo && imageFailed ? (
              <span className="text-[11px] leading-tight text-muted-foreground">
                {copy.unavailable}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            id="company-logo-upload"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileChange}
            className="sr-only"
            disabled={isProcessing}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isProcessing}
            asChild
          >
            <label htmlFor="company-logo-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {hasLogo ? copy.replace : copy.upload}
            </label>
          </Button>

          {hasLogo ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isProcessing}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {copy.remove}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{copy.removeTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {copy.removeDescription}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{copy.removeCancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {copy.removeConfirm}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>

        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">{copy.hint}</p>
      </div>
    </div>
  );
});
