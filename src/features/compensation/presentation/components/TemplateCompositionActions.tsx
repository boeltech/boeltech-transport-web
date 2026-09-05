import { Link } from "react-router-dom";
import { Copy, Pencil, Users } from "lucide-react";
import { Button } from "@shared/ui/button";
import { compensationCopy } from "../copy/compensationCopy";

const copy = compensationCopy.compositionCanvas.actions;

interface TemplateCompositionActionsProps {
  mode: "view" | "edit";
  canUpdate: boolean;
  isSaving?: boolean;
  isDuplicating?: boolean;
  formId?: string;
  /** When set, primary edit CTA navigates to Builder (ADR-0091). */
  editHref?: string;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onDuplicate?: () => void;
  onShowOperators?: () => void;
}

export function TemplateCompositionActions({
  mode,
  canUpdate,
  isSaving = false,
  isDuplicating = false,
  formId,
  editHref,
  onEdit,
  onCancelEdit,
  onDuplicate,
  onShowOperators,
}: TemplateCompositionActionsProps) {
  if (mode === "edit") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSaving}
          onClick={onCancelEdit}
        >
          {copy.cancelEdit}
        </Button>
        <Button
          type="submit"
          size="sm"
          form={formId}
          disabled={isSaving}
          isLoading={isSaving}
        >
          {isSaving ? copy.savePending : copy.save}
        </Button>
      </div>
    );
  }

  if (!canUpdate) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {onShowOperators ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Users className="h-4 w-4" />}
          onClick={onShowOperators}
        >
          {compensationCopy.compositionCanvas.viewOperators}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<Copy className="h-4 w-4" />}
        disabled={isDuplicating}
        isLoading={isDuplicating}
        onClick={onDuplicate}
      >
        {copy.duplicate}
      </Button>
      {editHref ? (
        <Button type="button" size="sm" asChild>
          <Link to={editHref}>
            <Pencil className="h-4 w-4" aria-hidden />
            {copy.edit}
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          leftIcon={<Pencil className="h-4 w-4" />}
          onClick={onEdit}
        >
          {copy.edit}
        </Button>
      )}
    </div>
  );
}
