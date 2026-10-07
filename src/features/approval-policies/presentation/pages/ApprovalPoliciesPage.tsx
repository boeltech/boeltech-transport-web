/**
 * Reglas de autorización por concepto (ADR-0099 F5 · SDD §4.1).
 * Lectura para admin/gerente/contador; edición solo admin con `edit_enabled`.
 */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { SettingsPageShell } from "@shared/ui/page-shells/SettingsPageShell";
import { usePermissions } from "@shared/permissions";
import { isApprovalConcept, type ApprovalConcept } from "../../domain";
import { useApprovalPolicies, usePolicyCandidateUsers } from "../../application";
import { approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";
import { ApprovalPolicyCard } from "../components/ApprovalPolicyCard";
import { ApprovalPolicySheet, type ApprovalPolicySheetMode } from "../components/ApprovalPolicySheet";
import type { PolicyPeopleState } from "../components/PolicyStepEditor";
import { PolicyVersionsSheet } from "../components/PolicyVersionsSheet";
import { SelfApprovalFloorNote } from "../components/SelfApprovalFloorNote";

const copy = approvalPoliciesCopy.page;

export function ApprovalPoliciesPage() {
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const overview = useApprovalPolicies();
  const hasUpdatePermission = hasPermission("approval_policies", "update");
  const editEnabled = overview.data?.editEnabled === true;
  const canEdit = hasUpdatePermission && editEnabled;
  const candidates = usePolicyCandidateUsers({ enabled: canEdit });
  const people: PolicyPeopleState = candidates.data
    ? { status: "ready", users: candidates.data.users, referencedUsers: candidates.data.referencedUsers }
    : {
        status: candidates.isError && !candidates.isFetching ? "error" : "loading",
        users: null,
        referencedUsers: [],
      };

  const conceptParam = searchParams.get("concept");
  const [openConcept, setOpenConcept] = useState<ApprovalConcept | null>(
    isApprovalConcept(conceptParam) ? conceptParam : null,
  );
  const [sheetMode, setSheetMode] = useState<ApprovalPolicySheetMode | null>(null);
  const [historyConcept, setHistoryConcept] = useState<ApprovalConcept | null>(null);

  const effectiveMode: ApprovalPolicySheetMode = canEdit ? (sheetMode ?? "edit") : "view";
  const openPolicy = overview.data?.concepts.find((policy) => policy.concept === openConcept) ?? null;

  const openSheet = (concept: ApprovalConcept, mode: ApprovalPolicySheetMode) => {
    setSheetMode(mode);
    setOpenConcept(concept);
  };

  const closeSheet = (open: boolean) => {
    if (open) return;
    setOpenConcept(null);
    setSheetMode(null);
    if (searchParams.has("concept")) {
      const next = new URLSearchParams(searchParams);
      next.delete("concept");
      setSearchParams(next, { replace: true });
    }
  };

  const readOnlyNotice = !overview.data
    ? null
    : !hasUpdatePermission
      ? copy.readOnlyViewer
      : !editEnabled
        ? copy.editDisabled
        : null;

  return (
    <SettingsPageShell sectionTitle={copy.sectionTitle} title={copy.title} description={copy.description}>
      <div className="space-y-6">
        {overview.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : overview.isError || !overview.data ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{copy.loadError}</span>
              <Button size="sm" variant="outline" onClick={() => void overview.refetch()}>
                {copy.retry}
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {readOnlyNotice ? (
              <Alert variant="info" data-testid="approval-policies-readonly">
                <Info className="h-4 w-4" />
                <AlertDescription>{readOnlyNotice}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              {overview.data.concepts.map((policy) => (
                <ApprovalPolicyCard
                  key={policy.concept}
                  policy={policy}
                  canEdit={canEdit}
                  onView={() => openSheet(policy.concept, "view")}
                  onEdit={() => openSheet(policy.concept, "edit")}
                  onHistory={() => setHistoryConcept(policy.concept)}
                />
              ))}
            </div>
            <SelfApprovalFloorNote />
          </>
        )}
      </div>

      <ApprovalPolicySheet
        open={openPolicy !== null}
        onOpenChange={closeSheet}
        policy={openPolicy}
        mode={effectiveMode}
        people={people}
        onRetryPeople={() => void candidates.refetch()}
        onReload={() => void overview.refetch()}
      />
      <PolicyVersionsSheet
        concept={historyConcept}
        onOpenChange={(open) => (!open ? setHistoryConcept(null) : undefined)}
      />
    </SettingsPageShell>
  );
}
