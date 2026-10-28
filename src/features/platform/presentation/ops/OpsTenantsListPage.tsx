import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  PLATFORM_TENANT_STATUS_LABELS,
  PlatformTenantStatus,
  isPlatformOwner,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import { usePlatformTenants } from "../../application/hooks/usePlatformTenants";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { getLifecycleStageLabel } from "../config/platformLifecycleConfig";
import { opsCopy } from "./opsCopy";
import { lifecycleStageSealTone, tenantListTick } from "./opsStatusTones";
import { OpsTenantRow } from "./patterns/OpsTenantRow";
import { OpsButton } from "./ui/OpsButton";
import { OpsInput } from "./ui/OpsInput";
import {
  OpsSelect,
  OpsSelectContent,
  OpsSelectItem,
  OpsSelectTrigger,
  OpsSelectValue,
} from "./ui/OpsSelect";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsTableSkeleton } from "./patterns/OpsTableSkeleton";

const ACCESS_ALL = "__all__";

/**
 * Listado Empresas Ops (flag ON) — fila de 37px, sin tabla de badges.
 */
export function OpsTenantsListPage() {
  const copy = opsCopy.tenants;
  const navigate = useNavigate();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);

  const [search, setSearch] = useState("");
  const [access, setAccess] = useState<string>(ACCESS_ALL);
  const [page, setPage] = useState(1);

  const statusFilter =
    access === ACCESS_ALL
      ? undefined
      : (access as PlatformTenantStatusType);

  const { data, isLoading, isError, refetch } = usePlatformTenants({
    page,
    limit: 20,
    search: search.trim() || undefined,
    status: statusFilter,
  });

  const tenants = data?.data ?? [];
  const pagination = data?.pagination;
  const hasFilter = Boolean(search.trim() || statusFilter);

  const accessOptions = useMemo(
    () =>
      Object.values(PlatformTenantStatus).map((value) => ({
        value,
        label: PLATFORM_TENANT_STATUS_LABELS[value] ?? value,
      })),
    [],
  );

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

      {!isLoading && !isError && tenants.length === 0 ? (
        <OpsEmptyState
          title={hasFilter ? copy.emptyFiltered : copy.empty}
          description={
            hasFilter
              ? "Prueba otro texto o limpia el filtro de acceso."
              : "Crea una empresa para empezar."
          }
        />
      ) : null}

      {!isLoading && !isError && tenants.length > 0 ? (
        <div className="ops-line-list">
          {tenants.map((tenant) => (
            <OpsTenantRow
              key={tenant.id}
              idLabel={tenant.subdomain}
              name={tenant.name}
              href={`/platform/tenants/${tenant.id}`}
              planName={tenant.planName ?? tenant.planCode}
              lifecycleLabel={getLifecycleStageLabel(tenant.lifecycleStage)}
              lifecycleTone={lifecycleStageSealTone(tenant.lifecycleStage)}
              time={formatDateTime(tenant.suspendedAt ?? tenant.createdAt)}
              tick={tenantListTick(tenant)}
              action={
                tenant.subscriptionStatus === "past_due" ? (
                  <OpsButton variant="ghost" size="sm" asChild>
                    <Link
                      to={`/platform/billing/ar?status=open&tenant_id=${tenant.id}`}
                    >
                      {copy.viewAr}
                    </Link>
                  </OpsButton>
                ) : undefined
              }
            />
          ))}
        </div>
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
