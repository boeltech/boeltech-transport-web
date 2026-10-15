/**
 * EntityListCard
 *
 * Card de padrón en modo «cards». Aporta hover de borde/sombra y el contrato
 * del menú ⋯ usable sin hover (touch / teclado) — D4.
 *
 * Uso:
 *   <EntityListCard to={`/settings/catalogs/${code}`}>
 *     <CardHeader>… menú con entityListCardMenuTriggerClassName …</CardHeader>
 *     <CardContent>…</CardContent>
 *     <CardFooter>…</CardFooter>
 *   </EntityListCard>
 */

import type {
  KeyboardEvent,
  MouseEventHandler,
  ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { Card } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

const interactiveClassName =
  "group cursor-pointer transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/50";

export interface EntityListCardProps {
  children: ReactNode;
  /** Preferir para navegación: card como enlace semántico. */
  to?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export function EntityListCard({
  children,
  to,
  onClick,
  className,
}: EntityListCardProps) {
  if (to) {
    return (
      <Link
        to={to}
        className={cn("block text-inherit no-underline", className)}
      >
        <Card className={interactiveClassName}>{children}</Card>
      </Link>
    );
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(
        event as unknown as Parameters<MouseEventHandler<HTMLDivElement>>[0],
      );
    }
  };

  return (
    <Card
      className={cn(onClick && interactiveClassName, className)}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "link" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </Card>
  );
}
