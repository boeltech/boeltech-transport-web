/**
 * VehicleForm
 *
 * Formulario reutilizable para crear/editar vehículos.
 * Incluye campos de Carta Porte 3.1.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleForm.tsx
 */

import { forwardRef, useImperativeHandle } from "react";
import { useForm, useFormContext, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Save,
  Loader2,
  Info,
  Truck,
  Settings,
  Gauge,
  ShieldCheck,
  FileText,
  ClipboardCheck,
} from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Alert, AlertDescription } from "@shared/ui/alert";

import {
  createVehicleSchema,
  VEHICLE_CREATE_WIZARD_STEP_FIELDS,
  type CreateVehicleFormData,
} from "../validation";
import {
  VEHICLE_TYPE_LABELS,
  VehicleType,
  type Vehicle,
} from "@features/vehicles/domain";

// Importar componentes de catálogo
import {
  TipoPermisoSelect,
  ConfigAutotransporteSelect,
} from "@features/catalogs";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export type VehicleFormRef = {
  triggerStepValidation: (stepIndex: number) => Promise<boolean>;
  requestSubmit: () => void;
};

interface VehicleFormProps {
  /** Vehículo existente (para modo edición) */
  vehicle?: Vehicle;
  /** Callback al enviar el formulario */
  onSubmit: (data: CreateVehicleFormData) => void;
  /** Estado de carga del submit */
  isSubmitting?: boolean;
  /** Wizard de alta (solo creación); mantiene campos montados con `hidden` */
  wizardMode?: boolean;
  /** Índice de paso visible (0–3). El 3 es revisión. */
  wizardStepIndex?: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convierte una entidad Vehicle del dominio a datos del formulario.
 * Maneja la conversión de Value Objects a campos planos.
 */
function formDataFromVehicle(vehicle: Vehicle): CreateVehicleFormData {
  return {
    // Identification
    unitNumber: vehicle.unitNumber,
    licensePlate: vehicle.licensePlate,
    vin: vehicle.vin ?? "",

    // Characteristics
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    type: vehicle.type,
    color: vehicle.color ?? "",

    // Capacities (from Value Object)
    loadCapacity: vehicle.capacities.loadCapacity ?? undefined,
    volumeCapacity: vehicle.capacities.volumeCapacity ?? undefined,
    fuelTankCapacity: vehicle.capacities.fuelTankCapacity ?? undefined,
    expectedFuelEfficiency:
      vehicle.capacities.expectedFuelEfficiency ?? undefined,

    // Mileage
    currentMileage: vehicle.currentMileage,

    // Documentation (from Value Object)
    insurancePolicy: vehicle.documentation.insurancePolicy ?? "",
    insuranceExpiry: vehicle.documentation.insuranceExpiry ?? "",
    sctPermitNumber: vehicle.documentation.sctPermitNumber ?? "",
    sctPermitExpiry: vehicle.documentation.sctPermitExpiry ?? "",

    // Carta Porte 3.1 (from Value Object)
    satTipoPermisoCode: vehicle.cartaPorte.satTipoPermisoCode ?? "",
    satConfigAutotransporteCode:
      vehicle.cartaPorte.satConfigAutotransporteCode ?? "",
    pesoBrutoVehicular: vehicle.cartaPorte.pesoBrutoVehicular ?? undefined,
    insuranceCompany: vehicle.cartaPorte.insuranceCompany ?? "",
    aseguraMedioAmbiente: vehicle.cartaPorte.aseguraMedioAmbiente ?? "",
    polizaMedioAmbiente: vehicle.cartaPorte.polizaMedioAmbiente ?? "",
    aseguraCarga: vehicle.cartaPorte.aseguraCarga ?? "",
    polizaCarga: vehicle.cartaPorte.polizaCarga ?? "",
  };
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

function VehicleCreateWizardSummary() {
  const form = useFormContext<CreateVehicleFormData>();
  const v = form.getValues();
  return (
    <FormSectionCard
      title="Revisión"
      icon={<ClipboardCheck className="h-4 w-4" />}
      description="Confirma los datos antes de registrar el vehículo en la flota"
      contentClassName="grid gap-4 text-sm sm:grid-cols-2"
    >
        <div>
          <p className="text-muted-foreground">Número de unidad</p>
          <p className="font-medium">{v.unitNumber || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Placa</p>
          <p className="font-medium">{v.licensePlate || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Marca / Modelo / Año</p>
          <p className="font-medium">
            {[v.brand, v.model, v.year].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Tipo</p>
          <p className="font-medium">
            {v.type ? VEHICLE_TYPE_LABELS[v.type as VehicleType] : "—"}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground">Permiso SCT / Número</p>
          <p className="font-medium">
            {[v.satTipoPermisoCode, v.sctPermitNumber].filter(Boolean).join(" · ") ||
              "—"}
          </p>
        </div>
    </FormSectionCard>
  );
}

const defaultValues: CreateVehicleFormData = {
  unitNumber: "",
  licensePlate: "",
  vin: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  type: "truck",
  color: "",
  loadCapacity: undefined,
  volumeCapacity: undefined,
  fuelTankCapacity: undefined,
  expectedFuelEfficiency: undefined,
  currentMileage: 0,
  insurancePolicy: "",
  insuranceExpiry: "",
  sctPermitNumber: "",
  sctPermitExpiry: "",
  // Carta Porte 3.1
  satTipoPermisoCode: "",
  satConfigAutotransporteCode: "",
  pesoBrutoVehicular: undefined,
  insuranceCompany: "",
  aseguraMedioAmbiente: "",
  polizaMedioAmbiente: "",
  aseguraCarga: "",
  polizaCarga: "",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const VehicleForm = forwardRef<VehicleFormRef, VehicleFormProps>(
  function VehicleForm(
    {
      vehicle,
      onSubmit,
      isSubmitting = false,
      wizardMode = false,
      wizardStepIndex = 0,
    },
    ref,
  ) {
    const isEditMode = !!vehicle;
    const wizardActive = Boolean(wizardMode && !isEditMode);
    const ws = wizardStepIndex;

    const form = useForm<CreateVehicleFormData, unknown, CreateVehicleFormData>({
      resolver: zodResolver(createVehicleSchema) as Resolver<CreateVehicleFormData>,
      defaultValues: vehicle ? formDataFromVehicle(vehicle) : defaultValues,
    });

    const handleSubmit = form.handleSubmit((data) => {
      onSubmit(data);
    });

    useImperativeHandle(
      ref,
      () => ({
        triggerStepValidation: async (stepIndex: number) => {
          const fields = VEHICLE_CREATE_WIZARD_STEP_FIELDS[stepIndex];
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={cn(
              "space-y-6",
              wizardActive && ws !== 0 && "hidden",
            )}
            data-wizard-panel="0"
          >
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* IDENTIFICACIÓN */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FormSectionCard
          title="Identificación"
          icon={<Truck className="h-4 w-4" />}
          description="Datos básicos de identificación del vehículo"
          contentClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            {/* Número de Unidad */}
            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Unidad *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: U-001"
                      {...field}
                      disabled={isEditMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Placa */}
            <FormField
              control={form.control}
              name="licensePlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: ABC-123-A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* VIN */}
            <FormField
              control={form.control}
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN / Serie</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número de serie del vehículo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </FormSectionCard>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CARACTERÍSTICAS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FormSectionCard
          title="Características"
          icon={<Settings className="h-4 w-4" />}
          description="Especificaciones del vehículo"
          contentClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            {/* Marca */}
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Kenworth" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Modelo */}
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: T680" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Año */}
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1900}
                      max={new Date().getFullYear() + 1}
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(VehicleType).map(([, value]) => (
                        <SelectItem key={value} value={value}>
                          {VEHICLE_TYPE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Blanco" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kilometraje */}
            <FormField
              control={form.control}
              name="currentMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kilometraje Actual{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value !== "" ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </FormSectionCard>
          </div>

          <div
            className={cn(
              "space-y-6",
              wizardActive && ws !== 1 && "hidden",
            )}
            data-wizard-panel="1"
          >
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CAPACIDADES */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FormSectionCard
          title="Capacidades"
          icon={<Gauge className="h-4 w-4" />}
          description="Capacidad de carga y consumo de combustible"
          contentClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            {/* Capacidad de Carga */}
            <FormField
              control={form.control}
              name="loadCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidad de Carga (ton)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Mantener string vacío o número - Zod lo transformará
                        field.onChange(val === "" ? null : parseFloat(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capacidad de Volumen */}
            <FormField
              control={form.control}
              name="volumeCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidad de Volumen (m³)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Mantener string vacío o número - Zod lo transformará
                        field.onChange(val === "" ? null : parseFloat(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capacidad del Tanque */}
            <FormField
              control={form.control}
              name="fuelTankCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanque de Combustible (L)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Mantener string vacío o número - Zod lo transformará
                        field.onChange(val === "" ? null : parseFloat(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rendimiento Esperado */}
            <FormField
              control={form.control}
              name="expectedFuelEfficiency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rendimiento (km/L)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Mantener string vacío o número - Zod lo transformará
                        field.onChange(val === "" ? null : parseFloat(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </FormSectionCard>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DOCUMENTACIÓN Y SEGUROS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FormSectionCard
          title="Documentación y Seguros"
          icon={<ShieldCheck className="h-4 w-4" />}
          description="Póliza de responsabilidad civil y permiso SCT — requeridos para emitir Carta Porte"
          contentClassName="space-y-4"
        >
            {/* Seguro Responsabilidad Civil */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* AseguraRespCivil */}
              <FormField
                control={form.control}
                name="insuranceCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Aseguradora Resp. Civil{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        (AseguraRespCivil)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Qualitas, GNP, HDI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PolizaRespCivil */}
              <FormField
                control={form.control}
                name="insurancePolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Póliza Resp. Civil{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        (PolizaRespCivil)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Número de póliza" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vencimiento — campo administrativo, no es atributo Carta Porte */}
              <FormField
                control={form.control}
                name="insuranceExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento del Seguro</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Permiso SCT — PermSCT + NumPermisoSCT */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* PermSCT */}
              <FormField
                control={form.control}
                name="satTipoPermisoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipo de Permiso SCT{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        (PermSCT)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <TipoPermisoSelect
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar tipo de permiso"
                      />
                    </FormControl>
                    <FormDescription>
                      Catálogo SAT c_TipoPermiso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* NumPermisoSCT */}
              <FormField
                control={form.control}
                name="sctPermitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Número de Permiso SCT{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        (NumPermisoSCT)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Número de permiso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vencimiento — campo administrativo */}
              <FormField
                control={form.control}
                name="sctPermitExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento del Permiso</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
        </FormSectionCard>
          </div>

          <div
            className={cn(
              "space-y-6",
              wizardActive && ws !== 2 && "hidden",
            )}
            data-wizard-panel="2"
          >
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CARTA PORTE 3.1 — AUTOTRANSPORTE */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FormSectionCard
          title={
            <>
              Carta Porte 3.1 — Autotransporte
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                SAT
              </span>
            </>
          }
          icon={<FileText className="h-4 w-4" />}
          description="Datos del nodo Autotransporte requeridos para el complemento Carta Porte del CFDI"
          contentClassName="space-y-6"
        >
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Estos campos se usan automáticamente al generar la Carta Porte.
                La placa (PlacaVM) y el año (AnioModeloVM) se toman de los datos
                del vehículo registrados arriba.
              </AlertDescription>
            </Alert>

            {/* ── IdentificacionVehicular ─────────────────────────────────── */}
            <div>
              <p className="text-sm font-medium mb-3">
                Identificación Vehicular
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* ConfigVehicular */}
                <FormField
                  control={form.control}
                  name="satConfigAutotransporteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Configuración Vehicular{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          (ConfigVehicular)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <ConfigAutotransporteSelect
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar configuración"
                        />
                      </FormControl>
                      <FormDescription>
                        Catálogo SAT c_ConfigAutotransporte (ej: C2, T3S2R4)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PesoBrutoVehicular */}
                <FormField
                  control={form.control}
                  name="pesoBrutoVehicular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Peso Bruto Vehicular (ton){" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          (PesoBrutoVehicular)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min={0}
                          max={9999.999}
                          placeholder="Ej: 35.000"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "" ? undefined : parseFloat(val),
                            );
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Peso bruto total en toneladas métricas (máx 3 decimales)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Seguros Opcionales ──────────────────────────────────────── */}
            <div>
              <p className="text-sm font-medium mb-1">
                Seguros Adicionales{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (opcionales)
                </span>
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Incluir solo si la mercancía cuenta con seguro de carga o de
                daños a medio ambiente
              </p>

              {/* Medio Ambiente */}
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                {/* AseguraMedioAmbiente */}
                <FormField
                  control={form.control}
                  name="aseguraMedioAmbiente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Aseguradora Medio Ambiente{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          (AseguraMedioAmbiente)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre de la aseguradora"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PolizaMedioAmbiente */}
                <FormField
                  control={form.control}
                  name="polizaMedioAmbiente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Póliza Medio Ambiente{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          (PolizaMedioAmbiente)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Número de póliza" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Carga */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* AseguraCarga */}
                <FormField
                  control={form.control}
                  name="aseguraCarga"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Aseguradora de Carga{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          (AseguraCarga)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre de la aseguradora"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PolizaCarga */}
                <FormField
                  control={form.control}
                  name="polizaCarga"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Póliza de Carga{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          (PolizaCarga)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Número de póliza" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
        </FormSectionCard>
          </div>

          <div
            className={cn(!wizardActive || ws !== 3 ? "hidden" : undefined)}
            data-wizard-panel="3"
          >
            <VehicleCreateWizardSummary />
          </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SUBMIT (solo edición o formulario completo sin wizard) */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {!wizardActive && (
          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? "Guardar Cambios" : "Crear Vehículo"}
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
  },
);

VehicleForm.displayName = "VehicleForm";

export default VehicleForm;
