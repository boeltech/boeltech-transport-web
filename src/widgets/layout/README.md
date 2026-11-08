# App shell (`src/widgets/layout`)

Chrome global alrededor del `<Outlet />`: providers, sidebar, header, toasts. Las pantallas
viven dentro y usan **page shells** (`src/shared/ui/page-shells/README.md`), capa distinta.

Intención y reglas visibles (header sólido, títulos solo en el page shell, toast vs alert vs
badge vs campana): SoT `D:\cowork\boeltech\erp-transport\design\tlamx\platforms\web\design.md` §3 y §6.
Demo viva: `/design-system` → App Shell.

```
App Shell (widgets/)  →  Sidebar + Header + main → Outlet
                                                   └─ Page Shell (shared/ui/page-shells)
                                                        └─ Feature
```

## Providers

Dos niveles; el orden canónico está documentado en el JSDoc de cada archivo:

| Nivel | Archivo | Orden (exterior → interior) |
|-------|---------|-----------------------------|
| Global | `src/app/App.tsx` | Query → Theme → Toast → Router |
| Shell autenticado | `ui/AppLayout.tsx` | Auth → ProductOnboardingGate → SubscriptionRequiredGate → Permission → Tooltip → Sidebar → `LayoutShell` |

Cada provider puede consumir a los que lo envuelven. `ToastProvider`: `top-right`, 4000 ms;
no montar otro `Toaster` en features.

## `LayoutShell`

| Elemento | Comportamiento |
|----------|----------------|
| Sidebar desktop | Fijo, **240 px** / **56 px** colapsado en `lg+` (`sidebarLayout.ts`) |
| `MobileSidebar` | Drawer en `< lg` (breakpoint 1024 px); abre desde el botón menú del header |
| Header | Fijo, `h-14`, offset horizontal según el ancho del sidebar |
| `<main>` | `pt-16`, `px-4 md:px-6 lg:px-8`, `pb-4 md:pb-6 lg:pb-8`, `max-w-7xl mx-auto` |

Al colapsar, el margin del main y el `left` del header deben moverse sincronizados
(`duration-300`). Estado colapsado persistido en `localStorage` (`boeltech-sidebar-collapsed`,
`SidebarProvider`); colapsado = solo íconos + `Tooltip`.

## Navegación

- Config: `navigationConfig` en `src/widgets/sidebar/model/navigation.ts` (`NavGroup[]` / `NavItem`).
- RBAC: `useNavigation()` — `module` + `action` (default `read`) o `roles`.
- Ítem activo: prefijo de ruta más largo (evita marcar `/users` y `/users/activity` a la vez).
- Badges: `useNavigationWithBadges()` / `enrichNavigationWithBadges`, nunca hardcode en JSX.
- `GlobalCommandMenu` (⌘K) consume la misma navegación filtrada: no mantener listas paralelas.

**Agregar una ruta al menú:** ítem en `navigation.ts` con `module` alineado a permisos →
ruta en `src/app/router/routes.tsx` → badge (si aplica) vía `enrichNavigationWithBadges`.

## Header y notificaciones

`src/widgets/header/ui/Header.tsx`. Izquierda: menú móvil (`< lg`) + ⌘K (`md+`; lupa en
móvil). Derecha: campana, tema, menú de usuario (tenant, perfil, configuración, tema,
ayuda, logout).

Campana: badge con `GET /notifications/unread-count` solo si `> 0` (cap `9+`); panel `Popover`
(desktop) / `Sheet` (móvil) con las no leídas y «Ver todas» → `/notifications`. Feature
`@features/notifications`; SDD `design/sdd/notifications-inbox/sdd.md`.

## Checklist al modificar el chrome

- [ ] ¿Afecta sidebar **y** header? Offsets 240/56 sincronizados.
- [ ] ¿La ruta nueva está en `navigation.ts` **y** en permisos?
- [ ] ¿Sin títulos de página en el header global?
- [ ] ¿Toast vs Alert vs badge vs campana elegido según la SoT?
- [ ] ¿Sidebar colapsado conserva tooltips accesibles?
- [ ] ¿Probado en móvil (`MobileSidebar`) y en dark mode?

## Mapa de archivos

| Pieza | Ruta |
|-------|------|
| Providers del shell | `src/widgets/layout/ui/AppLayout.tsx` |
| Shell visual | `src/widgets/layout/ui/LayoutShell.tsx` |
| Sidebar | `src/widgets/sidebar/` |
| Header + command menu | `src/widgets/header/` |
| Estado sidebar | `src/app/providers/SidebarProvider.tsx` |
| Toasts | `src/app/providers/ToastProvider.tsx` · `@shared/hooks/useToast` |
