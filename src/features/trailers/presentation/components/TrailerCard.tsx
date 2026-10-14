/**
 * TrailerCard
 * Clean Architecture - Presentation Layer (Components)
 *
 * Tarjeta de remolque para la vista cards del listado.
 * EntityListCard + menú ⋯ touch canónico (D4). Sin hop a detalle (Capa 1 D1').
 */

import { CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import {
  EntityListCard,
  entityListCardMenuTriggerClassName,
} from "@shared/ui/listing";
import { Container } from "lucide-react";
import type { TrailerListItem } from "../../domain";
import { TrailerStatusBadge } from "../config/trailerStatusConfig";
import { TrailerActions } from "./TrailerActions";

interface TrailerCardProps {
  trailer: TrailerListItem;
  typeLabel: string;
  onEdit: (id: string) => void;
}

export function TrailerCard({ trailer, typeLabel, onEdit }: TrailerCardProps) {
  const notes = trailer.notes?.trim() ?? "";

  return (
    <EntityListCard className="cursor-default">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Container className="h-5 w-5" />
            </div>
            <h3 className="truncate font-mono text-lg font-semibold leading-none">
              {trailer.licensePlate}
            </h3>
          </div>

          <TrailerActions
            trailerId={trailer.id}
            licensePlate={trailer.licensePlate}
            status={trailer.status}
            onEdit={() => onEdit(trailer.id)}
            menuTriggerClassName={entityListCardMenuTriggerClassName}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Container className="h-4 w-4 shrink-0" />
          <span className="truncate">{typeLabel}</span>
        </div>
        {notes ? (
          <p className="truncate text-sm text-muted-foreground" title={notes}>
            {notes}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="border-t pt-3">
        <TrailerStatusBadge status={trailer.status} size="sm" showIcon />
      </CardFooter>
    </EntityListCard>
  );
}
