import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { SETTLEMENTS_CREATE_PATH } from "@features/settlements/application/settlementsRoutes";
import {
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_TEMPLATES_PATH,
  resolveCompensationHubTab,
} from "../../application/compensationRoutes";
import { useCompensationReadiness } from "../../application/hooks";
import { compensationCopy } from "../copy/compensationCopy";
import { HubPageShell } from "@shared/ui/page-shells";
import type { CompensationHubCreateAction } from "../hooks/useRegisterCompensationHubCreateAction";

const copy = compensationCopy.hub;
const GUIDE_STORAGE_KEY = "compensation-hub-steps-collapsed";

export function CompensationHubLayout() {
  const { pathname } = useLocation();
  const activeTab = resolveCompensationHubTab(pathname);
  const { isReady } = useCompensationReadiness();
  const [createAction, setCreateAction] =
    useState<CompensationHubCreateAction | null>(null);

  const handleSetCreateAction = useCallback(
    (action: CompensationHubCreateAction | null) => {
      setCreateAction(action);
    },
    [],
  );

  const outletContext = useMemo(
    () => ({ setCreateAction: handleSetCreateAction }),
    [handleSetCreateAction],
  );

  return (
    <HubPageShell
      title={copy.title}
      description={copy.description}
      primaryActions={
        createAction
          ? [
              {
                id: "create",
                label: createAction.label,
                onClick: createAction.onClick,
                icon: <Plus className="mr-2 h-4 w-4" />,
              },
            ]
          : undefined
      }
      nav={[
        {
          id: "templates",
          label: copy.tabs.templates,
          href: COMPENSATION_TEMPLATES_PATH,
        },
        {
          id: "corridors",
          label: copy.tabs.corridors,
          href: COMPENSATION_CORRIDORS_PATH,
        },
      ]}
      activeNavId={activeTab}
      navAriaLabel="Secciones de esquemas de compensación"
      guide={
        isReady
          ? undefined
          : {
              title: copy.guideTitle,
              steps: [...copy.steps],
              defaultOpen: true,
              storageKey: GUIDE_STORAGE_KEY,
            }
      }
      relatedConfig={{
        label: copy.settlementsLink,
        href: SETTLEMENTS_CREATE_PATH,
        description: copy.settlementsBridge,
      }}
    >
      <Outlet context={outletContext} />
    </HubPageShell>
  );
}
