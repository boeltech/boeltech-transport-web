/**
 * Confirmación al salir con cambios sin guardar — kit Ops (flag ON).
 * Misma API que UnsavedChangesDialog ERP; no usa AlertDialog light.
 */

import type { Blocker } from "react-router-dom";
import { UNSAVED_CHANGES_COPY } from "@shared/hooks/useUnsavedChangesGuard";
import { OpsButton } from "./ui/OpsButton";
import {
  OpsDialog,
  OpsDialogContent,
  OpsDialogDescription,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsDialogTitle,
} from "./ui/OpsDialog";

export interface OpsUnsavedChangesDialogCopy {
  title?: string;
  description?: string;
  confirmLabel?: string;
  keepEditingLabel?: string;
}

type OpsUnsavedChangesDialogProps = OpsUnsavedChangesDialogCopy &
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

export function OpsUnsavedChangesDialog(props: OpsUnsavedChangesDialogProps) {
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
    <OpsDialog open={open} onOpenChange={handleOpenChange}>
      <OpsDialogContent
        tone="default"
        data-testid="ops-unsaved-changes-dialog"
      >
        <OpsDialogHeader>
          <OpsDialogTitle>{title}</OpsDialogTitle>
          <OpsDialogDescription>{description}</OpsDialogDescription>
        </OpsDialogHeader>
        <OpsDialogFooter>
          <OpsButton variant="ghost" size="sm" onClick={handleKeepEditing}>
            {keepEditingLabel}
          </OpsButton>
          <OpsButton variant="danger" size="sm" onClick={handleConfirmLeave}>
            {confirmLabel}
          </OpsButton>
        </OpsDialogFooter>
      </OpsDialogContent>
    </OpsDialog>
  );
}
