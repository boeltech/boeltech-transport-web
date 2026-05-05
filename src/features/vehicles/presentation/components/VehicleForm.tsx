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
import { Badge } from "@shared/ui/badge";
import { Input } from "@shared/ui/input";
import {
  Form,
  FormControl,
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
import { SatFieldLabel } from "@shared/ui/data-display";

import {
  createVehicleSchema,
  parsePesoBrutoVehicularFormInput,
  VEHICLE_CREATE_WIZARD_STEP_FIELDS,
  type CreateVehicleFormData,
} from "../validation";
import {
  VEHICLE_TYPE_LABELS,
  VehicleType,
  type VehicleTypeValue,
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
  /** Muestra u oculta las claves SAT en las etiquetas del formulario. */
  showSatCodes?: boolean;
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
    pesoBrutoVehicular:
      parsePesoBrutoVehicularFormInput(vehicle.cartaPorte.pesoBrutoVehicular),
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
            {v.type ? VEHICLE_TYPE_LABELS[v.type as VehicleTypeValue] : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Kilometraje actual</p>
          <p className="font-medium">
            {typeof v.currentMileage === "number"
              ? `${new Intl.NumberFormat("es-MX").format(v.currentMileage)} km`
              : "Sin captura (se registrará 0 km)"}
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
  currentMileage: undefined,
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

/** Celdas de grid: sin `h-full` para que, con `items-start` en el grid, no se estire la fila al mostrar errores. */
const FORM_GRID_ITEM_CLASS =
  "flex min-h-0 flex-col gap-2 space-y-0";

function FormGridGrowSpacer() {
  return (
    <div className="min-h-0 min-w-0 flex-1 shrink basis-0" aria-hidden />
  );
}

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
      showSatCodes = true,
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
          contentClassName="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            {/* Número de Unidad */}
            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Número de Unidad *</FormLabel>
                  <FormGridGrowSpacer />
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
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Placa *</FormLabel>
                  <FormGridGrowSpacer />
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
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>VIN / Serie</FormLabel>
                  <FormGridGrowSpacer />
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
          contentClassName="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            {/* Marca */}
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Marca *</FormLabel>
                  <FormGridGrowSpacer />
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
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Modelo *</FormLabel>
                  <FormGridGrowSpacer />
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
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Año *</FormLabel>
                  <FormGridGrowSpacer />
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
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Tipo *</FormLabel>
                  <FormGridGrowSpacer />
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
                      {(Object.values(VehicleType) as VehicleTypeValue[]).map(
                        (value) => (
                          <SelectItem key={value} value={value}>
                            {VEHICLE_TYPE_LABELS[value]}
                          </SelectItem>
                        ),
                      )}
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
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Color</FormLabel>
                  <FormGridGrowSpacer />
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
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Kilometraje actual</FormLabel>
                  <FormGridGrowSpacer />
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Opcional — 0 si nuevo"
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
          contentClassName="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            {/* Capacidad de Carga */}
            <FormField
              control={form.control}
              name="loadCapacity"
              render={({ field }) => (
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Carga (ton)</FormLabel>
                  <FormGridGrowSpacer />
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Ej: 28.5"
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
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Volumen (m3)</FormLabel>
                  <FormGridGrowSpacer />
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Ej: 120"
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
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>Tanque (L)</FormLabel>
                  <FormGridGrowSpacer />
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Ej: 750"
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
                <FormItem className={FORM_GRID_ITEM_CLASS}>
                  <FormLabel>
                    Rendimiento (km/L)
                  </FormLabel>
                  <FormGridGrowSpacer />
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Ej: 2.8"
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
          description="Datos administrativos para operación y Carta Porte"
          contentClassName="space-y-4"
        >
            {/* Seguro Responsabilidad Civil */}
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Responsabilidad civil
            </p>
            <div className="grid items-start gap-4 sm:grid-cols-3">
              {/* AseguraRespCivil */}
              <FormField
                control={form.control}
                name="insuranceCompany"
                render={({ field }) => (
                  <FormItem className={FORM_GRID_ITEM_CLASS}>
                    <FormLabel>
                      <SatFieldLabel
                        label="Aseguradora Resp. Civil"
                        satCode="AseguraRespCivil"
                        showSatCode={showSatCodes}
                      />
                    </FormLabel>
                    <FormGridGrowSpacer />
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
                  <FormItem className={FORM_GRID_ITEM_CLASS}>
                    <FormLabel>
                      <SatFieldLabel
                        label="Póliza Resp. Civil"
                        satCode="PolizaRespCivil"
                        showSatCode={showSatCodes}
                      />
                    </FormLabel>
                    <FormGridGrowSpacer />
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
                  <FormItem className={FORM_GRID_ITEM_CLASS}>
                    <FormLabel>
                      <SatFieldLabel
                        label="Vencimiento del Seguro"
                        showSatCode={showSatCodes}
                      />
                    </FormLabel>
                    <FormGridGrowSpacer />
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Permiso SCT — PermSCT + NumPermisoSCT */}
            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Permiso SCT
            </p>
            <div className="grid items-start gap-4 sm:grid-cols-3">
              {/* PermSCT */}
              <FormField
                control={form.control}
                name="satTipoPermisoCode"
                render={({ field }) => (
                  <FormItem className={FORM_GRID_ITEM_CLASS}>
                    <FormLabel>
                      <SatFieldLabel
                        label="Tipo de Permiso SCT"
                        satCode="PermSCT"
                        showSatCode={showSatCodes}
                      />
                    </FormLabel>
                    <FormGridGrowSpacer />
                    <FormControl>
                      <TipoPermisoSelect
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar tipo de permiso"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* NumPermisoSCT */}
              <FormField
                control={form.control}
                name="sctPermitNumber"
                render={({ field }) => (
                  <FormItem className={FORM_GRID_ITEM_CLASS}>
                    <FormLabel>
                      <SatFieldLabel
                        label="Número de Permiso SCT"
                        satCode="NumPermisoSCT"
                        showSatCode={showSatCodes}
                      />
                    </FormLabel>
                    <FormGridGrowSpacer />
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
                  <FormItem className={FORM_GRID_ITEM_CLASS}>
                    <FormLabel>
                      <SatFieldLabel
                        label="Vencimiento del Permiso"
                        showSatCode={showSatCodes}
                      />
                    </FormLabel>
                    <FormGridGrowSpacer />
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
            <span className="inline-flex items-center gap-2">
              Carta Porte 3.1 — Autotransporte
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium">
                SAT
              </Badge>
            </span>
          }
          icon={<FileText className="h-4 w-4" />}
          description="Datos SAT base del vehículo (se pueden complementar por viaje/carga)"
          contentClassName="space-y-6"
        >
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Se usa automáticamente al generar Carta Porte. Placa y año se
                toman del vehículo.
              </AlertDescription>
            </Alert>

            {/* ── IdentificacionVehicular ─────────────────────────────────── */}
            <div>
              <p className="text-sm font-medium mb-3">
                Identificación Vehicular
              </p>
              <div className="grid items-start gap-4 sm:grid-cols-2">
                {/* ConfigVehicular */}
                <FormField
                  control={form.control}
                  name="satConfigAutotransporteCode"
                  render={({ field }) => (
                    <FormItem className={FORM_GRID_ITEM_CLASS}>
                      <FormLabel>
                        <SatFieldLabel
                          label="Configuración Vehicular"
                          satCode="ConfigVehicular"
                          showSatCode={showSatCodes}
                        />
                      </FormLabel>
                      <FormGridGrowSpacer />
                      <FormControl>
                        <ConfigAutotransporteSelect
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar configuración"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PesoBrutoVehicular */}
                <FormField
                  control={form.control}
                  name="pesoBrutoVehicular"
                  render={({ field }) => (
                    <FormItem className={FORM_GRID_ITEM_CLASS}>
                      <FormLabel>
                        <SatFieldLabel
                          label="Peso Bruto Vehicular (ton)"
                          satCode="PesoBrutoVehicular"
                          showSatCode={showSatCodes}
                        />
                      </FormLabel>
                      <FormGridGrowSpacer />
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          min={0}
                          max={9999.999}
                          placeholder="Ej: 35"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              field.onChange(undefined);
                              return;
                            }
                            const n = parsePesoBrutoVehicularFormInput(val);
                            field.onChange(
                              n === undefined ? undefined : n,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Seguros Opcionales ──────────────────────────────────────── */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Seguros adicionales predeterminados (opcionales)
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Estos datos funcionan como base para Carta Porte; si un viaje o
                carga requiere un seguro distinto, se captura en ese flujo.
              </p>

              {/* Medio Ambiente */}
              <div className="grid items-start gap-4 sm:grid-cols-2 mb-4">
                {/* AseguraMedioAmbiente */}
                <FormField
                  control={form.control}
                  name="aseguraMedioAmbiente"
                  render={({ field }) => (
                    <FormItem className={FORM_GRID_ITEM_CLASS}>
                      <FormLabel>
                        <SatFieldLabel
                          label="Aseguradora Medio Ambiente"
                          satCode="AseguraMedioAmbiente"
                          showSatCode={showSatCodes}
                        />
                      </FormLabel>
                      <FormGridGrowSpacer />
                      <FormControl>
                        <Input
                          placeholder="Aseguradora por defecto"
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
                    <FormItem className={FORM_GRID_ITEM_CLASS}>
                      <FormLabel>
                        <SatFieldLabel
                          label="Póliza Medio Ambiente"
                          satCode="PolizaMedioAmbiente"
                          showSatCode={showSatCodes}
                        />
                      </FormLabel>
                      <FormGridGrowSpacer />
                      <FormControl>
                        <Input placeholder="Póliza por defecto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                El seguro de carga (aseguradora y póliza) se captura por
                mercancía en el wizard de viajes, no a nivel de vehículo.
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
