import { useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Star,
  UserRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { InfoRow } from "@shared/ui/data-display";
import { useToast } from "@shared/hooks";
import { useBranch, useDeleteBranch } from "../../application";
import { BranchActions } from "../components";
import { BranchStatusBadge } from "../config/branchStatusConfig";

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: branch, isLoading, isError } = useBranch(id ?? "");

  const deleteMutation = useDeleteBranch({
    onSuccess: () => {
      toast({
        title: "Sucursal eliminada",
        variant: "success",
      });
      navigate("/branches");
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar sucursal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (branchId: string) => {
    deleteMutation.mutate(branchId);
  };

  return (
    <DetailPageShell
      isLoading={isLoading}
      notFound={!branch && isError}
      notFoundConfig={{
        icon: <Building2 />,
        title: "Sucursal no encontrada",
        description: "No se encontró la sucursal solicitada.",
        backHref: "/branches",
        backLabel: "Volver a sucursales",
      }}
      header={{
        backHref: "/branches",
        icon: <Building2 className="h-5 w-5" />,
        title: branch?.name ?? "Detalle de sucursal",
        subtitle: branch ? `Código ${branch.code}` : undefined,
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
            />
          ) : undefined,
      }}
      stats={
        branch
          ? [
              {
                title: "Sucursal principal",
                value: branch.isMain ? "Sí" : "No",
                tone: branch.isMain ? "primary" : "neutral",
                icon: <Star className="h-5 w-5" />,
              },
              {
                title: "Estado operativo",
                value: branch.isActive ? "Activa" : "Inactiva",
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
    >
      {branch ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="Responsable"
                value={branch.contact.managerName || "No definido"}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Teléfono"
                value={branch.contact.phone || "No definido"}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Correo"
                value={branch.contact.email || "No definido"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dirección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Calle"
                value={[
                  branch.address.street,
                  branch.address.exteriorNumber,
                  branch.address.interiorNumber,
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Colonia"
                value={branch.address.neighborhood || "No definida"}
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="Ciudad / Estado"
                value={`${branch.address.city}, ${branch.address.state}`}
              />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="CP / País"
                value={`${branch.address.postalCode} · ${branch.address.country}`}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </DetailPageShell>
  );
}
