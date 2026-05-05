import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { WizardPageShell } from "@shared/ui/page-shells/WizardPageShell";
import { useToast } from "@shared/hooks";
import { useCreateBranch } from "../../application";
import { BranchForm, type BranchFormRef } from "../components";
import { branchFormToCreateDTO, type BranchFormData } from "../validation/branchSchema";

const BRANCH_STEPS = [
  {
    id: "general",
    title: "Información general",
    description: "Código, nombre, estado y contacto",
  },
  {
    id: "address",
    title: "Dirección",
    description: "Ubicación de la sucursal",
  },
  {
    id: "review",
    title: "Revisión",
    description: "Confirmar datos antes de crear",
  },
];

export function BranchCreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<BranchFormRef>(null);

  const createMutation = useCreateBranch({
    onSuccess: (data) => {
      toast({
        title: "Sucursal creada",
        description: `${data.name} se registró correctamente`,
        variant: "success",
      });
      navigate("/branches");
    },
    onError: (error) => {
      toast({
        title: "Error al crear sucursal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: BranchFormData) => {
    createMutation.mutate(branchFormToCreateDTO(values));
  };

  return (
    <WizardPageShell
      steps={BRANCH_STEPS}
      formRef={formRef}
      header={{
        backHref: "/branches",
        backLabel: "Volver a sucursales",
        icon: <Building2 className="h-5 w-5" />,
        title: "Nueva sucursal",
        subtitle: "Registra una sucursal para operación",
      }}
      renderStep={(currentStep) => (
        <BranchForm
          ref={formRef}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          wizardMode
          wizardStepIndex={currentStep}
        />
      )}
      isSubmitting={createMutation.isPending}
      submitLabel="Crear sucursal"
      submittingLabel="Creando..."
      onCancel={() => navigate("/branches")}
      stepsAriaLabel="Pasos para registrar sucursal"
    />
  );
}
