import { useState } from "react";
import {
  PlatformLifecycleStage,
  PlatformRole,
  PlatformSaasInvoiceStatus,
  PlatformTenantStatus,
} from "../../../../domain/entities";
import { platformCopy } from "../../../copy/platformCopy";
import { getLifecycleStageLabel } from "../../../config/platformLifecycleConfig";
import {
  OpsArStatusBadge,
  OpsAuditLine,
  OpsCollectionsBand,
  OpsEmptyState,
  OpsHealthLedger,
  OpsHoyQueues,
  OpsHubHeader,
  OpsKpiStrip,
  OpsMoneyAmount,
  OpsMoneyTable,
  OpsMoneyTableBody,
  OpsMoneyTableCell,
  OpsMoneyTableHead,
  OpsMoneyTableHeader,
  OpsMoneyTableRow,
  OpsOperatorMark,
  OpsQuotaLine,
  OpsRiskSheetShell,
  OpsSecretList,
  OpsSectionRule,
  OpsTableSkeleton,
  OpsTenantRow,
} from "../../patterns";
import { lifecycleStageSealTone } from "../../opsStatusTones";
import { opsCopy } from "../../opsCopy";
import { OpsAlert } from "../../ui/OpsAlert";
import { OpsButton } from "../../ui/OpsButton";
import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "../../ui/OpsPanel";
import type { HoyQueueId } from "../../hoyQueues";

const HEALTH_SIGNALS = [
  {
    key: "fiscal",
    name: platformCopy.health.signals.fiscal,
    value: 80,
    weightLabel: "20%",
  },
  {
    key: "payment",
    name: platformCopy.health.signals.payment,
    value: 55,
    weightLabel: "20%",
  },
  {
    key: "adoption",
    name: platformCopy.health.signals.adoption,
    value: 10,
    weightLabel: "20%",
  },
  {
    key: "fleet",
    name: platformCopy.health.signals.fleet,
    value: 90,
    weightLabel: "20%",
  },
  {
    key: "engagement",
    name: platformCopy.health.signals.engagement,
    value: 40,
    weightLabel: "20%",
  },
] as const;

const HUB_DEMO = {
  tenantName: "Demo Transportes",
  subdomain: "demo",
  tenantIdShort: "a1b2",
  accessStatus: PlatformTenantStatus.ACTIVE,
  lifecycleStage: PlatformLifecycleStage.ACTIVE,
  planName: "Control",
} as const;

const HOY_CHIPS = [
  { id: "activation" as HoyQueueId, label: "Activar admin", count: 2 },
  { id: "trial" as HoyQueueId, label: "Trial ≤7d", count: 0 },
  { id: "past_due" as HoyQueueId, label: "Cobro pendiente", count: 1 },
  { id: "suspended" as HoyQueueId, label: "Suspendidos", count: 0 },
];

export function OpsPatternsCatalogSection() {
  const [queue, setQueue] = useState<HoyQueueId>("activation");
  const [riskOpen, setRiskOpen] = useState(false);

  return (
    <div className="space-y-4" data-testid="ops-ds-patterns">
      <OpsPanel data-testid="ops-ds-patterns-inventory">
        <OpsPanelHeader>
          <OpsPanelTitle>Inventario Patterns (craft A)</OpsPanelTitle>
          <OpsPanelDescription>
            Anatomía visual · hairline · status · densidad. Sin reabrir CMP de
            negocio. Cubierto: KpiStrip · HoyQueues · HubHeader · MoneyTable ·
            RiskSheetShell · SectionRule · TenantRow · CollectionsBand ·
            AuditLine · EmptyState · HealthLedger · QuotaLine · OperatorMark ·
            SecretList · TableSkeleton.
          </OpsPanelDescription>
        </OpsPanelHeader>
      </OpsPanel>

      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Hub / Hoy</OpsPanelTitle>
          <OpsPanelDescription>
            HubHeader · SectionRule · KpiStrip · HoyQueues. Estructura KPI →
            colas → filas. No shells ERP.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div data-testid="ops-ds-hub-owner" className="space-y-2">
              <p className="ops-type-caption ops-text-muted">platform_owner</p>
              <OpsHubHeader
                {...HUB_DEMO}
                actions={
                  <>
                    <OpsButton>{opsCopy.hub.primary.registerPayment}</OpsButton>
                    <OpsButton variant="ghost">
                      {opsCopy.hub.primary.changePlan}
                    </OpsButton>
                    <OpsButton variant="ghost">
                      {opsCopy.hub.overflow.more}
                    </OpsButton>
                  </>
                }
              />
            </div>
            <div data-testid="ops-ds-hub-support" className="space-y-2">
              <p className="ops-type-caption ops-text-muted">platform_support</p>
              <OpsHubHeader {...HUB_DEMO} />
              <OpsAlert tone="notice">{opsCopy.tenants.readOnly}</OpsAlert>
            </div>
          </div>
          <OpsSectionRule label="KPI strip" meta="M6" />
          <OpsKpiStrip
            aria-label="Indicadores de Hoy"
            cells={[
              {
                id: "mora",
                label: "Mora abierta",
                value: "$36.6k",
                caption: "4 empresas · cobro pendiente",
                tone: "warn",
              },
              {
                id: "suspended",
                label: "Suspendidos",
                value: 2,
                caption: "Acceso cortado",
                tone: "danger",
              },
              {
                id: "activation",
                label: "Activación",
                value: 3,
                caption: "Admin pendiente",
              },
              {
                id: "trial",
                label: "Trial",
                value: 5,
                caption: "≤ 7 días restantes",
              },
            ]}
          />
          <OpsSectionRule label="Colas" meta="M5" />
          <OpsHoyQueues
            chips={HOY_CHIPS}
            activeQueue={queue}
            onQueueChange={setQueue}
            isEmpty={queue === "trial"}
            emptyTitle="Cola vacía"
            emptyDescription="No hay empresas en esta cola ahora."
          >
            {queue !== "trial" ? (
              <p className="ops-type-caption ops-text-muted px-1">
                Filas de cola (stub) — cola «{queue}».
              </p>
            ) : null}
          </OpsHoyQueues>
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Salud, cupo, rol y códigos</OpsPanelTitle>
          <OpsPanelDescription>
            El número lleva el tono 40/70. Las señales no tienen barra. El
            cupo no muestra precio.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <OpsHealthLedger
              score={40}
              asOfLabel={platformCopy.health.asOf("27 oct 2026")}
              pendingLabel={platformCopy.health.pending}
              signals={HEALTH_SIGNALS}
            />
            <OpsHealthLedger
              score={null}
              asOfLabel={null}
              pendingLabel={platformCopy.health.pending}
              signals={null}
            />
          </div>
          <div data-testid="ops-ds-quota" className="space-y-2">
            <OpsQuotaLine
              kind="stamps"
              label={opsCopy.quota.stamps}
              used={69}
              included={100}
            />
            <OpsQuotaLine
              kind="stamps"
              label={opsCopy.quota.stamps}
              used={70}
              included={100}
            />
            <OpsQuotaLine
              kind="stamps"
              label={opsCopy.quota.stamps}
              used={80}
              included={100}
            />
            <OpsQuotaLine
              kind="stamps"
              label={opsCopy.quota.stamps}
              used={100}
              included={100}
            />
            <OpsQuotaLine
              kind="branches"
              label={platformCopy.tenants.detail.subscription.fields.branches}
              usage={4}
              granted={10}
              overQuota={false}
            />
            <OpsQuotaLine
              kind="branches"
              label={platformCopy.tenants.detail.subscription.fields.branches}
              usage={12}
              granted={10}
              overQuota
            />
            <OpsQuotaLine
              kind="history"
              label={
                platformCopy.tenants.detail.subscription.fields
                  .historyConsultable
              }
              granted={12}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="ops-type-body ops-text">Operador</span>
              <OpsOperatorMark role={PlatformRole.OWNER} />
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="ops-type-body ops-text-muted">Soporte</span>
              <OpsOperatorMark role={PlatformRole.SUPPORT} />
            </span>
          </div>
          <OpsSecretList codes={["DEMO-0001", "DEMO-0002"]} example />
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Fila, cobranza, auditoría</OpsPanelTitle>
          <OpsPanelDescription>
            Una fila, una banda, una línea. Risk-rail = tick ≤3px
            (<code>--ops-tick-w</code>). Danger solo en el atraso y en el verbo
            destructivo.
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-4">
          <div className="space-y-2">
            <p className="ops-type-caption ops-text-muted">platform_owner</p>
            <div className="ops-line-list">
              <OpsTenantRow
                idLabel="a1b2"
                name="Demo Transportes"
                planName="Control"
                lifecycleLabel={getLifecycleStageLabel(PlatformLifecycleStage.ACTIVE)}
                lifecycleTone={lifecycleStageSealTone(PlatformLifecycleStage.ACTIVE)}
                time="2026-10-27 16:40"
              />
              <OpsTenantRow
                idLabel="c3d4"
                name="Ruta Norte"
                planName="Control"
                lifecycleLabel={getLifecycleStageLabel(PlatformLifecycleStage.AT_RISK)}
                lifecycleTone={lifecycleStageSealTone(PlatformLifecycleStage.AT_RISK)}
                time="2026-10-27 09:12"
                tick="warn"
                action={
                  <OpsButton variant="danger" size="sm">
                    Suspender
                  </OpsButton>
                }
              />
            </div>
            <p className="ops-type-caption ops-text-muted">platform_support</p>
            <div className="ops-line-list" data-testid="ops-ds-tenant-reader">
              <OpsTenantRow
                idLabel="e5f6"
                name="Patio Sur"
                planName="Control"
                lifecycleLabel={getLifecycleStageLabel(
                  PlatformLifecycleStage.SUSPENDED,
                )}
                lifecycleTone={lifecycleStageSealTone(
                  PlatformLifecycleStage.SUSPENDED,
                )}
                time="2026-10-26 18:05"
                tick="danger"
              />
            </div>
            <p className="ops-type-caption ops-text-muted">Solo lectura</p>
          </div>

          <OpsCollectionsBand
            buckets={[
              { id: "current", label: "Al corriente", cents: 1190000 },
              { id: "d30", label: "1–30 días", cents: 0 },
              {
                id: "overdue",
                label: platformCopy.ar.views.overdue,
                cents: 1240000,
                overdue: true,
              },
            ]}
            action={
              <OpsButton variant="ghost" size="sm">
                {platformCopy.ar.actions.viewAr}
              </OpsButton>
            }
          />

          <div className="ops-line-list">
            <OpsAuditLine
              time="2026-10-27 16:40"
              actor="operador@boeltech"
              verb={platformCopy.audit.actions.tenant_plan_assigned}
              object="Demo Transportes"
            />
            <OpsAuditLine
              time="2026-10-27 09:12"
              actor="operador@boeltech"
              verb={platformCopy.audit.actions.saas_invoice_voided}
              object="Demo Transportes"
              destructive
            />
          </div>
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel>
        <OpsPanelHeader>
          <OpsPanelTitle>Money table</OpsPanelTitle>
        </OpsPanelHeader>
        <OpsPanelBody>
          <OpsMoneyTable>
            <OpsMoneyTableHeader>
              <OpsMoneyTableRow>
                <OpsMoneyTableHead>Periodo</OpsMoneyTableHead>
                <OpsMoneyTableHead>Total</OpsMoneyTableHead>
                <OpsMoneyTableHead>Estado</OpsMoneyTableHead>
              </OpsMoneyTableRow>
            </OpsMoneyTableHeader>
            <OpsMoneyTableBody>
              <OpsMoneyTableRow data-ops-tick="warn">
                <OpsMoneyTableCell>2026-09</OpsMoneyTableCell>
                <OpsMoneyTableCell>
                  <OpsMoneyAmount cents={1240000} />
                </OpsMoneyTableCell>
                <OpsMoneyTableCell>
                  <OpsArStatusBadge status={PlatformSaasInvoiceStatus.OPEN} />
                </OpsMoneyTableCell>
              </OpsMoneyTableRow>
              <OpsMoneyTableRow>
                <OpsMoneyTableCell>2026-08</OpsMoneyTableCell>
                <OpsMoneyTableCell>
                  <OpsMoneyAmount cents={1190000} />
                </OpsMoneyTableCell>
                <OpsMoneyTableCell>
                  <OpsArStatusBadge status={PlatformSaasInvoiceStatus.PAID} />
                </OpsMoneyTableCell>
              </OpsMoneyTableRow>
            </OpsMoneyTableBody>
          </OpsMoneyTable>
        </OpsPanelBody>
      </OpsPanel>

      <OpsPanel data-testid="ops-ds-patterns-empty">
        <OpsPanelHeader>
          <OpsPanelTitle>Empty · loading · skeleton · Risk</OpsPanelTitle>
          <OpsPanelDescription>
            OpsEmptyState empty/error/loading · OpsTableSkeleton ·
            OpsRiskSheetShell (stub).
          </OpsPanelDescription>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-3">
          <OpsButton
            variant="danger"
            size="sm"
            onClick={() => setRiskOpen(true)}
          >
            Abrir risk sheet
          </OpsButton>
          <OpsEmptyState
            variant="empty"
            title="Cola vacía"
            description="Nada que revisar en esta cola."
            action={
              <OpsButton size="sm" variant="ghost">
                Buscar empresa
              </OpsButton>
            }
          />
          <OpsEmptyState
            variant="error"
            title="No se pudo cargar"
            description="No pudimos cargar esta vista. Intenta de nuevo."
            action={
              <OpsButton size="sm" variant="ghost">
                Reintentar
              </OpsButton>
            }
          />
          <OpsEmptyState
            variant="loading"
            title="Cargando…"
            description="Marca de carga sin shimmer."
          />
          <div data-testid="ops-ds-patterns-skeleton">
            <OpsTableSkeleton rows={3} />
          </div>
        </OpsPanelBody>
      </OpsPanel>

      <OpsRiskSheetShell
        open={riskOpen}
        onOpenChange={setRiskOpen}
        tone="danger"
        title="Suspender empresa"
        description="Acción destructiva — confirmación tipada en producción."
        footer={
          <OpsButton variant="ghost" size="sm" onClick={() => setRiskOpen(false)}>
            Cerrar
          </OpsButton>
        }
      >
        <p className="ops-type-body ops-text-muted">
          Stub de patrón Risk (craft A · F3).
        </p>
      </OpsRiskSheetShell>
    </div>
  );
}
