/**
 * Auth Feature - Public API
 * Feature-Sliced Design + Clean Architecture
 *
 * Feature de autenticación con:
 * - Login/Logout
 * - Verificación de sesión
 * - Refresh token automático
 * - Integración con sistema de permisos
 *
 * Ubicación: src/features/auth/index.ts
 *
 * ============================================================================
 * ESTRUCTURA:
 * ============================================================================
 *
 * src/features/auth/
 * ├── domain/                → Entidades, Value Objects, Tipos
 * │   ├── entities.ts        → User, Tenant
 * │   ├── valueObjects.ts    → Token, Credentials
 * │   ├── types.ts           → AuthState, AuthResponse, Interfaces
 * │   └── index.ts
 * │
 * ├── application/           → Casos de Uso
 * │   ├── useCases.ts        → Login, Logout, VerifyAuth, RefreshToken
 * │   └── index.ts
 * │
 * ├── infrastructure/        → Adaptadores e Implementaciones
 * │   ├── api/               → authApi.ts
 * │   ├── storage/           → tokenStorage.ts
 * │   ├── repositories/      → AuthRepository.ts
 * │   ├── interceptors/      → authInterceptor.ts
 * │   ├── hooks/             → useAuth, useRequireAuth, etc.
 * │   └── index.ts
 * │
 * ├── ui/                    → Componentes y Provider
 * │   ├── AuthProvider.tsx   → Context Provider
 * │   ├── schemas.ts         → Zod schemas para forms
 * │   └── index.ts
 * │
 * └── index.ts               → Public API
 *
 * ============================================================================
 * USO:
 * ============================================================================
 *
 * // En tu App
 * import { AuthProvider } from '@/features/auth';
 *
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * // En componentes
 * import { useAuth } from '@/features/auth';
 *
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 */

// ============================================================================
// DOMAIN - Entities & Types
// ============================================================================

export {
  // Entities
  User,
  Tenant,
  type UserData,
  type UserJSON,
  type TenantData,

  // Value Objects
  Token,
  Credentials,
  type LoginCredentials,

  // Types
  type AuthResponse,
  type RefreshResponse,
  type AuthState,
  type AuthErrorCode,
  type AuthError,
  AuthException,
  type IAuthRepository,
  type ITokenStorage,
} from "./domain";

// ============================================================================
// APPLICATION - Use Cases
// ============================================================================

export {
  LoginUseCase,
  LogoutUseCase,
  VerifyAuthUseCase,
  RefreshTokenUseCase,
  type LoginUseCaseResult,
} from "./application";

// ============================================================================
// INFRASTRUCTURE - Adapters & Implementations
// ============================================================================

export {
  // Storage
  tokenStorage,

  // API
  authApi,

  // Repository
  AuthRepository,

  // Interceptors
  setupAuthInterceptor,
  type AuthInterceptorConfig,

  // Hooks
  useAuth,
  useRequireAuth,
  useCurrentUser,
  useIsAuthenticated,
  useAuthLoading,
} from "./infrastructure";

// ============================================================================
// UI - Provider & Schemas
// ============================================================================

export {
  // Provider
  AuthProvider,
  AuthContext,
  type AuthContextType,

  // Schemas
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  registerSchema,
  type LoginFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
  type RegisterFormData,
} from "./ui";
