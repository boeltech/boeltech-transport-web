#!/bin/bash

# Script de Migración a MVVM + Feature-Sliced Design
# Para proyectos existentes o nuevos del ERP Transporte

set -e

echo "=================================================="
echo "   MIGRACIÓN A MVVM + FEATURE-SLICED DESIGN"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_step() {
    echo -e "${BLUE}[PASO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "Esta herramienta creará la estructura MVVM + FSD para tu proyecto."
echo ""
read -p "¿Continuar? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Operación cancelada"
    exit 0
fi

# Crear nueva estructura
log_step "Creando estructura MVVM + Feature-Sliced Design..."

# App layer (configuración global)
mkdir -p src/app/providers
mkdir -p src/app/router
mkdir -p src/app/styles

# Features layer (funcionalidades del negocio)
mkdir -p src/features/auth/{model,viewModel,view/Login}
mkdir -p src/features/auth/view/{Register,ForgotPassword}

mkdir -p src/features/vehicles/{model,viewModel}
mkdir -p src/features/vehicles/view/{VehiclesList,VehicleDetail,VehicleForm,VehicleDocuments}

mkdir -p src/features/trips/{model,viewModel}
mkdir -p src/features/trips/view/{TripsList,TripDetail,TripForm,TripTracking}

mkdir -p src/features/drivers/{model,viewModel}
mkdir -p src/features/drivers/view/{DriversList,DriverDetail,DriverForm,DriverDocuments}

mkdir -p src/features/maintenance/{model,viewModel}
mkdir -p src/features/maintenance/view/{MaintenanceList,MaintenanceDetail,MaintenanceForm}

mkdir -p src/features/parts/{model,viewModel}
mkdir -p src/features/parts/view/{PartsList,PartForm}

mkdir -p src/features/fuel/{model,viewModel}
mkdir -p src/features/fuel/view/{FuelList,FuelForm,FuelReports}

mkdir -p src/features/customers/{model,viewModel}
mkdir -p src/features/customers/view/{CustomersList,CustomerDetail,CustomerForm}

mkdir -p src/features/invoices/{model,viewModel}
mkdir -p src/features/invoices/view/{InvoicesList,InvoiceDetail,InvoiceForm}

mkdir -p src/features/expenses/{model,viewModel}
mkdir -p src/features/expenses/view/{ExpensesList,ExpenseForm}

mkdir -p src/features/reports/{model,viewModel}
mkdir -p src/features/reports/view/{DashboardReport,FleetReport,FinancialReport}

mkdir -p src/features/users/{model,viewModel}
mkdir -p src/features/users/view/{UsersList,UserForm,UserPermissions}

mkdir -p src/features/dashboard/{model,viewModel,view}

# Entities layer (entidades de dominio)
mkdir -p src/entities/vehicle/{model,ui}
mkdir -p src/entities/trip/{model,ui}
mkdir -p src/entities/driver/{model,ui}
mkdir -p src/entities/user/{model,ui}
mkdir -p src/entities/customer/{model,ui}
mkdir -p src/entities/invoice/{model,ui}

# Shared layer (código compartido)
mkdir -p src/shared/api
mkdir -p src/shared/ui
mkdir -p src/shared/lib
mkdir -p src/shared/hooks
mkdir -p src/shared/constants

log_success "Estructura de carpetas creada"

# Configurar path aliases
log_step "Configurando path aliases..."

cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
EOF

cat > jsconfig.json << 'EOF'
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      "@features/*": ["./src/features/*"],
      "@entities/*": ["./src/entities/*"],
      "@shared/*": ["./src/shared/*"]
    }
  },
  "include": ["src"]
}
EOF

log_success "Path aliases configurados"

# Crear archivos de ejemplo
log_step "Creando archivos de ejemplo..."

# Shared API Config
cat > src/shared/api/axiosConfig.js << 'EOF'
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
EOF

# Shared Query Client
cat > src/shared/api/queryClient.js << 'EOF'
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
EOF

# Shared utils
cat > src/shared/lib/utils.js << 'EOF'
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
EOF

# Entity: Vehicle Types
cat > src/entities/vehicle/model/types.ts << 'EOF'
export interface Vehicle {
  id: string;
  economicNumber: string;
  brand: string;
  model: string;
  year: number;
  plates: string;
  status: 'active' | 'maintenance' | 'inactive';
  vin: string;
  currentKm: number;
}

export interface VehicleFilters {
  status?: string;
  brand?: string;
  search?: string;
}
EOF

# Entity: Vehicle Constants
cat > src/entities/vehicle/model/constants.js << 'EOF'
export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
};

export const VEHICLE_STATUS_LABELS = {
  [VEHICLE_STATUS.ACTIVE]: 'Activo',
  [VEHICLE_STATUS.MAINTENANCE]: 'En Mantenimiento',
  [VEHICLE_STATUS.INACTIVE]: 'Inactivo',
};
EOF

# Feature: Vehicles Service
cat > src/features/vehicles/model/vehiclesService.js << 'EOF'
import axiosInstance from '@/shared/api/axiosConfig';

export const vehiclesService = {
  getAll: async (filters) => {
    const { data } = await axiosInstance.get('/vehicles', { params: filters });
    return data;
  },

  getById: async (id) => {
    const { data } = await axiosInstance.get(`/vehicles/${id}`);
    return data;
  },

  create: async (vehicle) => {
    const { data } = await axiosInstance.post('/vehicles', vehicle);
    return data;
  },

  update: async (id, vehicle) => {
    const { data } = await axiosInstance.put(`/vehicles/${id}`, vehicle);
    return data;
  },

  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/vehicles/${id}`);
    return data;
  },
};
EOF

# Feature: Vehicles ViewModel
cat > src/features/vehicles/viewModel/useVehicles.js << 'EOF'
import { useQuery } from '@tanstack/react-query';
import { vehiclesService } from '../model/vehiclesService';

export const useVehicles = (filters = {}) => {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => vehiclesService.getAll(filters),
  });
};
EOF

cat > src/features/vehicles/viewModel/useCreateVehicle.js << 'EOF'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesService } from '../model/vehiclesService';
import { toast } from 'react-toastify';

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vehiclesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehículo creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear vehículo');
    },
  });
};
EOF

# App: Providers
cat > src/app/providers/QueryProvider.jsx << 'EOF'
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/shared/api/queryClient';

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
EOF

log_success "Archivos de ejemplo creados"

# Crear README de arquitectura
cat > ARQUITECTURA.md << 'EOF'
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
EOF

log_success "README de arquitectura creado"

echo ""
echo -e "${GREEN}=================================================="
echo "   MIGRACIÓN COMPLETADA"
echo "==================================================${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Revisar la estructura en src/"
echo "2. Leer ARQUITECTURA.md"
echo "3. Comenzar a migrar features existentes"
echo "4. Ver ejemplos en features/vehicles/"
echo ""
echo "Documentación completa: INTEGRACION_MVVM_FSD.md"
echo ""
