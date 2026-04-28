import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";

interface EmployeeEditHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  isDirty: boolean;
  isSubmitting: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export function EmployeeEditHeader({
  title,
  subtitle,
  onBack,
  isDirty,
  isSubmitting,
  onDiscard,
  onSave,
}: EmployeeEditHeaderProps) {
  return (
    <div className="sticky top-0 z-20 border-b bg-background/95 px-1 py-3 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isSubmitting
              ? "Guardando..."
              : isDirty
                ? "Cambios sin guardar"
                : "Sin cambios"}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={onDiscard}
            disabled={!isDirty || isSubmitting}
          >
            Descartar cambios
          </Button>
          <Button type="button" onClick={onSave} disabled={!isDirty || isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
