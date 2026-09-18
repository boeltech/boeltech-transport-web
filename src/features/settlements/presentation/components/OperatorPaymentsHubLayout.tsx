import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Plus, Settings } from "lucide-react";
import { HubPageShell } from "@shared/ui/page-shells";
import { usePermissions } from "@shared/permissions";
import { ROLES } from "@shared/constants/roles";
import { useAuth } from "@features/auth";
import {
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_TEMPLATES_PATH,
} from "@features/compensation/application/compensationRoutes";
import type {
  CompensationHubCreateAction,
  CompensationHubOutletContext,
} from "@features/compensation/presentation/hooks/useRegisterCompensationHubCreateAction";
import {
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_PENDING_APPROVAL_PATH,
  resolveOperatorPaymentsHubTab,
  settlementCreatePath,
} from "../../application/settlementsRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";
import { SettlementSettingsSheet } from "./SettlementSettingsSheet";

const copy = settlementsCopy.hub;

export function OperatorPaymentsHubLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const canCreate = hasPermission("settlements", "create");
  // Lockstep con PATCH /settlements/settings: política de dinero solo para admin,
  // no para todo el que puede editar liquidaciones.
  const canEditSettings =
    hasPermission("settlements", "update") && user?.role === ROLES.ADMIN;
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const porPagarCreate =
    activeTab === "por-pagar" && canCreate
      ? {
          id: "create-cut",
          label: copy.createCut,
          onClick: () => navigate(settlementCreatePath()),
          icon: <Plus className="mr-2 h-4 w-4" />,
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
    <>
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
          canEditSettings
            ? [
                {
                  id: "settings",
                  label: copy.settingsAction,
                  onClick: () => setSettingsOpen(true),
                  variant: "outline" as const,
                  icon: <Settings className="mr-2 h-4 w-4" />,
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
            id: "por-autorizar",
            label: copy.tabs.porAutorizar,
            href: SETTLEMENTS_PENDING_APPROVAL_PATH,
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
      <SettlementSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
