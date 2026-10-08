---
name: frontend-component
description: Patrones de componentes React del ERP-T (Clean Architecture, feature-sliced). Cubre Actions, StatusBadge/StatusConfig, hooks de React Query, mappers API, convenciones de formularios con RHF, y anti-patrones. Usar al crear componentes de feature, hooks de aplicación, o al revisar si un componente sigue las convenciones del repo.
---

# Frontend Component Patterns — boeltech-transport-web

## Cuándo aplicar

- Crear un componente en `presentation/components/`
- Crear un hook en `application/`
- Crear un mapper o repositorio en `infrastructure/`
- Definir una query key o dominio en `domain/`
- Revisar si un componente sigue las convenciones del repo

---

## Patrón: `*Actions` (componente de acciones)

Centraliza TODOS los checks de permiso + mutations + dialogs de confirmación de una entidad.

```tsx
// features/<module>/presentation/components/<Module>Actions.tsx

export function VehicleActions({ vehicle, variant = "dropdown" }: VehicleActionsProps) {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();

  const canUpdate = hasPermission("vehicles", "update");
  const canDelete = hasPermission("vehicles", "delete");

  const deleteMutation = useDeleteVehicle({
    onSuccess: () => { toastSuccess("Eliminado"); navigate("/vehicles"); },
    onError: (err) => toastError(err.message),
  });

  // variant="dropdown" → DropdownMenu para tablas
  // variant="buttons"  → botones en fila para detail pages
  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        ...
        {canUpdate && <DropdownMenuItem>Editar</DropdownMenuItem>}
        {canDelete && <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>}
      </DropdownMenu>
    );
  }

  return (
    <>
      {canUpdate && <Button onClick={() => navigate(`/vehicles/${id}/edit`)}>Editar</Button>}
      {canDelete && <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Eliminar</Button>}
      <AlertDialog open={deleteOpen} ...>...</AlertDialog>
    </>
  );
}
```

**Reglas del patrón `*Actions`:**
- Soporta `variant="dropdown"` (tablas) y `variant="buttons"` (detail pages).
- Todos los `hasPermission` van aquí — ninguno en la página.
- Mutations propias del componente: `useDelete*`, `useUpdate*Status`.
- Dialogs de confirmación destructivos en `AlertDialog`; de contexto en `Dialog`.
- Acepta callbacks opcionales (`onView`, `onEdit`, `onDelete`) para modo tabla, y `onActionComplete` para modo detail.

---

## Patrón: `StatusConfig` + `StatusBadge`

Cada feature define su propia configuración de estados en `presentation/config/`:

```typescript
// features/<module>/presentation/config/<module>StatusConfig.ts
import { createStatusConfig } from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";

export const VEHICLE_STATUS_CONFIG: Record<VehicleStatusType, StatusConfig> = {
  available: createStatusConfig("success", {
    label: "Disponible",
    icon: CheckCircle2,
    description: "Operativo y disponible",
  }),
  on_trip: createStatusConfig("info", {
    label: "En Viaje",
    icon: Truck,
    tone: "solid", // ← override para estados activos
  }),
  in_maintenance: createStatusConfig("warning", {
    label: "En Mantenimiento",
    icon: Wrench,
  }),
  out_of_service: createStatusConfig("destructive", {
    label: "Fuera de Servicio",
    icon: XCircle,
  }),
};

// Componente tipado — re-export para uso en el feature
export const VehicleStatusBadge = createStatusBadgeComponent(VEHICLE_STATUS_CONFIG);
```

**Uso:**
```tsx
<VehicleStatusBadge status={vehicle.status} />
<VehicleStatusBadge status={vehicle.status} showIcon size="lg" />
```

**Cuándo usar `tone: "solid"`:** estados activos que requieren atención (En Viaje, En Ruta, Activo). El resto en `soft`.

---

## Patrón: Hook de aplicación (React Query)

```typescript
// features/<module>/application/hooks/use<Module>.ts

// Query key factory (en domain/)
export const vehicleQueryKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleQueryKeys.all, "list"] as const,
  list: (params?: VehicleQueryParams) => [...vehicleQueryKeys.lists(), params] as const,
  detail: (id: string) => [...vehicleQueryKeys.all, "detail", id] as const,
};

// Hook de lista con paginación
export const useVehicles = (params?: VehicleQueryParams) => {
  return useQuery({
    queryKey: vehicleQueryKeys.list(params),
    queryFn: () => vehiclesApi.getAll(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // UX: mantiene data anterior mientras carga
  });
};

// Hook de detalle
export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: vehicleQueryKeys.detail(id),
    queryFn: () => vehiclesApi.getById(id),
    enabled: !!id,
  });
};

// Hook de mutación con invalidación
export const useCreateVehicle = (callbacks?: MutationCallbacks) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVehiclePayload) => vehiclesApi.create(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: vehicleQueryKeys.lists() });
      callbacks?.onSuccess?.(result);
    },
    onError: callbacks?.onError,
  });
};

export const useDeleteVehicle = (callbacks?: MutationCallbacks) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: vehicleQueryKeys.lists() });
      qc.removeQueries({ queryKey: vehicleQueryKeys.detail(id) });
      callbacks?.onSuccess?.();
    },
    onError: callbacks?.onError,
  });
};
```

---

## Patrón: API Client (infrastructure)

```typescript
// features/<module>/infrastructure/<module>Api.ts

// Importa del cliente compartido
import { apiClient, mapActionResponse } from "@shared/api";
import { mapVehicleList, mapVehicleDetail } from "./mappers";

export const vehiclesApi = {
  async getAll(params?: VehicleQueryParams) {
    const { data } = await apiClient.get<ApiPaginatedResponse<ApiVehicleListItem>>("/vehicles", { params });
    return mapVehicleList(data);  // ← mapper convierte snake_case → camelCase
  },

  async getById(id: string): Promise<Vehicle> {
    const { data } = await apiClient.get<ApiSingleResponse<ApiVehicleResponse>>(`/vehicles/${id}`);
    return mapVehicleDetail(data.data);
  },

  async create(payload: CreateVehiclePayload): Promise<{ id: string }> {
    const { data } = await apiClient.post<CreateVehicleRawResponse>("/vehicles", payload);
    return { id: data.data.id };
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/vehicles/${id}`);
  },
};
```

---

## Patrón: Mapper (infrastructure)

```typescript
// features/<module>/infrastructure/mappers.ts

// Tipos raw de la API (snake_case) — solo en este archivo
export interface ApiVehicleListItemResponse {
  id: string;
  unit_number: string;
  license_plate: string;
  status: string;
  created_at: string;
}

// Mapper → entidad camelCase del dominio
export const mapVehicleListItem = (raw: ApiVehicleListItemResponse): VehicleListItem => ({
  id: raw.id,
  unitNumber: raw.unit_number,
  licensePlate: raw.license_plate,
  status: raw.status as VehicleStatusType,
  createdAt: raw.created_at,
});

export const mapVehicleList = (raw: ApiPaginatedResponse<ApiVehicleListItemResponse>): MappedPaginatedResult<VehicleListItem> => ({
  items: raw.data.map(mapVehicleListItem),
  pagination: raw.pagination,
});
```

**Regla:** los tipos `Api*` (snake_case) viven únicamente en `infrastructure/mappers.ts`. El resto del frontend solo ve tipos camelCase del dominio.

---

## Patrón: Formularios con React Hook Form

### Alta (create)

```tsx
const form = useForm<CreateVehicleForm>({
  resolver: zodResolver(createVehicleSchema),
  defaultValues: { brand: "", licensePlate: "", type: undefined },
});

const { mutate, isPending } = useCreateVehicle({
  onSuccess: () => { navigate("/vehicles"); toastSuccess("Creado"); },
  onError: (err) => toastError(err.message),
});

return (
  <FormPageShell title="Nuevo vehículo" isLoading={false}>
    <form onSubmit={form.handleSubmit((data) => mutate(data))}>
      <FormSectionCard title="Datos básicos">
        <Controller name="brand" control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <Label htmlFor="brand">Marca</Label>
              <Input {...field} id="brand" error={!!fieldState.error} aria-invalid={!!fieldState.error} />
              {fieldState.error && <FieldInlineError>{fieldState.error.message}</FieldInlineError>}
            </div>
          )}
        />
      </FormSectionCard>
    </form>
  </FormPageShell>
);
```

### Edición (edit) — reglas críticas

```tsx
const { data: vehicle, isLoading } = useVehicle(id);

// 1. No montar el form hasta tener data
if (isLoading) return <LoadingPageState variant="form" />;

// 2. defaultValues, no solo values
const form = useForm<EditVehicleForm>({
  resolver: zodResolver(editVehicleSchema),
  defaultValues: vehicleToFormValues(vehicle),  // ← función de mapping
});
```

```tsx
// 3. key={id} para remount al cambiar entidad
<VehicleForm key={vehicle.id} vehicle={vehicle} />
```

```tsx
// 4. Selects opcionales: sentinela __none__ con RHFSelect
import { RHFSelect } from "@shared/ui/form/RHFSelect";
<RHFSelect name="type" control={form.control} label="Tipo" optional />
```

### Validación UX en formularios (patrón homologado)

- Errores bajo el campo: `<FieldInlineError>` (`text-xs`), clase `error` + ARIA en el control.
- En wizard al avanzar de paso: no toast — usar `<FormValidationSummary>` tras `trigger` fallido.
- En formularios simples: toast de error + scroll al primer campo inválido.

---

## Query keys — convenciones

```typescript
export const vehicleQueryKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleQueryKeys.all, "list"] as const,
  list: (params?: VehicleQueryParams) => [...vehicleQueryKeys.lists(), params] as const,
  detail: (id: string) => [...vehicleQueryKeys.all, "detail", id] as const,
} as const;
```

Al invalidar, usar el nivel más específico posible:
```typescript
qc.invalidateQueries({ queryKey: vehicleQueryKeys.lists() });  // invalida todos los listados
qc.removeQueries({ queryKey: vehicleQueryKeys.detail(id) });   // elimina caché del detalle
```

---

## Exports del feature (un `index.ts` por capa, ADR-0102)

```typescript
// features/<module>/domain/index.ts — tipos, constantes, query keys
export * from "./entities";

// features/<module>/application/index.ts — hooks
export { useVehicles, useVehicle, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from "./hooks/useVehicles";

// features/<module>/presentation/index.ts — solo componentes que otra feature reutiliza
export { VehicleStatusBadge } from "./config/vehicleStatusConfig";
// NO exportar páginas (el router las carga por ruta profunda con lazy())
// NO exportar componentes internos (VehicleForm, VehicleTable, etc.)
```

Otras features importan la capa: `import { useVehicles } from "@features/vehicles/application"`. Nunca la raíz `@features/vehicles` ni el alias `@/features/*`.

---

## Anti-patrones

❌ **`hasPermission` en JSX de la página** — siempre en `*Actions`.

❌ **Snake_case en tipos de dominio** — el mapper es el único lugar donde existe `unit_number`; el resto del frontend usa `unitNumber`.

❌ **API calls en componentes** — toda llamada HTTP en `infrastructure/`; hooks en `application/`.

❌ **Mutación sin invalidar la query key** — el listado quedará desactualizado hasta el próximo refetch.

❌ **`values` sin `defaultValues` en edición** — los Selects de Radix necesitan `defaultValues` al montar.

❌ **No usar `key={id}`** al reutilizar un formulario de edición para diferentes entidades — el estado interno de RHF no se resetea.

❌ **Exportar componentes internos o páginas desde un `index.ts`** — solo lo que otros módulos necesitan importar, en el index de su capa; las páginas van por ruta profunda (ADR-0102).

❌ **Hook o mapper que importa la raíz o `/presentation` de otra feature** — arrastra páginas completas; importar `@features/<x>/application` o `/domain`.

---

## Referencias

| Recurso | Ruta |
|---|---|
| `*Actions` de referencia | `features/vehicles/presentation/components/VehicleActions.tsx` |
| `StatusConfig` de referencia | `features/vehicles/presentation/config/vehicleStatusConfig.ts` |
| Hooks de referencia | `features/vehicles/application/hooks/useVehicles.ts` |
| `vehiclesApi` de referencia | `features/vehicles/infrastructure/vehiclesApi.ts` |
| Mappers de referencia | `features/vehicles/infrastructure/mappers.ts` |
| `RHFSelect` | `src/shared/ui/form/RHFSelect.tsx` |
| `FieldInlineError` | `src/shared/ui/form/` |
| `FormValidationSummary` | `src/shared/ui/form/` |
| `usePermissions` | `src/shared/permissions/` |
| Toast helpers | `src/shared/hooks/useToast.ts` |
| Design system skill | `.agents/skills/design-system/SKILL.md` |
