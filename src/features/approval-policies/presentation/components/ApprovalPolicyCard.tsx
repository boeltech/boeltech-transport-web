import { Eye, History, Pencil } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@shared/ui/card";
import { formatDate } from "@shared/utils/dateUtils";
import type { ConceptPolicy } from "../../domain";
import {
  APPROVAL_CONCEPT_DESCRIPTIONS,
  APPROVAL_CONCEPT_LABELS,
  approvalPoliciesCopy,
} from "../copy/approvalPoliciesCopy";

const copy = approvalPoliciesCopy.card;

interface ApprovalPolicyCardProps {
  policy: ConceptPolicy;
  canEdit: boolean;
  onView: () => void;
  onEdit: () => void;
  onHistory: () => void;
}

export function ApprovalPolicyCard({ policy, canEdit, onView, onEdit, onHistory }: ApprovalPolicyCardProps) {
  const label = APPROVAL_CONCEPT_LABELS[policy.concept];
  const isStandard = policy.source !== "tenant";
  const isNeverCustomized = policy.source === "system_default";

  return (
    <Card className="flex h-full flex-col" data-testid={`approval-policy-card-${policy.concept}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{label}</CardTitle>
          <Badge variant={isStandard ? "neutral" : "info"} tone="soft" className="shrink-0 text-xs">
            {isStandard ? copy.standardBadge : copy.customBadge}
          </Badge>
        </div>
        <CardDescription>{APPROVAL_CONCEPT_DESCRIPTIONS[policy.concept]}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 pt-0 text-sm">
        <p className="font-medium text-foreground">
          {isNeverCustomized ? copy.standardText : policy.summary}
        </p>
        {policy.concept === "settlement" ? (
          <p className="text-xs text-muted-foreground">{copy.manualAdjustmentsNote}</p>
        ) : null}
        {policy.pendingRequests > 0 ? (
          <p className="text-xs text-muted-foreground">{copy.pending(policy.pendingRequests)}</p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3 border-t pt-3">
        {policy.version !== null && policy.effectiveFrom ? (
          <p className="text-xs text-muted-foreground">
            {copy.meta(policy.version, formatDate(policy.effectiveFrom), policy.createdByName)}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button size="sm" onClick={onEdit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {isNeverCustomized ? copy.customize : copy.edit}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onView}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              {copy.view}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onHistory}>
            <History className="mr-1.5 h-3.5 w-3.5" />
            {copy.history}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
