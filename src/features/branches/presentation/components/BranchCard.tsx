/**
 * BranchCard
 *
 * Tarjeta de sucursal para vista en grid.
 * Menú ⋯ vía EntityListCard (usable sin hover — D3).
 */

import { useNavigate } from "react-router-dom";
import { useListQueueFromState } from "@shared/utils/listQueueFrom";
import { Building2, MapPin, Phone } from "lucide-react";
import { CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import {
  EntityListCard,
  entityListCardMenuTriggerClassName,
} from "@shared/ui/listing";
import { cn } from "@shared/lib/utils/cn";
import type { BranchListItem } from "../../domain";
import { BranchStatusBadge } from "../config/branchStatusConfig";
import { formatBranchListLocation } from "../utils/branchAddressFormatters";
import { branchesCopy } from "../copy/branchesCopy";
import { BranchActions } from "./BranchActions";

interface BranchCardProps {
  branch: BranchListItem;
  showDeleted?: boolean;
}

export function BranchCard({
  branch,
  showDeleted = false,
}: BranchCardProps) {
  const navigate = useNavigate();
  const fromState = useListQueueFromState();
  const isActive = !showDeleted && branch.isActive;

  const handleView = () =>
    navigate(`/branches/${branch.id}`, { state: fromState });

  return (
    <EntityListCard
      className={cn(!isActive && "opacity-60")}
      onClick={handleView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold leading-none">
                  {branch.name}
                </h3>
                {branch.isMain ? (
                  <Badge
                    variant="outline"
                    className="border-warning/40 text-xs text-warning-soft-foreground"
                  >
                    {branchesCopy.card.mainBadge}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{branch.code}</p>
            </div>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <BranchActions
              branchId={branch.id}
              branchName={branch.name}
              fromState={fromState}
              isActive={isActive}
              isMain={branch.isMain}
              menuTriggerClassName={entityListCardMenuTriggerClassName}
              menuAriaLabel={branchesCopy.card.actionsAria}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {formatBranchListLocation(branch.city, branch.state) || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate">{branch.phone || "—"}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <BranchStatusBadge status={branch.status} size="sm" showIcon />
      </CardFooter>
    </EntityListCard>
  );
}
