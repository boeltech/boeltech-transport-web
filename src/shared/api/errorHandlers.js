/**
 * Error Handlers Registry
 * Permite agregar handlers sin modificar código existente (OCP)
 */

// Handler para 401 Unauthorized
export const handle401 = async (error, axiosInstance) => {
  const originalRequest = error.config;

  if (originalRequest._retry) {
    // Ya se intentó refrescar, hacer logout
    localStorage.removeItem("token");
    window.location.href = "/login";
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  try {
    const { data } = await axiosInstance.post("/auth/refresh");
    localStorage.setItem("token", data.token);
    originalRequest.headers.Authorization = `Bearer ${data.token}`;
    return axiosInstance(originalRequest);
  } catch (refreshError) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return Promise.reject(refreshError);
  }
};

// Handler para 403 Forbidden
export const handle403 = (error) => {
  console.warn("⚠️ Acceso denegado: Sin permisos");

  if (window.location.pathname !== "/unauthorized") {
    window.location.href = "/unauthorized";
  }

  return Promise.reject(error);
};

// Handler para 404 Not Found
export const handle404 = (error) => {
  console.warn("⚠️ Recurso no encontrado");
  return Promise.reject(error);
};

// Handler para 422 Validation Error
export const handle422 = (error) => {
  console.warn("⚠️ Error de validación:", error.response?.data);
  return Promise.reject(error);
};

// Handler para 429 Too Many Requests
export const handle429 = (error) => {
  console.warn("⚠️ Demasiadas peticiones. Espera un momento.");
  return Promise.reject(error);
};

// Handler para 500 Internal Server Error
export const handle500 = (error) => {
  console.error("❌ Error del servidor");
  return Promise.reject(error);
};

// Handler para 503 Service Unavailable
export const handle503 = (error) => {
  console.error("❌ Servicio no disponible. Intenta más tarde.");
  return Promise.reject(error);
};

// ✅ Registry extensible (OCP compliant)
export const errorHandlers = {
  401: handle401,
  403: handle403,
  404: handle404,
  422: handle422,
  429: handle429,
  500: handle500,
  503: handle503,
};

// ✅ Función para registrar nuevos handlers (extensión sin modificación)
export const registerErrorHandler = (statusCode, handler) => {
  errorHandlers[statusCode] = handler;
};
