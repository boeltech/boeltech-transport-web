import { useNavigate, useParams } from "react-router-dom";
import { Building2 } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { useToast } from "@shared/hooks";
import { useBranch, useUpdateBranch } from "../../application";
import { BranchForm } from "../components";
import { branchFormToUpdateDTO, type BranchFormData } from "../validation/branchSchema";

export function BranchEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: branch, isLoading } = useBranch(id ?? "");

  const updateMutation = useUpdateBranch({
    onSuccess: () => {
      toast({
        title: "Sucursal actualizada",
        description: "Los cambios se guardaron correctamente",
        variant: "success",
      });
      navigate(`/branches/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar sucursal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: BranchFormData) => {
    if (!id) return;
    updateMutation.mutate({
      id,
      data: branchFormToUpdateDTO(values),
    });
  };

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!branch}
      notFoundConfig={{
        icon: <Building2 />,
        title: "Sucursal no encontrada",
        description: "No existe la sucursal que intentas editar.",
        backHref: "/branches",
        backLabel: "Volver a sucursales",
      }}
      header={{
        backHref: `/branches/${id}`,
        icon: <Building2 className="h-5 w-5" />,
        title: branch ? `Editar ${branch.name}` : "Editar sucursal",
        subtitle: branch ? `Código: ${branch.code}` : undefined,
      }}
    >
      {branch ? (
        <BranchForm
          branch={branch}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      ) : null}
    </FormPageShell>
  );
}
