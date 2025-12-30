# Arquitectura MVVM + Feature-Sliced Design

## Estructura del Proyecto

```
src/
├── app/          # Configuración global de la aplicación
├── features/     # Funcionalidades del negocio (MVVM)
├── entities/     # Entidades de dominio compartidas
└── shared/       # Código compartido entre features
```

## MVVM Pattern

Cada feature sigue el patrón MVVM:

- **Model**: Services (API) + Types (interfaces)
- **ViewModel**: Custom Hooks + React Query
- **View**: Functional Components

## Ejemplo: Feature de Vehículos

```
features/vehicles/
├── model/
│   ├── types.ts               # Interfaces TypeScript
│   ├── vehiclesService.js     # API calls
│   └── vehiclesSchema.js      # Validaciones Yup
├── viewModel/
│   ├── useVehicles.js         # Hook de listado
│   ├── useVehicle.js          # Hook de detalle
│   ├── useCreateVehicle.js    # Hook de creación
│   └── useUpdateVehicle.js    # Hook de actualización
└── view/
    ├── VehiclesList/          # Componente de listado
    ├── VehicleDetail/         # Componente de detalle
    └── VehicleForm/           # Componente de formulario
```

## Path Aliases

- `@/` → `src/`
- `@app/` → `src/app/`
- `@features/` → `src/features/`
- `@entities/` → `src/entities/`
- `@shared/` → `src/shared/`

## Buenas Prácticas

1. Cada feature es independiente
2. Las entities se comparten entre features
3. Shared contiene código común (UI, utils, hooks)
4. ViewModels manejan toda la lógica de negocio
5. Views son componentes "tontos" (solo UI)
