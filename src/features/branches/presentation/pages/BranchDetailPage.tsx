import { useMemo, type ReactElement, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  FileText,
  Info,
  Mail,
  MapPin,
  Phone,
  Route,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import {
  DetailAlertCard,
  InfoRow,
  type StatCardProps,
} from "@shared/ui/data-display";
import { useTabParam, useToast } from "@shared/hooks";
import { usePermissions, canAccessFinanceSummaryRoute } from "@shared/permissions";
import { useAuth } from "@/features/auth";
import { useBranchKpis } from "@features/dashboard/application/hooks/useBranchKpis";
import { DEFAULT_BRANCH_KPIS_PERIOD } from "@features/dashboard/domain/types";
import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import { BranchStatus } from "../../domain";
import { useBranch, useDeleteBranch } from "../../application";
import {
  BranchActions,
  BranchActivitySection,
  BranchAssignedEmployeesCard,
  BranchAssignedVehiclesCard,
  BranchDetailLocationMap,
  BranchOperationalKpiCard,
} from "../components";
import { BranchDetailHeaderSubtitle } from "../components/BranchDetailHeaderSubtitle";
import { BranchStatusBadge } from "../config/branchStatusConfig";
import { branchesCopy } from "../copy/branchesCopy";
import { formatBranchFullAddress } from "../utils/branchAddressFormatters";
import { getBranchMutationErrorToast } from "../utils/branchMutationErrors";

const copy = branchesCopy.detail;

/** Tabs enlazables por `?tab=`. */
const BRANCH_DETAIL_TABS = [
  "summary",
  "team",
  "performance",
  "history",
] as const;

function ContactValue({
  value,
  hrefPrefix,
  emptyLabel,
}: {
  value: string | null;
  hrefPrefix?: "tel" | "mailto";
  emptyLabel: string;
}) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return <span className="italic text-muted-foreground">{emptyLabel}</span>;
  }

  if (!hrefPrefix) {
    return trimmed;
  }

  return (
    <a
      href={`${hrefPrefix}:${trimmed}`}
      className="text-primary underline-offset-4 hover:underline"
    >
      {trimmed}
    </a>
  );
}

function BranchAddressBlock({
  addressLines,
  emptyLabel,
}: {
  addressLines: string[];
  emptyLabel: string;
}) {
  const { toast } = useToast();
  const fullText = addressLines.join("\n");

  const handleCopy = async () => {
    if (!fullText) return;
    try {
      await navigator.clipboard.writeText(fullText);
      toast({ title: "Dirección copiada" });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  if (!addressLines.length) {
    return (
      <p className="text-sm italic text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/30 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <address className="space-y-0.5 text-sm not-italic leading-relaxed text-foreground">
          {addressLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </address>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => void handleCopy()}
        aria-label="Copiar dirección"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useTabParam(
    BRANCH_DETAIL_TABS,
    "summary",
  );
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canUpdateBranch = hasPermission("branches", "update");
  const showFinance = canAccessFinanceSummaryRoute(user?.role);

  const { data: branch, isLoading, isError } = useBranch(id ?? "");

  const { data: kpisData, isLoading: kpisLoading } = useBranchKpis({
    branchIds: branch ? [branch.id] : [],
    period: DEFAULT_BRANCH_KPIS_PERIOD,
    enabled: Boolean(branch?.id),
  });

  const deleteMutation = useDeleteBranch({
    onSuccess: () => {
      toast({
        title: copy.toasts.deleteSuccess,
        variant: "success",
      });
      navigate("/branches");
    },
    onError: (error) => {
      const known = getBranchMutationErrorToast(error);
      if (known) {
        toast({
          title: known.title,
          description: known.description,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: copy.toasts.deleteError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const alerts = useMemo(() => {
    if (!branch) return undefined;

    const cards: ReactElement[] = [];

    if (branch.status === BranchStatus.INACTIVE && branch.isMain) {
      cards.push(
        <DetailAlertCard
          key="inactive-main"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={copy.alerts.inactiveMain.title}
          items={[{ text: copy.alerts.inactiveMain.text }]}
        />,
      );
    }

    if (!branch.contact.phone && !branch.contact.email) {
      cards.push(
        <DetailAlertCard
          key="missing-contact"
          severity="info"
          icon={<Info className="h-5 w-5" />}
          title={copy.alerts.missingContact.title}
          items={[{ text: copy.alerts.missingContact.text }]}
        />,
      );
    }

    return cards.length > 0 ? cards : undefined;
  }, [branch]);

  const addressLines = useMemo(
    () => (branch ? formatBranchFullAddress(branch.address) : []),
    [branch],
  );

  const kpiRow = useMemo(() => {
    if (!branch || !kpisData) return undefined;
    return kpisData.rows.find((row) => row.branchId === branch.id);
  }, [branch, kpisData]);

  const branchStats = useMemo((): StatCardProps[] => {
    if (!branch) return [];

    const loading = kpisLoading && !kpiRow;
    const periodLabel = kpisData?.period.label;

    // Prioridad: Margen → operativo. Máx. 4 cards para fila completa (shell: 4 → lg:grid-cols-4).
    // Flota/conductores viven en tab Equipo y flota.
    const operational: StatCardProps[] = [
      {
        title: copy.stats.trips,
        value: kpiRow ? kpiRow.trips.total : "—",
        tone: "primary",
        icon: <Route className="h-5 w-5" />,
        isLoading: loading,
        description: showFinance ? undefined : periodLabel,
      },
      {
        title: copy.stats.inProgress,
        value: kpiRow ? kpiRow.trips.inProgress : "—",
        tone: "info",
        icon: <Truck className="h-5 w-5" />,
        isLoading: loading,
      },
      {
        title: copy.stats.completed,
        value: kpiRow ? kpiRow.trips.completed : "—",
        tone: "success",
        icon: <CheckCircle2 className="h-5 w-5" />,
        isLoading: loading,
      },
    ];

    if (!showFinance) return operational;

    return [
      {
        title: copy.stats.margin,
        value: kpiRow
          ? formatMxCurrencyWhole(kpiRow.financialMonth?.actualMargin ?? 0)
          : "—",
        tone: "success",
        icon: <Wallet className="h-5 w-5" />,
        isLoading: loading,
        description: periodLabel,
      },
      ...operational,
    ];
  }, [branch, kpiRow, kpisLoading, kpisData?.period.label, showFinance]);

  const handleDelete = (branchId: string) => {
    deleteMutation.mutate(branchId);
  };

  const statusBadges: ReactNode =
    branch ? (
      <div className="flex flex-wrap items-center gap-2">
        <BranchStatusBadge status={branch.status} showIcon size="sm" />
        {branch.isMain ? (
          <Badge variant="info" tone="soft">
            {branchesCopy.card.mainBadge}
          </Badge>
        ) : null}
      </div>
    ) : undefined;

  const notesText = branch?.notes?.trim() ?? "";

  return (
    <DetailPageShell
      isLoading={isLoading}
      notFound={!branch && isError}
      notFoundConfig={{
        icon: <Building2 />,
        title: copy.notFound.title,
        description: copy.notFound.description,
        backHref: "/branches",
        backLabel: copy.notFound.backLabel,
      }}
      header={{
        backHref: "/branches",
        backLabel: copy.header.backLabel,
        icon: <Building2 className="h-6 w-6" />,
        iconVariant:
          branch && (!branch.isActive || branch.status === BranchStatus.INACTIVE)
            ? "muted"
            : "primary",
        title: branch?.name ?? copy.title,
        subtitle: branch ? (
          <BranchDetailHeaderSubtitle code={branch.code} />
        ) : undefined,
        statusBadge: statusBadges,
        actions:
          branch ? (
            <BranchActions
              branchId={branch.id}
              branchName={branch.name}
              isActive={branch.isActive}
              isMain={branch.isMain}
              variant="buttons"
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          ) : undefined,
      }}
      stats={branchStats}
      metadata={
        branch
          ? {
              createdAt: branch.createdAt,
              updatedAt: branch.updatedAt,
              createdBy:
                branch.createdByName?.trim() ||
                branch.createdBy?.trim() ||
                undefined,
              updatedBy: branch.updatedByName?.trim() || undefined,
            }
          : undefined
      }
      alerts={alerts}
      tabs={
        branch
          ? {
              defaultValue: "summary",
              value: activeTab,
              onValueChange: setActiveTab,
              items: [
                {
                  value: "summary",
                  label: copy.tabs.summary,
                  forceMount: true,
                  content: (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <UserRound className="h-4 w-4 text-muted-foreground" />
                            {copy.cards.contact}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <InfoRow
                            icon={<UserRound className="h-4 w-4" />}
                            label={copy.fields.manager}
                            value={
                              <ContactValue
                                value={branch.contact.managerName}
                                emptyLabel={copy.fields.notDefined}
                              />
                            }
                          />
                          <InfoRow
                            icon={<Phone className="h-4 w-4" />}
                            label={copy.fields.phone}
                            value={
                              <ContactValue
                                value={branch.contact.phone}
                                hrefPrefix="tel"
                                emptyLabel={copy.fields.notDefined}
                              />
                            }
                            copyable={Boolean(branch.contact.phone?.trim())}
                            copyValue={branch.contact.phone?.trim()}
                          />
                          <InfoRow
                            icon={<Mail className="h-4 w-4" />}
                            label={copy.fields.email}
                            value={
                              <ContactValue
                                value={branch.contact.email}
                                hrefPrefix="mailto"
                                emptyLabel={copy.fields.notDefined}
                              />
                            }
                            copyable={Boolean(branch.contact.email?.trim())}
                            copyValue={branch.contact.email?.trim()}
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {copy.cards.address}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
                          <BranchAddressBlock
                            addressLines={addressLines}
                            emptyLabel={copy.fields.addressEmpty}
                          />
                          <BranchDetailLocationMap
                            latitude={branch.address.latitude}
                            longitude={branch.address.longitude}
                            geolocationPending={branch.address.geolocationPending}
                            editHref={`/branches/${branch.id}/edit`}
                            canEdit={canUpdateBranch}
                          />
                        </CardContent>
                      </Card>

                      {notesText ? (
                        <Card className="md:col-span-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {copy.cards.notes}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="whitespace-pre-wrap text-sm text-foreground">
                              {notesText}
                            </p>
                          </CardContent>
                        </Card>
                      ) : null}
                    </div>
                  ),
                },
                {
                  value: "team",
                  label: copy.tabs.team,
                  content: (
                    <div className="space-y-4">
                      <BranchAssignedEmployeesCard branchId={branch.id} />
                      <BranchAssignedVehiclesCard branchId={branch.id} />
                    </div>
                  ),
                },
                {
                  value: "performance",
                  label: copy.tabs.performance,
                  content: <BranchOperationalKpiCard branchId={branch.id} />,
                },
                {
                  value: "history",
                  label: copy.tabs.history,
                  content: <BranchActivitySection branchId={branch.id} />,
                },
              ],
            }
          : undefined
      }
    />
  );
}
