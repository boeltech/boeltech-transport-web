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
  Star,
  UserRound,
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
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { cn } from "@shared/lib/utils/cn";
import { BranchStatus } from "../../domain";
import { useBranch, useDeleteBranch } from "../../application";
import { BranchActions, BranchActivitySection, BranchDetailLocationMap } from "../components";
import { BranchAssignedEmployeesCard } from "../components/BranchAssignedEmployeesCard";
import { BranchAssignedVehiclesCard } from "../components/BranchAssignedVehiclesCard";
import { BranchOperationalKpiCard } from "../components/BranchOperationalKpiCard";
import { BranchDetailHeaderSubtitle } from "../components/BranchDetailHeaderSubtitle";
import { BranchStatusBadge } from "../config/branchStatusConfig";
import { branchesCopy } from "../copy/branchesCopy";
import { formatBranchFullAddress } from "../utils/branchAddressFormatters";
import { getBranchMutationErrorToast } from "../utils/branchMutationErrors";

const copy = branchesCopy.detail;

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
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canUpdateBranch = hasPermission("branches", "update");

  const { data: branch, isLoading, isError } = useBranch(id ?? "");

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

    if (branch.address.geolocationPending) {
      cards.push(
        <DetailAlertCard
          key="geolocation-pending"
          severity="info"
          icon={<MapPin className="h-5 w-5" />}
          title={copy.alerts.geolocationPending.title}
          items={[{ text: copy.alerts.geolocationPending.text }]}
        />,
      );
    }

    return cards.length > 0 ? cards : undefined;
  }, [branch]);

  const addressLines = useMemo(
    () => (branch ? formatBranchFullAddress(branch.address) : []),
    [branch],
  );

  const branchStats = useMemo((): StatCardProps[] => {
    if (!branch) return [];

    return [
      {
        title: copy.stats.isMain,
        value: branch.isMain ? copy.stats.isMainYes : copy.stats.isMainNo,
        tone: branch.isMain ? "primary" : "neutral",
        icon: <Star className="h-5 w-5" />,
      },
      {
        title: copy.stats.operationalStatus,
        value: branch.isActive ? copy.stats.active : copy.stats.inactive,
        tone: branch.isActive ? "success" : "neutral",
        icon: branch.isActive ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Building2 className="h-5 w-5" />
        ),
      },
    ];
  }, [branch]);

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

  return (
    <DetailPageShell
      className="mx-auto w-full max-w-6xl p-4 sm:p-6"
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
    >
      {branch ? (
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

          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {copy.cards.notes}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm",
                  branch.notes?.trim()
                    ? "text-foreground"
                    : "italic text-muted-foreground",
                )}
              >
                {branch.notes?.trim() || copy.fields.notesEmpty}
              </p>
            </CardContent>
          </Card>

          <BranchAssignedEmployeesCard branchId={branch.id} />

          <BranchAssignedVehiclesCard branchId={branch.id} />

          <BranchOperationalKpiCard branchId={branch.id} />

          <BranchActivitySection branchId={branch.id} />
        </div>
      ) : null}
    </DetailPageShell>
  );
}
