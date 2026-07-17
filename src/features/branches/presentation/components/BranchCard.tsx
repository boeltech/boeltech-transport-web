import { useNavigate } from "react-router-dom";
import { Building2, Eye, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import type { BranchListItem } from "../../domain";
import { BranchStatusBadge } from "../config/branchStatusConfig";
import { formatBranchListLocation } from "../utils/branchAddressFormatters";
import { branchesCopy } from "../copy/branchesCopy";
import { BranchActions } from "./BranchActions";

interface BranchCardProps {
  branch: BranchListItem;
  showDeleted?: boolean;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  isDeleting?: boolean;
  isRestoring?: boolean;
}

export function BranchCard({
  branch,
  showDeleted = false,
  onDelete,
  onRestore,
  isDeleting,
  isRestoring,
}: BranchCardProps) {
  const navigate = useNavigate();
  const hasActions = Boolean(onDelete || onRestore);

  const handleView = () => navigate(`/branches/${branch.id}`);

  return (
    <Card
      className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
      onClick={handleView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold leading-none">{branch.name}</h3>
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

          {hasActions ? (
            <div onClick={(e) => e.stopPropagation()}>
              <BranchActions
                branchId={branch.id}
                branchName={branch.name}
                isActive={!showDeleted && branch.isActive}
                isMain={branch.isMain}
                onDelete={onDelete}
                onRestore={onRestore}
                isDeleting={isDeleting}
                isRestoring={isRestoring}
              />
            </div>
          ) : null}
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
        <div className="flex w-full items-center justify-between">
          <BranchStatusBadge status={branch.status} size="sm" showIcon />
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
          >
            {branchesCopy.actions.viewMore}
            <Eye className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
