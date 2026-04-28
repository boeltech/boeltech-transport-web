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
  children,
  className,
  headerClassName,
  contentClassName,
  titleClassName,
}: FormSectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader className={headerClassName}>
        <CardTitle className={cn("text-base flex items-center gap-2", titleClassName)}>
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
