import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlatformTenants } from "../../application/hooks/usePlatformTenants";
import { opsCopy } from "./opsCopy";
import {
  buildHubModulePreviewHref,
  buildHubPlanPreviewHref,
} from "./hubPreviewParams";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import {
  OpsButton,
  OpsInput,
  OpsSheet,
  OpsSheetContent,
  OpsSheetDescription,
  OpsSheetFooter,
  OpsSheetHeader,
  OpsSheetTitle,
} from "./ui";

type UseInKind = "plan" | "module";

interface OpsUseInTenantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: UseInKind;
  code: string | null;
  label?: string | null;
}

export function OpsUseInTenantSheet({
  open,
  onOpenChange,
  kind,
  code,
  label,
}: OpsUseInTenantSheetProps) {
  const copy = opsCopy.useInTenant;
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = usePlatformTenants({
    page: 1,
    limit: 20,
    search: search.trim() || undefined,
  });

  const tenants = data?.data ?? [];

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedId(null);
    }
  }, [open]);

  const openPreview = () => {
    if (!selectedId || !code) return;
    const href =
      kind === "plan"
        ? buildHubPlanPreviewHref(selectedId, code)
        : buildHubModulePreviewHref(selectedId, code);
    onOpenChange(false);
    void navigate(href);
  };

  return (
    <OpsSheet open={open} onOpenChange={onOpenChange}>
      <OpsSheetContent
        className="overflow-y-auto"
        onFocusOutside={(e) => e.preventDefault()}
        data-testid="ops-use-in-tenant-sheet"
      >
        <OpsSheetHeader>
          <OpsSheetTitle>{copy.title}</OpsSheetTitle>
          <OpsSheetDescription>
            {copy.description}
            {label ? ` · ${label}` : null}
          </OpsSheetDescription>
        </OpsSheetHeader>

        <div className="mt-4 space-y-3">
          <OpsInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
          />

          {isLoading ? (
            <OpsEmptyState variant="loading" title={copy.loading} />
          ) : tenants.length === 0 ? (
            <OpsEmptyState title={copy.empty} panel={false} />
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {tenants.map((tenant) => {
                const selected = selectedId === tenant.id;
                return (
                  <li key={tenant.id}>
                    <button
                      type="button"
                      className={`ops-rounded ops-hairline w-full px-2 py-1.5 text-left text-xs ${
                        selected ? "ops-bg-accent" : "ops-bg-surface"
                      }`}
                      onClick={() => setSelectedId(tenant.id)}
                    >
                      <span className="font-medium ops-text">{tenant.name}</span>
                      <span className="ml-1 ops-text-muted">
                        {tenant.subdomain}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <OpsSheetFooter className="mt-4 gap-2 sm:justify-end">
          <OpsButton
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {copy.cancel}
          </OpsButton>
          <OpsButton
            type="button"
            disabled={!selectedId || !code}
            onClick={openPreview}
          >
            {copy.open}
          </OpsButton>
        </OpsSheetFooter>
      </OpsSheetContent>
    </OpsSheet>
  );
}
