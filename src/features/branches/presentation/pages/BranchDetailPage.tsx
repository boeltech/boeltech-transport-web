import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Info,
  Mail,
  MapPin,
  Phone,
  Star,
  UserRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { DetailAlertCard, InfoRow } from "@shared/ui/data-display";
import { useToast } from "@shared/hooks";
import { BranchStatus } from "../../domain";
import { useBranch, useDeleteBranch } from "../../application";
import { BranchActions } from "../components";
import { BranchStatusBadge } from "../config/branchStatusConfig";
import { branchesCopy } from "../copy/branchesCopy";

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: branch, isLoading, isError } = useBranch(id ?? "");

  const deleteMutation = useDeleteBranch({
    onSuccess: () => {
      toast({
        title: branchesCopy.detail.toasts.deleteSuccess,
        variant: "success",
      });
      navigate("/branches");
    },
    onError: (error) => {
      toast({
        title: branchesCopy.detail.toasts.deleteError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (branchId: string) => {
    deleteMutation.mutate(branchId);
  };

  const alerts = useMemo(() => {
    if (!branch) return undefined;

    const cards = [];

    if (branch.status === BranchStatus.INACTIVE && branch.isMain) {
      cards.push(
        <DetailAlertCard
          key="inactive-main"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title={branchesCopy.detail.alerts.inactiveMain.title}
          items={[{ text: branchesCopy.detail.alerts.inactiveMain.text }]}
        />,
      );
    }

    if (!branch.contact.phone && !branch.contact.email) {
      cards.push(
        <DetailAlertCard
          key="missing-contact"
          severity="info"
          icon={<Info className="h-5 w-5" />}
          title={branchesCopy.detail.alerts.missingContact.title}
          items={[{ text: branchesCopy.detail.alerts.missingContact.text }]}
        />,
      );
    }

    return cards.length > 0 ? cards : undefined;
  }, [branch]);

  return (
    <DetailPageShell
      isLoading={isLoading}
      notFound={!branch && isError}
      notFoundConfig={{
        icon: <Building2 />,
        title: branchesCopy.detail.notFound.title,
        description: branchesCopy.detail.notFound.description,
        backHref: "/branches",
        backLabel: branchesCopy.detail.notFound.backLabel,
      }}
      header={{
        backHref: "/branches",
        icon: <Building2 className="h-5 w-5" />,
        title: branch?.name ?? branchesCopy.detail.title,
        subtitle: branch ? branchesCopy.detail.subtitle(branch.code) : undefined,
        statusBadge: branch ? (
          <BranchStatusBadge status={branch.status} showIcon />
        ) : undefined,
        actions:
          branch ? (
            <BranchActions
              branchId={branch.id}
              branchName={branch.name}
              variant="buttons"
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          ) : undefined,
      }}
      stats={
        branch
          ? [
              {
                title: branchesCopy.detail.stats.isMain,
                value: branch.isMain
                  ? branchesCopy.detail.stats.isMainYes
                  : branchesCopy.detail.stats.isMainNo,
                tone: branch.isMain ? "primary" : "neutral",
                icon: <Star className="h-5 w-5" />,
              },
              {
                title: branchesCopy.detail.stats.operationalStatus,
                value: branch.isActive
                  ? branchesCopy.detail.stats.active
                  : branchesCopy.detail.stats.inactive,
                tone: branch.isActive ? "success" : "neutral",
                icon: branch.isActive ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Building2 className="h-5 w-5" />
                ),
              },
            ]
          : undefined
      }
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
            <CardHeader>
              <CardTitle>{branchesCopy.detail.cards.contact}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                variant="inline"
                icon={<UserRound className="h-4 w-4" />}
                label={branchesCopy.detail.fields.manager}
                value={branch.contact.managerName || branchesCopy.detail.fields.notDefined}
              />
              <InfoRow
                variant="inline"
                icon={<Phone className="h-4 w-4" />}
                label={branchesCopy.detail.fields.phone}
                value={branch.contact.phone || branchesCopy.detail.fields.notDefined}
              />
              <InfoRow
                variant="inline"
                icon={<Mail className="h-4 w-4" />}
                label={branchesCopy.detail.fields.email}
                value={branch.contact.email || branchesCopy.detail.fields.notDefined}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{branchesCopy.detail.cards.address}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                variant="inline"
                icon={<MapPin className="h-4 w-4" />}
                label={branchesCopy.detail.fields.street}
                value={[
                  branch.address.street,
                  branch.address.exteriorNumber,
                  branch.address.interiorNumber,
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
              <InfoRow
                variant="inline"
                icon={<MapPin className="h-4 w-4" />}
                label={branchesCopy.detail.fields.neighborhood}
                value={
                  branch.address.neighborhood ||
                  branchesCopy.detail.fields.neighborhoodNotDefined
                }
              />
              <InfoRow
                variant="inline"
                icon={<MapPin className="h-4 w-4" />}
                label={branchesCopy.detail.fields.cityState}
                value={`${branch.address.city}, ${branch.address.state}`}
              />
              <InfoRow
                variant="inline"
                icon={<MapPin className="h-4 w-4" />}
                label={branchesCopy.detail.fields.postalCountry}
                value={`${branch.address.postalCode} · ${branch.address.country}`}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{branchesCopy.detail.cards.notes}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {branch.notes?.trim() || branchesCopy.detail.fields.notesEmpty}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </DetailPageShell>
  );
}
