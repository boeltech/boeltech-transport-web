import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

export interface FormSectionCardProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Acción de la sección (p. ej. «Corregir…»), alineada a la derecha del título. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
}

/**
 * Card reutilizable para secciones de formularios.
 * Mantiene el patrón visual base usado en los wizards del sistema.
 */
export function FormSectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
  titleClassName,
}: FormSectionCardProps) {
  const heading = (
    <>
      <CardTitle className={cn("text-base flex items-center gap-2", titleClassName)}>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        {title}
      </CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
    </>
  );

  return (
    <Card className={className}>
      <CardHeader className={headerClassName}>
        {action ? (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">{heading}</div>
            <div className="shrink-0">{action}</div>
          </div>
        ) : (
          heading
        )}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
