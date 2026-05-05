import { forwardRef, useImperativeHandle } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormContext, type Resolver } from "react-hook-form";
import { Building2, ClipboardCheck, Loader2, Save } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Textarea } from "@shared/ui/text-area";
import { FormSectionCard } from "@shared/ui/form-section-card";
import type { Branch } from "../../domain";
import { BranchStatus, BRANCH_STATUS_LABELS } from "../../domain";
import {
  branchFormSchema,
  defaultBranchFormValues,
  type BranchFormData,
} from "../validation/branchSchema";
import { cn } from "@shared/lib/utils/cn";

export type BranchFormRef = {
  triggerStepValidation: (stepIndex: number) => Promise<boolean>;
  requestSubmit: () => void;
};

interface BranchFormProps {
  branch?: Branch;
  onSubmit: (data: BranchFormData) => void;
  isSubmitting?: boolean;
  wizardMode?: boolean;
  wizardStepIndex?: number;
}

const WIZARD_STEP_FIELDS: (keyof BranchFormData)[][] = [
  ["code", "name", "status", "isMain", "phone", "email", "managerName"],
  [
    "street",
    "exteriorNumber",
    "interiorNumber",
    "neighborhood",
    "city",
    "state",
    "postalCode",
    "country",
    "notes",
  ],
];

function branchToFormData(branch: Branch): BranchFormData {
  return {
    code: branch.code,
    name: branch.name,
    status: branch.status,
    isMain: branch.isMain,
    street: branch.address.street,
    exteriorNumber: branch.address.exteriorNumber ?? "",
    interiorNumber: branch.address.interiorNumber ?? "",
    neighborhood: branch.address.neighborhood ?? "",
    city: branch.address.city,
    state: branch.address.state,
    postalCode: branch.address.postalCode,
    country: branch.address.country,
    phone: branch.contact.phone ?? "",
    email: branch.contact.email ?? "",
    managerName: branch.contact.managerName ?? "",
    notes: branch.notes ?? "",
  };
}

function BranchWizardSummary() {
  const form = useFormContext<BranchFormData>();
  const values = form.getValues();

  return (
    <FormSectionCard
      title="Revisión"
      icon={<ClipboardCheck className="h-4 w-4" />}
      description="Confirma los datos antes de registrar la sucursal"
      contentClassName="grid gap-4 text-sm sm:grid-cols-2"
    >
      <div>
        <p className="text-muted-foreground">Código</p>
        <p className="font-medium">{values.code || "—"}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Nombre</p>
        <p className="font-medium">{values.name || "—"}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Estado</p>
        <p className="font-medium">{BRANCH_STATUS_LABELS[values.status]}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Sucursal principal</p>
        <p className="font-medium">{values.isMain ? "Sí" : "No"}</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-muted-foreground">Dirección</p>
        <p className="font-medium">
          {[
            values.street,
            values.exteriorNumber,
            values.interiorNumber,
            values.neighborhood,
            values.city,
            values.state,
            values.postalCode,
            values.country,
          ]
            .filter(Boolean)
            .join(", ") || "—"}
        </p>
      </div>
    </FormSectionCard>
  );
}

export const BranchForm = forwardRef<BranchFormRef, BranchFormProps>(
  function BranchForm(
    { branch, onSubmit, isSubmitting = false, wizardMode = false, wizardStepIndex = 0 },
    ref,
  ) {
    const wizardActive = Boolean(wizardMode && !branch);

    const form = useForm<BranchFormData, unknown, BranchFormData>({
      resolver: zodResolver(branchFormSchema) as Resolver<BranchFormData>,
      defaultValues: branch ? branchToFormData(branch) : defaultBranchFormValues,
    });

    useImperativeHandle(
      ref,
      () => ({
        triggerStepValidation: async (stepIndex: number) => {
          const fields = WIZARD_STEP_FIELDS[stepIndex];
          if (!fields?.length) return true;
          return form.trigger(fields);
        },
        requestSubmit: () => {
          void form.handleSubmit(onSubmit)();
        },
      }),
      [form, onSubmit],
    );

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div
            className={cn("space-y-6", wizardActive && wizardStepIndex !== 0 && "hidden")}
            data-wizard-panel="0"
          >
            <FormSectionCard
              title="Datos generales"
              icon={<Building2 className="h-4 w-4" />}
              description="Información principal y datos de contacto"
              contentClassName="grid gap-4 sm:grid-cols-2"
            >
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: MTY-01" {...field} disabled={Boolean(branch)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sucursal Monterrey" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={BranchStatus.ACTIVE}>
                          {BRANCH_STATUS_LABELS[BranchStatus.ACTIVE]}
                        </SelectItem>
                        <SelectItem value={BranchStatus.INACTIVE}>
                          {BRANCH_STATUS_LABELS[BranchStatus.INACTIVE]}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isMain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal principal</FormLabel>
                    <Select
                      value={field.value ? "true" : "false"}
                      onValueChange={(value) => field.onChange(value === "true")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Marca esta opción solo para la sucursal matriz.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="81 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input placeholder="sucursal@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="managerName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Responsable</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del responsable de sucursal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSectionCard>
          </div>

          <div
            className={cn("space-y-6", wizardActive && wizardStepIndex !== 1 && "hidden")}
            data-wizard-panel="1"
          >
            <FormSectionCard
              title="Dirección y notas"
              icon={<Building2 className="h-4 w-4" />}
              description="Ubicación física de la sucursal"
              contentClassName="grid gap-4 sm:grid-cols-2"
            >
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Calle *</FormLabel>
                    <FormControl>
                      <Input placeholder="Av. Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="exteriorNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número exterior</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interiorNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número interior</FormLabel>
                    <FormControl>
                      <Input placeholder="A-2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colonia</FormLabel>
                    <FormControl>
                      <Input placeholder="Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad *</FormLabel>
                    <FormControl>
                      <Input placeholder="Monterrey" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nuevo León" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código postal *</FormLabel>
                    <FormControl>
                      <Input placeholder="64000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País *</FormLabel>
                    <FormControl>
                      <Input placeholder="México" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Notas operativas de la sucursal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSectionCard>
          </div>

          <div className={cn(!wizardActive || wizardStepIndex !== 2 ? "hidden" : undefined)}>
            <BranchWizardSummary />
          </div>

          {!wizardActive ? (
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {branch ? "Guardar cambios" : "Crear sucursal"}
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </form>
      </Form>
    );
  },
);

BranchForm.displayName = "BranchForm";
