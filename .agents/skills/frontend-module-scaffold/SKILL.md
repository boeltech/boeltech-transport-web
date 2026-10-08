---
name: frontend-module-scaffold
description: Scaffold de features en boeltech-transport-web (Feature-Sliced + Clean Architecture). Estructura de carpetas, archivos mínimos por capa, registro de rutas con lazy loading y guards, convención de exports y query keys. Usar al crear un feature nuevo de principio a fin.
---

# Frontend Module Scaffold — boeltech-transport-web

## Cuándo aplicar

- Crear un feature nuevo end-to-end
- Añadir una página o ruta a un feature existente
- Revisar si la estructura de carpetas de un feature es correcta
- Entender cómo registrar una ruta con guard y lazy loading

---

## Estructura canónica de feature

```
src/features/<module>/
├── domain/
│   ├── entities.ts           ← Enums, tipos, constantes, query key factory, interfaces de dominio
│   └── index.ts              ← Re-export de domain/
├── application/
│   ├── hooks/
│   │   └── use<Module>.ts    ← Hooks React Query (queries + mutations)
│   └── index.ts              ← Re-export de application/
├── infrastructure/
│   ├── <module>Api.ts        ← HTTP client — toda comunicación con la API
│   ├── mappers.ts            ← ApiRaw (snake_case) → Entidad (camelCase)
│   └── index.ts              ← Re-export de infrastructure/
├── presentation/
│   ├── pages/
│   │   ├── <Module>ListPage.tsx
│   │   ├── <Module>DetailPage.tsx
│   │   ├── Create<Module>Page.tsx
│   │   └── Edit<Module>Page.tsx
│   ├── components/
│   │   ├── <Module>Actions.tsx      ← Permisos + mutations + dialogs
│   │   ├── <Module>Table.tsx
│   │   ├── <Module>Card.tsx
│   │   ├── <Module>Card.skeleton.tsx
│   │   ├── <Module>Filters.tsx
│   │   ├── <Module>Form.tsx
│   │   └── index.ts
│   ├── config/
│   │   └── <module>StatusConfig.ts  ← createStatusBadgeComponent + CONSTANTS
│   ├── validation.ts                ← Schemas Zod para formularios
│   └── index.ts                     ← Re-export de presentation/ (sin páginas)
└── (sin index.ts raíz)              ← No crear en features nuevas (ADR-0102)
```

**Módulos existentes (referencia):** `vehicles`, `trips`, `drivers`, `employees`, `clients`, `invoicing`, `settings`, `catalogs`, `dashboard`, `branches`

---

## Archivos mínimos por capa

### domain/entities.ts

```typescript
// ── Enums ──────────────────────────────────────────────────────────
export const ModuleStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type ModuleStatusType = (typeof ModuleStatus)[keyof typeof ModuleStatus];

// ── Interfaces de dominio (camelCase) ──────────────────────────────
export interface Module {
  id: string;
  tenantId: string;
  name: string;
  status: ModuleStatusType;
  createdAt: string;
}

export interface ModuleListItem {
  id: string;
  name: string;
  status: ModuleStatusType;
}

// ── DTOs ───────────────────────────────────────────────────────────
export interface CreateModulePayload { name: string; }
export interface UpdateModulePayload { name?: string; status?: ModuleStatusType; }

// ── Query key factory ──────────────────────────────────────────────
export const moduleQueryKeys = {
  all: ["<module>"] as const,
  lists: () => [...moduleQueryKeys.all, "list"] as const,
  list: (params?: ModuleQueryParams) => [...moduleQueryKeys.lists(), params] as const,
  detail: (id: string) => [...moduleQueryKeys.all, "detail", id] as const,
} as const;
```

### infrastructure/mappers.ts

```typescript
// RAW types (snake_case) — solo en este archivo
export interface ApiModuleListItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface ApiModuleResponse extends ApiModuleListItem {
  tenant_id: string;
}

// Mappers
export const mapModuleListItem = (raw: ApiModuleListItem): ModuleListItem => ({
  id: raw.id,
  name: raw.name,
  status: raw.status as ModuleStatusType,
});

export const mapModuleDetail = (raw: ApiModuleResponse): Module => ({
  id: raw.id,
  tenantId: raw.tenant_id,
  name: raw.name,
  status: raw.status as ModuleStatusType,
  createdAt: raw.created_at,
});
```

### infrastructure/moduleApi.ts

```typescript
import { apiClient } from "@shared/api";
import { mapModuleListItem, mapModuleDetail } from "./mappers";
import type { Module, ModuleListItem, ModuleQueryParams, CreateModulePayload } from "@features/<module>/domain";

const BASE = "/<module>";

export const moduleApi = {
  async getAll(params?: ModuleQueryParams): Promise<MappedPaginatedResult<ModuleListItem>> {
    const { data } = await apiClient.get<ApiPaginatedResponse<ApiModuleListItem>>(BASE, { params });
    return { items: data.data.map(mapModuleListItem), pagination: data.pagination };
  },

  async getById(id: string): Promise<Module> {
    const { data } = await apiClient.get<ApiSingleResponse<ApiModuleResponse>>(`${BASE}/${id}`);
    return mapModuleDetail(data.data);
  },

  async create(payload: CreateModulePayload) {
    const { data } = await apiClient.post<{ message: string; data: { id: string } }>(BASE, payload);
    return data.data;
  },

  async update(id: string, payload: UpdateModulePayload) {
    await apiClient.put(`${BASE}/${id}`, payload);
  },

  async delete(id: string) {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
```

### application/hooks/useModule.ts

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { moduleApi } from "../../infrastructure";
import { moduleQueryKeys } from "@features/<module>/domain";

export const useModules = (params?: ModuleQueryParams) =>
  useQuery({
    queryKey: moduleQueryKeys.list(params),
    queryFn: () => moduleApi.getAll(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

export const useModule = (id: string) =>
  useQuery({
    queryKey: moduleQueryKeys.detail(id),
    queryFn: () => moduleApi.getById(id),
    enabled: !!id,
  });

export const useCreateModule = (callbacks?: MutationCallbacks) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateModulePayload) => moduleApi.create(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: moduleQueryKeys.lists() });
      callbacks?.onSuccess?.(result);
    },
    onError: callbacks?.onError,
  });
};

export const useDeleteModule = (callbacks?: MutationCallbacks) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moduleApi.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: moduleQueryKeys.lists() });
      qc.removeQueries({ queryKey: moduleQueryKeys.detail(id) });
      callbacks?.onSuccess?.();
    },
    onError: callbacks?.onError,
  });
};
```

### presentation/config/moduleStatusConfig.ts

```typescript
import { createStatusConfig } from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";

export const MODULE_STATUS_CONFIG = {
  active: createStatusConfig("success", { label: "Activo", icon: CheckCircle2 }),
  inactive: createStatusConfig("neutral", { label: "Inactivo", icon: XCircle }),
};

export const ModuleStatusBadge = createStatusBadgeComponent(MODULE_STATUS_CONFIG);
```

---

## Registro de rutas (lazy loading + guards)

```typescript
// src/app/router/routes.tsx

// 1. Lazy imports
const ModuleListPage = lazy(() =>
  import("@features/<module>/presentation/pages/ModuleListPage").then((m) => ({
    default: m.ModuleListPage,
  }))
);
const ModuleDetailPage = lazy(() =>
  import("@features/<module>/presentation/pages/ModuleDetailPage").then((m) => ({
    default: m.ModuleDetailPage,
  }))
);
const CreateModulePage = lazy(() =>
  import("@features/<module>/presentation/pages/CreateModulePage").then((m) => ({
    default: m.CreateModulePage,
  }))
);

// 2. Rutas dentro del árbol autenticado
{
  // Guard de acceso al módulo (cualquier usuario con acceso al módulo)
  element: <ModuleRoute module="<module>" />,
  children: [
    { path: "/<module>", element: withSuspense(ModuleListPage) },
    { path: "/<module>/:id", element: withSuspense(ModuleDetailPage) },
    {
      // Guard de permiso específico para create
      element: <PermissionRoute module="<module>" action="create" />,
      children: [
        { path: "/<module>/new", element: withSuspense(CreateModulePage) },
      ],
    },
  ],
},
```

**Reglas de routing:**
- Toda página va en `lazy()` — carga diferida.
- Usar `withSuspense(Page)` que envuelve en `<Suspense fallback={<LoadingPageState variant="list" />}>`
- `<ModuleRoute module="...">` bloquea acceso al módulo si el rol no tiene permisos.
- `<PermissionRoute module="..." action="...">` para acciones más granulares (create, delete).

---

## Superficie pública por capa (ADR-0102)

Las features nuevas no crean `index.ts` raíz. Cada capa expone su propio `index.ts` y otras features importan la capa que necesitan (`@features/<module>/domain`, `/application`, `/infrastructure`, `/presentation`). Solo se exporta lo que otra feature, `src/pages`, `src/widgets` o `@shared` consumen.

```typescript
// features/<module>/domain/index.ts
export type { Module, ModuleListItem, CreateModulePayload, UpdateModulePayload, ModuleStatusType } from "./entities";
export { ModuleStatus, moduleQueryKeys, MODULE_STATUS_LABELS } from "./entities";
```

```typescript
// features/<module>/application/index.ts
export { useModules, useModule, useCreateModule, useUpdateModule, useDeleteModule } from "./hooks/useModule";
```

```typescript
// features/<module>/presentation/index.ts — componentes reutilizables, nunca páginas
export { ModuleActions } from "./components/ModuleActions";
export { ModuleStatusBadge } from "./config/moduleStatusConfig";
```

**Matriz de imports con valor hacia otra feature** (`import type` siempre permitido):

| Desde | domain | application | infrastructure | presentation | raíz |
|---|---|---|---|---|---|
| `features/*/domain` | sí | no | no | no | no |
| `features/*/infrastructure` | sí | no | sí | no | no |
| `features/*/application` | sí | sí | sí | no | no |
| `features/*/presentation` | sí | sí | sí | sí (sin páginas) | no |
| `src/widgets` | sí | sí | sí | sí (sin páginas) | no |
| `src/shared` | sí | sí | no | no | no |
| `src/app`, `src/pages` | sí | sí | sí | sí | no |

- Las páginas se importan solo por ruta profunda (`@features/<module>/presentation/pages/<Page>`), desde el router con `lazy()` o desde otra página que la embebe.
- Query keys y filtros de invalidación (`QueryFilters` puros) viven en `domain/`; el `invalidateQueries` lo ejecuta el `application` del consumidor.
- Prohibido el alias `@/features/*`; usar `@features/*`.

---

## Checklist feature nuevo

- [ ] Carpeta `src/features/<module>/` con cuatro subcarpetas, cada una con su `index.ts` (sin `index.ts` raíz)
- [ ] `domain/entities.ts`: enums, tipos, `queryKeys`, constantes de labels
- [ ] `infrastructure/mappers.ts`: tipos raw + funciones de mapeo
- [ ] `infrastructure/<module>Api.ts`: métodos CRUD usando `apiClient`
- [ ] `application/hooks/use<Module>.ts`: hooks de query + mutation con invalidación
- [ ] `presentation/pages/`: al menos `ListPage` + `DetailPage`
- [ ] `presentation/components/<Module>Actions.tsx`: todos los permisos + mutations centralizados
- [ ] `presentation/config/<module>StatusConfig.ts`: si el módulo tiene estados
- [ ] `presentation/validation.ts`: schemas Zod del formulario
- [ ] Rutas registradas con lazy loading en `src/app/router/routes.tsx`
- [ ] Exports en el `index.ts` de cada capa; páginas solo por ruta profunda (nunca en un index)
- [ ] Ítem de navegación agregado en sidebar si el módulo es visible para usuarios
- [ ] `npm run lint && npm run build` pasan

---

## Anti-patrones

❌ **Importar la raíz `@features/<name>` o archivos profundos de otra feature** — importar el `index.ts` de la capa (`@features/<name>/application`, etc.) según la matriz de ADR-0102. Excepción: páginas por ruta profunda desde el router.

❌ **Exportar páginas desde cualquier `index.ts`** — arrastran la UI completa a quien importa hooks o tipos de la capa.

❌ **Tipos `Api*` (snake_case) fuera de `infrastructure/mappers.ts`** — el resto del frontend no debe ver snake_case.

❌ **`useQuery` en componentes de presentación** — siempre en hooks de `application/`.

❌ **Rutas sin lazy loading** — toda página usa `lazy()`.

❌ **Exportar componentes internos desde `index.ts`** sin necesidad real — contamina el API público del feature.

❌ **Mutaciones sin `invalidateQueries`** — el listado quedaría desactualizado.

---

## Referencias

| Recurso | Ruta |
|---|---|
| Feature completo de referencia | `src/features/vehicles/` |
| Routing con guards y lazy | `src/app/router/routes.tsx` |
| Guards disponibles | `src/app/router/` (`ModuleRoute`, `PermissionRoute`) |
| `withSuspense` helper | `src/app/router/routes.tsx` (función local en el mismo archivo) |
| `apiClient` | `src/shared/api/client/apiClient.ts` |
| Tipos de API response | `src/shared/api/` (`ApiPaginatedResponse`, `ApiSingleResponse`) |
| `usePermissions` | `src/shared/permissions/` |
| Toast helpers | `src/shared/hooks/useToast.ts` |
| Skill componentes | `.agents/skills/frontend-component/SKILL.md` |
| Skill design system | `.agents/skills/design-system/SKILL.md` |
