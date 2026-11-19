# Breadcrumbs

Migas de navegación local Operate (NL3). Usar en detalles, sub-secciones y altas — no en raíces de módulo del sidebar.

## API

```ts
import { Breadcrumbs, type Crumb } from "@shared/ui/breadcrumbs";

const crumbs: Crumb[] = [
  { label: "Viajes", to: "/trips" },
  { label: "TRP-261118-0001", mono: true },
];

<Breadcrumbs crumbs={crumbs} />
```

| Campo | Notas |
|-------|--------|
| `label` | Texto del eslabón |
| `to?` | Sin `to` = página actual (sin link, `aria-current="page"`) |
| `mono?` | Códigos/folios: `font-mono`, sin truncar |

## Reglas

- Markup: `<nav aria-label><ol>`; separador `ChevronRight` 12 px (`aria-hidden`)
- Tipografía: 12 px muted; actual `text-foreground font-medium`
- Máx. 3 eslabones; si llegan más, warning en DEV y se recorta el medio
- No-mono: `max-w-[40ch] truncate` + tooltip con el texto completo
- Sin íconos en las migas
- Resolver camino contextual con `resolveDetailCrumbs` (`@shared/utils/masterWayfinding`)

## Wayfinding

```ts
import { resolveDetailCrumbs } from "@shared/utils/masterWayfinding";
import { useIncomingFrom, useIncomingFromLabel } from "@shared/utils/listQueueFrom";

const crumbs = resolveDetailCrumbs({
  from: useIncomingFrom(),
  fromLabel: useIncomingFromLabel(),
  module: { listPath: "/vehicles", label: "Vehículos" },
  current: { label: vehicle.economicNumber, mono: true },
});
```
