/**
 * UnsavedChangesDialog
 *
 * Confirmación al salir con cambios sin guardar (D11).
 * Modo producción: `blocker` de `useUnsavedChangesGuard`.
 * Modo demo/preview: `open` + `onConfirm` / `onDismiss` controlados.
 */

import type { Blocker } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { UNSAVED_CHANGES_COPY } from "@shared/hooks/useUnsavedChangesGuard";

export interface UnsavedChangesDialogCopy {
  title?: string;
  description?: string;
  confirmLabel?: string;
  keepEditingLabel?: string;
}

type UnsavedChangesDialogProps = UnsavedChangesDialogCopy &
  (
    | {
        blocker: Blocker;
        open?: never;
        onConfirm?: never;
        onDismiss?: never;
      }
    | {
        blocker?: undefined;
        open: boolean;
        onConfirm: () => void;
        onDismiss: () => void;
      }
  );

export function UnsavedChangesDialog(props: UnsavedChangesDialogProps) {
  const title = props.title ?? UNSAVED_CHANGES_COPY.title;
  const description = props.description ?? UNSAVED_CHANGES_COPY.description;
  const confirmLabel = props.confirmLabel ?? UNSAVED_CHANGES_COPY.confirmLabel;
  const keepEditingLabel =
    props.keepEditingLabel ?? UNSAVED_CHANGES_COPY.keepEditingLabel;

  const isControlled = props.blocker === undefined;
  const open = isControlled
    ? props.open
    : props.blocker.state === "blocked";

  const handleOpenChange = (next: boolean) => {
    if (next) return;
    if (isControlled) {
      props.onDismiss();
      return;
    }
    if (props.blocker.state === "blocked") {
      props.blocker.reset?.();
    }
  };

  const handleKeepEditing = () => {
    if (isControlled) {
      props.onDismiss();
      return;
    }
    props.blocker.reset?.();
  };

  const handleConfirmLeave = () => {
    if (isControlled) {
      props.onConfirm();
      return;
    }
    props.blocker.proceed?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleKeepEditing}>
            {keepEditingLabel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmLeave}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
