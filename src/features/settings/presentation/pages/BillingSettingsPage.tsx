/**
 * BillingSettingsPage
 *
 * Página de configuración de facturación electrónica (CFDI).
 * Incluye configuración de PAC, certificados y valores por defecto.
 *
 * Arquitectura plug-and-play: el sub-panel de configuración PAC
 * varía según el proveedor seleccionado, sin acoplar la UI a un PAC específico.
 *
 * Ubicación: src/features/settings/presentation/pages/BillingSettingsPage.tsx
 */

import { memo, useCallback, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FileKey,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Info,
  ServerCog,
} from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Skeleton } from "@shared/ui/skeleton";
import { Badge } from "@shared/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { usePermissions } from "@shared/permissions";
import { ROLES } from "@shared/constants/roles";

import {
  UsoCfdiSelect,
  FormaPagoSelect,
  MetodoPagoSelect,
  ProductoServicioCPSearch,
  UnidadMedidaSearch,
} from "@features/catalogs";
import type { CatalogItem } from "@features/catalogs";

import { SettingsLayout } from "../components/SettingsLayout";
import { SettingsCard } from "../components/SettingsLayout";
import {
  useBillingSettings,
  useUpdateBillingSettings,
  useUploadCertificate,
  useTestPacConnection,
} from "../../application/hooks";
import {
  PAC_PROVIDER_LABELS,
  PAC_USES_CREDENTIALS,
  PacProviders,
  type BillingSettings,
  type UpdateBillingSettingsDTO,
  type PacProvider,
  type TestPacConnectionPayload,
} from "../../domain";

// ============================================================================
// SAT CATALOG CONSTANTS / NORMALIZERS
// ============================================================================

const ALLOWED_MONEDA = ["MXN", "USD"] as const;
const ALLOWED_TASA_IVA = [0, 0.08, 0.16] as const;

function normalizeMoneda(value: unknown): (typeof ALLOWED_MONEDA)[number] | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  return ALLOWED_MONEDA.includes(normalized as (typeof ALLOWED_MONEDA)[number])
    ? (normalized as (typeof ALLOWED_MONEDA)[number])
    : null;
}

function normalizeTasaIva(value: unknown): (typeof ALLOWED_TASA_IVA)[number] | null {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return null;
  const matched = ALLOWED_TASA_IVA.find((allowed) => Math.abs(allowed - parsed) < 0.000001);
  return matched ?? null;
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const billingSettingsSchema = z
  .object({
    pacProvider: z.string().min(1, "Selecciona un proveedor"),
    // Credenciales opcionales a nivel schema — la validación condicional
    // se resuelve en superRefine según el PAC seleccionado.
    pacUsername: z.string().optional(),
    pacPassword: z.string().optional(),
    defaultUsoCfdi: z.string().min(1, "Selecciona un uso de CFDI"),
    defaultFormaPago: z.string().min(1, "Selecciona una forma de pago"),
    defaultMetodoPago: z.string().min(1, "Selecciona un método de pago"),
    serieFactura: z
      .string()
      .min(1, "La serie es requerida")
      .max(5, "Máximo 5 caracteres"),
    folioInicial: z.number().min(1, "El folio inicial debe ser mayor a 0"),
    testMode: z.boolean(),
    claveProductoServicio: z
      .string()
      .min(1, "La clave de producto/servicio es requerida"),
    claveUnidad: z.string().min(1, "La clave de unidad es requerida"),
    moneda: z.enum(ALLOWED_MONEDA, {
      errorMap: () => ({ message: "Moneda SAT inválida. Usa MXN o USD." }),
    }),
    tasaIva: z
      .number()
      .refine((value) => ALLOWED_TASA_IVA.includes(value as (typeof ALLOWED_TASA_IVA)[number]), {
        message: "Tasa de IVA inválida. Usa 0%, 8% o 16%.",
      }),
    serieCartaPorte: z
      .string()
      .min(1, "La serie es requerida")
      .max(5, "Máximo 5 caracteres"),
    folioInicialCartaPorte: z
      .number()
      .min(1, "El folio inicial debe ser mayor a 0"),
  })
  .superRefine((data, ctx) => {
    // Solo los PACs con credenciales por tenant requieren usuario
    const usesCredentials =
      PAC_USES_CREDENTIALS[data.pacProvider as PacProvider] ?? false;
    if (usesCredentials && !data.pacUsername?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pacUsername"],
        message: "El usuario es requerido para este PAC",
      });
    }
  });

type BillingSettingsFormData = z.infer<typeof billingSettingsSchema>;

// ============================================================================
// CATÁLOGOS ESTÁTICOS (valores fijos del SAT — no cambian entre versiones)
// ============================================================================

const MONEDA_OPTIONS = [
  { code: "MXN", name: "MXN – Peso mexicano" },
  { code: "USD", name: "USD – Dólar americano" },
];

const TASA_IVA_OPTIONS = [
  { value: 0.16, label: "16% (general)" },
  { value: 0.08, label: "8% (zona fronteriza)" },
  { value: 0, label: "0% (tasa 0 / exento)" },
];

// ============================================================================
// PAC PROVIDER CONFIG — componente plug-and-play por proveedor
// ============================================================================

interface PacProviderConfigProps {
  form: UseFormReturn<BillingSettingsFormData>;
  settings?: BillingSettings;
  isPending: boolean;
  canTestConnection: boolean;
  onTestConnection: () => void;
  isDirty: boolean;
}

/**
 * Sub-panel de configuración que varía según el PAC seleccionado.
 *
 * Para agregar un nuevo PAC: añadirlo a PacProviders en entities.ts,
 * actualizar PAC_USES_CREDENTIALS, y agregar su case aquí si requiere
 * campos específicos de configuración.
 */
function PacProviderConfig({
  form,
  settings,
  isPending,
  canTestConnection,
  onTestConnection,
  isDirty,
}: PacProviderConfigProps) {
  const pacProvider = form.watch("pacProvider") as PacProvider | undefined;

  if (!pacProvider) return null;

  // ── ProFact: token de servidor, sin credenciales por tenant ───────────────
  if (pacProvider === PacProviders.PROFACT) {
    return (
      <div className="space-y-4">
        <Alert>
          <ServerCog className="h-4 w-4" />
          <AlertTitle>Configuración a nivel servidor</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              ProFact se autentica mediante{" "}
              <code className="font-mono text-xs">PROFACT_TOKEN</code>, una
              variable de entorno del servidor. No se requieren credenciales por
              tenant.
            </p>
            <p className="text-muted-foreground text-xs">
              El ambiente (pruebas / producción) es determinado automáticamente
              por la configuración del servidor.
            </p>
          </AlertDescription>
        </Alert>

        <div className="space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTestConnection}
            disabled={isPending || !canTestConnection}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Verificar conexión con ProFact
          </Button>
          {isDirty && (
            <p className="text-xs text-muted-foreground">
              Estás probando con configuración no guardada.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Stub: solo para desarrollo ─────────────────────────────────────────────
  if (pacProvider === PacProviders.STUB) {
    return (
      <Alert variant="warning">
        <Info className="h-4 w-4" />
        <AlertTitle>Modo desarrollo</AlertTitle>
        <AlertDescription>
          El PAC Stub no timbra facturas reales. Úsalo solo en entornos de
          desarrollo local.
        </AlertDescription>
      </Alert>
    );
  }

  // ── PACs con credenciales por tenant (Finkok, SW Sapien, Digisat, FacturAPI)
  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>PAC no disponible aún</AlertTitle>
        <AlertDescription>
          {PAC_PROVIDER_LABELS[pacProvider]} está en el roadmap. Configura{" "}
          <strong>ProFact</strong> para comenzar a timbrar.
        </AlertDescription>
      </Alert>

      {/* Campos de credenciales — disponibles cuando el PAC esté habilitado */}
      <div className="grid gap-4 sm:grid-cols-2 opacity-50 pointer-events-none">
        <div>
          <Label htmlFor="pacUsername">
            Usuario <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pacUsername"
            {...form.register("pacUsername")}
            placeholder="usuario@empresa.com"
            disabled
          />
          {form.formState.errors.pacUsername && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.pacUsername.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="pacPassword">
            Contraseña
            {settings?.pacPasswordConfigured && (
              <Badge variant="secondary" className="ml-2">
                Configurada
              </Badge>
            )}
          </Label>
          <Input
            id="pacPassword"
            type="password"
            {...form.register("pacPassword")}
            placeholder={
              settings?.pacPasswordConfigured ? "••••••••" : "Ingresa la contraseña"
            }
            disabled
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BillingSettingsPage = memo(function BillingSettingsPage() {
  const { hasPermission, hasRole } = usePermissions();
  const { data: settings, isLoading, isError } = useBillingSettings();
  const updateMutation = useUpdateBillingSettings();
  const testConnectionMutation = useTestPacConnection();
  const canUpdateSettings = hasPermission("settings", "update");
  const canUploadCertificate = hasRole(ROLES.ADMIN);

  const form = useForm<BillingSettingsFormData>({
    resolver: zodResolver(billingSettingsSchema),
    defaultValues: { pacProvider: PacProviders.PROFACT },
    values: settings ? mapSettingsToForm(settings) : undefined,
  });

  const onSubmit = useCallback(
    (data: BillingSettingsFormData) => {
      if (!canUpdateSettings) return;

      const dto: UpdateBillingSettingsDTO = {
        pacProvider: data.pacProvider,
        defaultUsoCfdi: data.defaultUsoCfdi,
        defaultFormaPago: data.defaultFormaPago,
        defaultMetodoPago: data.defaultMetodoPago,
        serieFactura: data.serieFactura,
        folioInicial: data.folioInicial,
        testMode: data.testMode,
        claveProductoServicio: data.claveProductoServicio,
        claveUnidad: data.claveUnidad,
        moneda: data.moneda,
        tasaIva: data.tasaIva,
        serieCartaPorte: data.serieCartaPorte,
        folioInicialCartaPorte: data.folioInicialCartaPorte,
      };

      // Solo incluir credenciales si el PAC las usa y se proporcionaron
      const usesCredentials =
        PAC_USES_CREDENTIALS[data.pacProvider as PacProvider] ?? false;
      if (usesCredentials) {
        if (data.pacUsername) dto.pacUsername = data.pacUsername;
        if (data.pacPassword) dto.pacPassword = data.pacPassword;
      }

      updateMutation.mutate(dto);
    },
    [updateMutation, canUpdateSettings],
  );

  const handleTestConnection = useCallback(() => {
    if (!canUpdateSettings) return;
    const values = form.getValues();
    const payload: TestPacConnectionPayload = {
      pacProvider: values.pacProvider as PacProvider,
      pacUsername: values.pacUsername || undefined,
      pacPassword: values.pacPassword || undefined,
    };
    testConnectionMutation.mutate(payload);
  }, [form, testConnectionMutation, canUpdateSettings]);

  if (isLoading) {
    return (
      <SettingsLayout sectionTitle="Facturación">
        <BillingSettingsPageSkeleton />
      </SettingsLayout>
    );
  }

  if (isError) {
    return (
      <SettingsLayout sectionTitle="Facturación">
        <div className="text-center py-12 text-muted-foreground">
          Error al cargar la configuración. Por favor, intenta de nuevo.
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout sectionTitle="Facturación">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!canUpdateSettings && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Modo solo lectura</AlertTitle>
            <AlertDescription>
              Tu rol puede consultar la configuración de facturación, pero no
              editarla.
            </AlertDescription>
          </Alert>
        )}

        <fieldset
          disabled={!canUpdateSettings}
          className={!canUpdateSettings ? "opacity-70" : undefined}
        >
          <div className="space-y-6">

            {/* Proveedor PAC */}
            <SettingsCard
              title="Proveedor de timbrado (PAC)"
              description="Configura la conexión con tu Proveedor Autorizado de Certificación"
            >
              <div className="space-y-6">
                {/* Selector de PAC */}
                <div className="max-w-xs">
                  <Label htmlFor="pacProvider">
                    Proveedor PAC <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.watch("pacProvider") ?? ""}
                    onValueChange={(value) => {
                      if (!value) return;
                      form.setValue("pacProvider", value, { shouldDirty: true });
                      // Limpiar credenciales al cambiar de PAC
                      form.setValue("pacUsername", "");
                      form.setValue("pacPassword", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAC_PROVIDER_LABELS).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.pacProvider && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.pacProvider.message}
                    </p>
                  )}
                </div>

                {/* Sub-panel específico del PAC seleccionado */}
                <PacProviderConfig
                  form={form}
                  settings={settings}
                  isPending={testConnectionMutation.isPending}
                  canTestConnection={canUpdateSettings}
                  onTestConnection={handleTestConnection}
                  isDirty={form.formState.isDirty}
                />
              </div>
            </SettingsCard>

        {/* Valores por defecto CFDI */}
        <SettingsCard
          title="Valores por defecto"
          description="Estos valores se usarán automáticamente en nuevas facturas"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Uso CFDI — catálogo SAT dinámico */}
            <div>
              <Label>
                Uso de CFDI <span className="text-destructive">*</span>
              </Label>
              <UsoCfdiSelect
                value={form.watch("defaultUsoCfdi")}
                onValueChange={(value) =>
                  form.setValue("defaultUsoCfdi", value, { shouldDirty: true })
                }
              />
              {form.formState.errors.defaultUsoCfdi && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.defaultUsoCfdi.message}
                </p>
              )}
            </div>

            {/* Forma de Pago — catálogo SAT dinámico */}
            <div>
              <Label>
                Forma de Pago <span className="text-destructive">*</span>
              </Label>
              <FormaPagoSelect
                value={form.watch("defaultFormaPago")}
                onValueChange={(value) =>
                  form.setValue("defaultFormaPago", value, {
                    shouldDirty: true,
                  })
                }
              />
              {form.formState.errors.defaultFormaPago && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.defaultFormaPago.message}
                </p>
              )}
            </div>

            {/* Método de Pago — catálogo SAT dinámico */}
            <div>
              <Label>
                Método de Pago <span className="text-destructive">*</span>
              </Label>
              <MetodoPagoSelect
                value={form.watch("defaultMetodoPago")}
                onValueChange={(value) =>
                  form.setValue("defaultMetodoPago", value, {
                    shouldDirty: true,
                  })
                }
              />
              {form.formState.errors.defaultMetodoPago && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.defaultMetodoPago.message}
                </p>
              )}
            </div>
          </div>
        </SettingsCard>

        {/* Foliación */}
        <SettingsCard
          title="Foliación"
          description="Configura la serie y numeración de tus facturas"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="serieFactura">
                Serie <span className="text-destructive">*</span>
              </Label>
              <Input
                id="serieFactura"
                {...form.register("serieFactura")}
                placeholder="A"
                maxLength={5}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Máximo 5 caracteres
              </p>
            </div>

            <div>
              <Label htmlFor="folioInicial">
                Folio Inicial <span className="text-destructive">*</span>
              </Label>
              <Input
                id="folioInicial"
                type="number"
                min={1}
                {...form.register("folioInicial", { valueAsNumber: true })}
                placeholder="1"
              />
            </div>

            {settings && (
              <div className="sm:col-span-2 p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Folio actual:{" "}
                  <span className="font-medium text-foreground">
                    {settings.serieFactura}-{settings.folioActual}
                  </span>
                </p>
              </div>
            )}
          </div>
        </SettingsCard>

        {/* Claves SAT por defecto */}
        <SettingsCard
          title="Claves SAT por defecto"
          description="Se aplicarán automáticamente en cada concepto del CFDI de ingreso"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Clave producto/servicio — búsqueda en catálogo SAT grande */}
            <div>
              <Label>
                Clave producto/servicio{" "}
                <span className="text-destructive">*</span>
              </Label>
              <ProductoServicioCPSearch
                value={form.watch("claveProductoServicio")}
                onSelect={(item: CatalogItem) =>
                  form.setValue("claveProductoServicio", item.code, {
                    shouldDirty: true,
                  })
                }
                onClear={() =>
                  form.setValue("claveProductoServicio", "", {
                    shouldDirty: true,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para transporte de carga por carretera usa{" "}
                <code className="font-mono">78101800</code>
              </p>
              {form.formState.errors.claveProductoServicio && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.claveProductoServicio.message}
                </p>
              )}
            </div>

            {/* Clave unidad — búsqueda en catálogo SAT grande */}
            <div>
              <Label>
                Clave de unidad <span className="text-destructive">*</span>
              </Label>
              <UnidadMedidaSearch
                value={form.watch("claveUnidad")}
                onSelect={(item: CatalogItem) =>
                  form.setValue("claveUnidad", item.code, {
                    shouldDirty: true,
                  })
                }
                onClear={() =>
                  form.setValue("claveUnidad", "", { shouldDirty: true })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para servicios de transporte usa{" "}
                <code className="font-mono">E48</code>
              </p>
              {form.formState.errors.claveUnidad && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.claveUnidad.message}
                </p>
              )}
            </div>

            {/* Moneda — solo MXN/USD son relevantes para transporte nacional */}
            <div>
              <Label htmlFor="moneda">
                Moneda <span className="text-destructive">*</span>
              </Label>
              <Select
                value={normalizeMoneda(form.watch("moneda")) ?? "MXN"}
                onValueChange={(v) =>
                  form.setValue("moneda", v.toUpperCase(), { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar moneda" />
                </SelectTrigger>
                <SelectContent>
                  {MONEDA_OPTIONS.map((o) => (
                    <SelectItem key={o.code} value={o.code}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.moneda && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.moneda.message}
                </p>
              )}
            </div>

            {/* Tasa IVA */}
            <div>
              <Label htmlFor="tasaIva">
                Tasa de IVA <span className="text-destructive">*</span>
              </Label>
              <Select
                value={String(normalizeTasaIva(form.watch("tasaIva")) ?? 0.16)}
                onValueChange={(v) =>
                  form.setValue("tasaIva", parseFloat(v), {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tasa" />
                </SelectTrigger>
                <SelectContent>
                  {TASA_IVA_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.tasaIva && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.tasaIva.message}
                </p>
              )}
            </div>
          </div>
        </SettingsCard>

        {/* Foliación Carta Porte 3.1 */}
        <SettingsCard
          title="Carta Porte 3.1 — Foliación"
          description="Serie y numeración exclusiva para CFDI de ingreso con Complemento Carta Porte"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="serieCartaPorte">
                Serie <span className="text-destructive">*</span>
              </Label>
              <Input
                id="serieCartaPorte"
                {...form.register("serieCartaPorte")}
                placeholder="CP"
                maxLength={5}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usa una serie diferente a la de tus facturas normales (ej:{" "}
                <code className="font-mono">CP</code>)
              </p>
              {form.formState.errors.serieCartaPorte && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.serieCartaPorte.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="folioInicialCartaPorte">
                Folio inicial <span className="text-destructive">*</span>
              </Label>
              <Input
                id="folioInicialCartaPorte"
                type="number"
                min={1}
                {...form.register("folioInicialCartaPorte", {
                  valueAsNumber: true,
                })}
                placeholder="1"
              />
              {form.formState.errors.folioInicialCartaPorte && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.folioInicialCartaPorte.message}
                </p>
              )}
            </div>

            {settings && (
              <div className="sm:col-span-2 p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Último folio emitido:{" "}
                  <span className="font-medium text-foreground">
                    {settings.serieCartaPorte
                      ? `${settings.serieCartaPorte}-${settings.folioActualCartaPorte}`
                      : "Sin folio emitido aún"}
                  </span>
                </p>
              </div>
            )}
          </div>
        </SettingsCard>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={!form.formState.isDirty || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Guardar cambios
              </Button>
            </div>
          </div>
        </fieldset>

        {/* Certificado de Sello Digital */}
        <CertificateCard settings={settings!} canUpload={canUploadCertificate} />

        {!canUploadCertificate && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Carga de certificado restringida</AlertTitle>
            <AlertDescription>
              Solo el rol administrador puede cargar o actualizar el certificado
              fiscal (.cer/.key).
            </AlertDescription>
          </Alert>
        )}
      </form>
    </SettingsLayout>
  );
});

// ============================================================================
// CERTIFICATE CARD
// ============================================================================

interface CertificateCardProps {
  settings: BillingSettings;
  canUpload: boolean;
}

const CertificateCard = memo(function CertificateCard({
  settings,
  canUpload,
}: CertificateCardProps) {
  const uploadMutation = useUploadCertificate();
  const [files, setFiles] = useState<{
    certificate: File | null;
    privateKey: File | null;
    password: string;
  }>({
    certificate: null,
    privateKey: null,
    password: "",
  });

  const handleUpload = useCallback(() => {
    if (!canUpload || !files.certificate || !files.privateKey || !files.password)
      return;

    uploadMutation.mutate({
      certificate: files.certificate,
      privateKey: files.privateKey,
      password: files.password,
    });
  }, [files, uploadMutation, canUpload]);

  const isExpiringSoon =
    settings.certificateExpiry &&
    new Date(settings.certificateExpiry) <
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <SettingsCard
      title="Certificado de Sello Digital (CSD)"
      description="Certificado emitido por el SAT para firmar facturas"
      actions={
        settings.certificateConfigured ? (
          <Badge
            variant={isExpiringSoon ? "outline" : "secondary"}
            className={
              isExpiringSoon
                ? "shrink-0 border-amber-500 text-amber-800 dark:text-amber-200"
                : "shrink-0 bg-emerald-600 text-white hover:bg-emerald-600/90"
            }
          >
            {settings.certificateConfigured ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                No configurado
              </>
            )}
          </Badge>
        ) : null
      }
    >
      <div className="space-y-4">
        {settings.certificateConfigured && settings.certificateExpiry && (
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm">
              Vence:{" "}
              <span
                className={
                  isExpiringSoon
                    ? "font-medium text-warning"
                    : "font-medium text-foreground"
                }
              >
                {new Date(settings.certificateExpiry).toLocaleDateString(
                  "es-MX",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </span>
            </p>
            {isExpiringSoon && (
              <p className="text-xs text-warning mt-1">
                El certificado vence pronto. Renuévalo antes de la fecha de
                expiración.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Certificado (.cer)</Label>
            <div className="mt-1">
              <input
                type="file"
                accept=".cer"
                id="certificate-file"
                className="sr-only"
                disabled={!canUpload}
                onChange={(e) =>
                  setFiles((prev) => ({
                    ...prev,
                    certificate: e.target.files?.[0] || null,
                  }))
                }
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <label htmlFor="certificate-file" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {files.certificate?.name || "Seleccionar archivo"}
                </label>
              </Button>
            </div>
          </div>

          <div>
            <Label>Llave privada (.key)</Label>
            <div className="mt-1">
              <input
                type="file"
                accept=".key"
                id="privatekey-file"
                className="sr-only"
                disabled={!canUpload}
                onChange={(e) =>
                  setFiles((prev) => ({
                    ...prev,
                    privateKey: e.target.files?.[0] || null,
                  }))
                }
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <label htmlFor="privatekey-file" className="cursor-pointer">
                  <FileKey className="h-4 w-4 mr-2" />
                  {files.privateKey?.name || "Seleccionar archivo"}
                </label>
              </Button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="cert-password">Contraseña del certificado</Label>
            <Input
              id="cert-password"
              type="password"
              value={files.password}
              onChange={(e) =>
                setFiles((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Contraseña de la llave privada"
              disabled={!canUpload}
            />
          </div>

          <div className="sm:col-span-2">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={
                !files.certificate ||
                !files.privateKey ||
                !files.password ||
                uploadMutation.isPending ||
                !canUpload
              }
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {settings.certificateConfigured
                ? "Actualizar certificado"
                : "Cargar certificado"}
            </Button>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
});

// ============================================================================
// SKELETON
// ============================================================================

function BillingSettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function mapSettingsToForm(settings: BillingSettings): BillingSettingsFormData {
  const allowedMoneda = normalizeMoneda(settings.moneda) ?? "MXN";
  const allowedTasa = normalizeTasaIva(settings.tasaIva) ?? 0.16;

  return {
    pacProvider: settings.pacProvider || PacProviders.PROFACT,
    pacUsername: settings.pacUsername ?? "",
    pacPassword: "",
    defaultUsoCfdi: settings.defaultUsoCfdi,
    defaultFormaPago: settings.defaultFormaPago,
    defaultMetodoPago: settings.defaultMetodoPago,
    serieFactura: settings.serieFactura,
    folioInicial: settings.folioInicial,
    testMode: settings.testMode,
    claveProductoServicio: settings.claveProductoServicio,
    claveUnidad: settings.claveUnidad,
    moneda: allowedMoneda,
    tasaIva: allowedTasa,
    serieCartaPorte: settings.serieCartaPorte,
    folioInicialCartaPorte: settings.folioInicialCartaPorte,
  };
}
