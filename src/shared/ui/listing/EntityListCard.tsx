/**
 * EntityListCard
 *
 * Card de padrón en modo «cards». Aporta hover de borde/sombra y el contrato
 * del menú ⋯ usable sin hover (touch / teclado) — D4.
 *
 * Uso:
 *   <EntityListCard onClick={() => onView(id)}>
 *     <CardHeader>… menú con entityListCardMenuTriggerClassName …</CardHeader>
 *     <CardContent>…</CardContent>
 *     <CardFooter>…</CardFooter>
 *   </EntityListCard>
 */

import type { ReactNode, MouseEventHandler } from "react";
import { Card } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

export interface EntityListCardProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export function EntityListCard({
  children,
  onClick,
  className,
}: EntityListCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}
