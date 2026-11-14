import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  PLATFORM_TENANT_STATUS_LABELS,
  PlatformTenantStatus,
  isPlatformOwner,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import { usePlatformModules } from "../../application/hooks/usePlatformBilling";
import { usePlatformTenants } from "../../application/hooks/usePlatformTenants";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { getLifecycleStageLabel } from "../config/platformLifecycleConfig";
import {
  formatActiveModulesCell,
  TENANTS_MODULE_FILTER_PARAM,
} from "./formatActiveModulesCell";
import { opsCopy } from "./opsCopy";
import { lifecycleStageSealTone, tenantListTick } from "./opsStatusTones";
import { OpsButton } from "./ui/OpsButton";
import { OpsInput } from "./ui/OpsInput";
import { OpsLifecycleSeal } from "./ui/OpsLifecycleSeal";
import { OpsPlanSeal } from "./ui/OpsPlanSeal";
import {
  OpsSelect,
  OpsSelectContent,
  OpsSelectItem,
  OpsSelectTrigger,
  OpsSelectValue,
} from "./ui/OpsSelect";
import {
  OpsTable,
  OpsTableBody,
  OpsTableCell,
  OpsTableHead,
  OpsTableHeader,
  OpsTableRow,
} from "./ui/OpsTable";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsTableSkeleton } from "./patterns/OpsTableSkeleton";

const ACCESS_ALL = "__all__";
const MODULE_ALL = "__all__";

/**
 * Listado Empresas Ops (flag ON) — OpsTable + thead (PROP-T1 A).
 * S10: filtro Complementos / `?module=` → API `module_code` (paginación server).
 */
export function OpsTenantsListPage() {
  const copy = opsCopy.tenants;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);

  const [search, setSearch] = useState("");
  const [access, setAccess] = useState<string>(ACCESS_ALL);
  const [page, setPage] = useState(1);

  const moduleFromUrl = searchParams.get(TENANTS_MODULE_FILTER_PARAM)?.trim() || "";
  const moduleFilter = moduleFromUrl || MODULE_ALL;

  const statusFilter =
    access === ACCESS_ALL
      ? undefined
      : (access as PlatformTenantStatusType);

  const { data, isLoading, isError, refetch } = usePlatformTenants({
    page,
    limit: 20,
    search: search.trim() || undefined,
    status: statusFilter,
    moduleCode: moduleFilter === MODULE_ALL ? undefined : moduleFilter,
  });
  const { data: modules = [] } = usePlatformModules();

  const moduleNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const mod of modules) {
      map.set(mod.code, mod.name);
    }
    return map;
  }, [modules]);

  const resolveModuleName = (code: string) =>
    moduleNameByCode.get(code) ?? code;

  const tenants = data?.data ?? [];
  const pagination = data?.pagination;
  const hasFilter = Boolean(
    search.trim() || statusFilter || moduleFilter !== MODULE_ALL,
  );
  const isEmptyList = pagination
    ? pagination.total === 0
    : tenants.length === 0;

  const accessOptions = useMemo(
    () =>
      Object.values(PlatformTenantStatus).map((value) => ({
        value,
        label: PLATFORM_TENANT_STATUS_LABELS[value] ?? value,
      })),
    [],
  );

  const setModuleFilter = (value: string) => {
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (value === MODULE_ALL) {
      next.delete(TENANTS_MODULE_FILTER_PARAM);
    } else {
      next.set(TENANTS_MODULE_FILTER_PARAM, value);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <div data-testid="platform-ops-tenants" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ops-type-h2 ops-text m-0">{copy.title}</h1>
          <p className="ops-type-caption ops-text-muted mt-1 max-w-xl">
            {copy.description}
          </p>
        </div>
        {canMutate ? (
          <OpsButton
            variant="primary"
            size="sm"
            onClick={() => navigate("/platform/tenants/new")}
          >
            {copy.create}
          </OpsButton>
        ) : (
          <p className="ops-type-caption ops-text-muted">{copy.readOnly}</p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1 space-y-1">
          <label className="ops-label" htmlFor="ops-tenants-search">
            Buscar
          </label>
          <OpsInput
            id="ops-tenants-search"
            value={search}
            placeholder={copy.searchPlaceholder}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-[10rem] space-y-1">
          <label className="ops-label" id="ops-tenants-access-label">
            {copy.filterAccess}
          </label>
          <OpsSelect
            value={access}
            onValueChange={(value) => {
              setAccess(value);
              setPage(1);
            }}
          >
            <OpsSelectTrigger aria-labelledby="ops-tenants-access-label">
              <OpsSelectValue />
            </OpsSelectTrigger>
            <OpsSelectContent>
              <OpsSelectItem value={ACCESS_ALL}>
                {copy.filterAll}
              </OpsSelectItem>
              {accessOptions.map((opt) => (
                <OpsSelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </OpsSelectItem>
              ))}
            </OpsSelectContent>
          </OpsSelect>
        </div>
        <div className="w-[12rem] space-y-1">
          <label className="ops-label" id="ops-tenants-module-label">
            {copy.filterModule}
          </label>
          <OpsSelect value={moduleFilter} onValueChange={setModuleFilter}>
            <OpsSelectTrigger
              aria-labelledby="ops-tenants-module-label"
              data-testid="ops-tenants-module-filter"
            >
              <OpsSelectValue />
            </OpsSelectTrigger>
            <OpsSelectContent>
              <OpsSelectItem value={MODULE_ALL}>
                {copy.filterAll}
              </OpsSelectItem>
              {modules.map((mod) => (
                <OpsSelectItem key={mod.code} value={mod.code}>
                  {mod.name}
                </OpsSelectItem>
              ))}
              {moduleFilter !== MODULE_ALL &&
              !modules.some((m) => m.code === moduleFilter) ? (
                <OpsSelectItem value={moduleFilter}>
                  {moduleFilter}
                </OpsSelectItem>
              ) : null}
            </OpsSelectContent>
          </OpsSelect>
        </div>
        <OpsButton
          variant="ghost"
          size="sm"
          onClick={() => void refetch()}
        >
          Actualizar
        </OpsButton>
      </div>

      {isError ? (
        <OpsEmptyState
          variant="error"
          title="No se pudo cargar el listado."
          action={
            <OpsButton variant="ghost" size="sm" onClick={() => void refetch()}>
              Reintentar
            </OpsButton>
          }
        />
      ) : null}

      {isLoading ? <OpsTableSkeleton /> : null}

      {!isLoading && !isError && isEmptyList ? (
        <OpsEmptyState
          title={hasFilter ? copy.emptyFiltered : copy.empty}
          description={
            hasFilter
              ? "Prueba otro texto o limpia el filtro de acceso o complemento."
              : "Crea una empresa para empezar."
          }
        />
      ) : null}

      {!isLoading && !isError && !isEmptyList ? (
        <OpsTable>
          <OpsTableHeader>
            <OpsTableRow>
              <OpsTableHead>{copy.columns.name}</OpsTableHead>
              <OpsTableHead>{copy.columns.plan}</OpsTableHead>
              <OpsTableHead>{copy.columns.stage}</OpsTableHead>
              <OpsTableHead>{copy.columns.modules}</OpsTableHead>
              <OpsTableHead>{copy.columns.date}</OpsTableHead>
              <OpsTableHead>{copy.columns.action}</OpsTableHead>
            </OpsTableRow>
          </OpsTableHeader>
          <OpsTableBody>
            {tenants.map((tenant) => {
              const tick = tenantListTick(tenant);
              const modulesLabel = formatActiveModulesCell(
                tenant.activeModuleCount ?? 0,
                tenant.activeModuleCodes ?? [],
                resolveModuleName,
              );
              return (
                <OpsTableRow key={tenant.id} tick={tick}>
                  <OpsTableCell>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="ops-tenant-row-id">
                        {tenant.subdomain}
                      </span>
                      <Link
                        to={`/platform/tenants/${tenant.id}`}
                        className="ops-tenant-row-name ops-ring-accent"
                      >
                        {tenant.name}
                      </Link>
                    </div>
                  </OpsTableCell>
                  <OpsTableCell>
                    <OpsPlanSeal name={tenant.planName ?? tenant.planCode} />
                  </OpsTableCell>
                  <OpsTableCell>
                    <OpsLifecycleSeal
                      tone={lifecycleStageSealTone(tenant.lifecycleStage)}
                    >
                      {getLifecycleStageLabel(tenant.lifecycleStage)}
                    </OpsLifecycleSeal>
                  </OpsTableCell>
                  <OpsTableCell>
                    <span
                      className="ops-type-caption ops-text-muted"
                      data-testid="ops-tenant-modules-cell"
                    >
                      {modulesLabel}
                    </span>
                  </OpsTableCell>
                  <OpsTableCell>
                    <span className="ops-font-mono ops-type-caption ops-text-muted tabular-nums">
                      {formatDateTime(tenant.suspendedAt ?? tenant.createdAt)}
                    </span>
                  </OpsTableCell>
                  <OpsTableCell>
                    {tenant.subscriptionStatus === "past_due" ? (
                      <OpsButton variant="ghost" size="sm" asChild>
                        <Link
                          to={`/platform/billing/ar?status=open&tenant_id=${tenant.id}`}
                        >
                          {copy.viewAr}
                        </Link>
                      </OpsButton>
                    ) : null}
                  </OpsTableCell>
                </OpsTableRow>
              );
            })}
          </OpsTableBody>
        </OpsTable>
      ) : null}

      {pagination && pagination.totalPages > 1 ? (
        <div className="ops-type-caption ops-text-muted flex flex-wrap items-center gap-2">
          <span>{copy.page(pagination.page, pagination.totalPages)}</span>
          <OpsButton
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {copy.prev}
          </OpsButton>
          <OpsButton
            variant="ghost"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {copy.next}
          </OpsButton>
        </div>
      ) : null}
    </div>
  );
}
