import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Plus, ShieldCheck } from "lucide-react";
import { HubPageShell } from "@shared/ui/page-shells";
import { usePermissions } from "@shared/permissions";
import {
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_TEMPLATES_PATH,
} from "@features/compensation/application/compensationRoutes";
import type {
  CompensationHubCreateAction,
  CompensationHubOutletContext,
} from "@features/compensation/presentation/hooks/useRegisterCompensationHubCreateAction";
import type { ApprovalConcept } from "@features/approval-policies/domain";
import { approvalPoliciesPath } from "@features/approval-policies/application/approvalPoliciesRoutes";
import {
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_LIST_PATH,
  resolveOperatorPaymentsHubTab,
  settlementCreatePath,
  type OperatorPaymentsHubTab,
} from "../../application/settlementsRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.hub;

/** Regla de autorización que gobierna cada pestaña; Tarifas no tiene. */
const APPROVAL_CONCEPT_BY_TAB: Partial<Record<OperatorPaymentsHubTab, ApprovalConcept>> = {
  "por-pagar": "settlement",
  adelantos: "driver_advance",
};

export function OperatorPaymentsHubLayout() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const fromState = { from: `${pathname}${search}` };
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "create");
  const canReadApprovalPolicies = hasPermission("approval_policies", "read");
  const [createAction, setCreateAction] =
    useState<CompensationHubCreateAction | null>(null);

  const handleSetCreateAction = useCallback<
    CompensationHubOutletContext["setCreateAction"]
  >((action) => {
    setCreateAction(action);
  }, []);

  const outletContext = useMemo<CompensationHubOutletContext>(
    () => ({ setCreateAction: handleSetCreateAction }),
    [handleSetCreateAction],
  );

  const activeTab = resolveOperatorPaymentsHubTab(pathname);
  const approvalConcept = APPROVAL_CONCEPT_BY_TAB[activeTab];
  const porPagarCreate =
    activeTab === "por-pagar" && canCreate
      ? {
          id: "create-cut",
          label: copy.createCut,
          onClick: () => navigate(settlementCreatePath(), { state: fromState }),
          icon: <Plus className="mr-2 h-4 w-4" />,
          dataHelpAnchor: "stl-liquidar-periodo",
        }
      : null;

  const registeredCreate = createAction
    ? {
        id: "create",
        label: createAction.label,
        onClick: createAction.onClick,
        icon: <Plus className="mr-2 h-4 w-4" />,
      }
    : null;

  return (
    <HubPageShell
      title={copy.title}
      description={copy.description}
      primaryActions={
        porPagarCreate
          ? [porPagarCreate]
          : registeredCreate
            ? [registeredCreate]
            : undefined
      }
      secondaryActions={
        canReadApprovalPolicies && approvalConcept
          ? [
              {
                id: "approval-policies",
                label: copy.approvalPoliciesAction,
                onClick: () => navigate(approvalPoliciesPath(approvalConcept)),
                variant: "outline" as const,
                icon: <ShieldCheck className="mr-2 h-4 w-4" />,
              },
            ]
          : undefined
      }
      nav={[
        {
          id: "por-pagar",
          label: copy.tabs.porPagar,
          href: SETTLEMENTS_LIST_PATH,
        },
        {
          id: "adelantos",
          label: copy.tabs.adelantos,
          href: SETTLEMENTS_ADVANCES_PATH,
        },
        {
          id: "como-te-pago",
          label: copy.tabs.comoTePago,
          href: COMPENSATION_TEMPLATES_PATH,
        },
        {
          id: "tabla-de-rutas",
          label: copy.tabs.tablaRutas,
          href: COMPENSATION_CORRIDORS_PATH,
        },
      ]}
      activeNavId={activeTab}
      navAriaLabel={copy.navAriaLabel}
    >
      <Outlet context={outletContext} />
    </HubPageShell>
  );
}
