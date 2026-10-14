/**
 * TrailerCatalogSheet — alta/edición del catálogo en Sheet (Capa 1 D7').
 * No usar para el wizard de viaje (CreateTrailerSheet).
 */

import { useCallback, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useCreateTrailer, useUpdateTrailer } from "../../application";
import type { Trailer } from "../../domain";
import { buildCreateTrailerPayload, buildUpdateTrailerPayload } from "../trailerFormPayload";
import type { CreateTrailerFormData } from "../validation";
import { trailersCopy } from "../copy/trailersCopy";
import { TrailerForm } from "./TrailerForm";

const formCopy = trailersCopy.form;
const sheetCopy = trailersCopy.catalogSheet;

export interface TrailerCatalogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trailer?: Trailer;
}

export function TrailerCatalogSheet({
  open,
  onOpenChange,
  trailer,
}: TrailerCatalogSheetProps) {
  const { toast } = useToast();
  const isEdit = Boolean(trailer);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // Reset local overlay state when the parent closes the sheet (props → state).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setIsDirty(false);
      setConfirmCloseOpen(false);
    }
  }

  const requestClose = useCallback(() => {
    if (isDirty) {
      setConfirmCloseOpen(true);
      return;
    }
    onOpenChange(false);
  }, [isDirty, onOpenChange]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      onOpenChange(true);
      return;
    }
    requestClose();
  };

  const handleConfirmDiscard = () => {
    setConfirmCloseOpen(false);
    setIsDirty(false);
    onOpenChange(false);
  };

  const createTrailer = useCreateTrailer({
    onSuccess: (data) => {
      toast({
        title: formCopy.toast.createSuccess,
        description: data.licensePlate,
        variant: "success",
      });
      setIsDirty(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: formCopy.toast.errorTitle,
        description: isApiError(error)
          ? error.getDetailedMessage(3)
          : getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const updateTrailer = useUpdateTrailer({
    onSuccess: () => {
      toast({
        title: formCopy.toast.updateSuccess,
        variant: "success",
      });
      setIsDirty(false);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: formCopy.toast.errorTitle,
        description: isApiError(error)
          ? error.getDetailedMessage(3)
          : getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateTrailerFormData) => {
    if (trailer) {
      updateTrailer.mutate({
        id: trailer.id,
        data: buildUpdateTrailerPayload(data, trailer),
      });
      return;
    }
    createTrailer.mutate(buildCreateTrailerPayload(data));
  };

  const isSubmitting = createTrailer.isPending || updateTrailer.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="flex flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {isEdit ? sheetCopy.editTitle : sheetCopy.createTitle}
            </SheetTitle>
            <SheetDescription>
              {isEdit && trailer
                ? sheetCopy.editDescription(trailer.licensePlate)
                : sheetCopy.createDescription}
            </SheetDescription>
          </SheetHeader>

          {open ? (
            <TrailerForm
              key={trailer?.id ?? "create"}
              trailer={trailer}
              onSubmit={handleSubmit}
              onCancel={requestClose}
              onDirtyChange={setIsDirty}
              isSubmitting={isSubmitting}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <UnsavedChangesDialog
        open={confirmCloseOpen}
        onConfirm={handleConfirmDiscard}
        onDismiss={() => setConfirmCloseOpen(false)}
      />
    </>
  );
}
