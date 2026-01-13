// API Client
export { apiClient, ApiClient, axiosInstance } from "./apiClient";

// Interceptors (para configuración avanzada)
export { setupInterceptors, setupRetryInterceptor } from "./interceptors";

// Error handling
export { ApiError, isApiError } from "./errorHandler";

// Types
export type { ApiErrorResponse, PaginatedResponse, ApiResponse } from "./types";
