// src/shared/api/axiosConfig.js

import axios from "axios";

/**
 * Configuración base de Axios
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 15000, // 15 segundos
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 * Intercepta todas las peticiones antes de enviarlas
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Agregar token de autenticación si existe
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log de petición en desarrollo
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Intercepta todas las respuestas antes de procesarlas
 */

// Utilizar strategy pattern para manejar diferentes códigos de error
const errorHandlers = {
  401: async (error, originalRequest) => {
    // Token inválido o expirado
    // Intentar refrescar el token
    if (!originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${axiosInstance.defaults.baseURL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Actualizar token
        localStorage.setItem("token", data.token);

        // Reintentar petición original con nuevo token
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh, limpiar sesión y redirigir a login
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirigir a login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }
  },
  403: (error) => {
    // Sin permisos
    console.warn("⚠️ Acceso denegado: Sin permisos suficientes");

    // Opcional: redirigir a página de "no autorizado"
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/unauthorized"
    ) {
      window.location.href = "/unauthorized";
    }
  },
  404: (error) => {
    // Recurso no encontrado
    console.warn("⚠️ Recurso no encontrado");
  },
  422: (error) => {
    // Error de validación
    console.warn("⚠️ Error de validación:", error.response.data);
  },
  429: (error) => {
    // Demasiadas peticiones
    console.warn("⚠️ Demasiadas peticiones. Por favor, intenta más tarde.");
  },
  500: (error) => {
    // Error interno del servidor
    console.error("❌ Error del servidor");
  },
  503: (error) => {
    // Servicio no disponible
    console.error("❌ Servicio no disponible. Intenta más tarde.");
  },
};

axiosInstance.interceptors.response.use(
  (response) => {
    // Log de respuesta exitosa en desarrollo
    if (import.meta.env.DEV) {
      console.log(
        `✅ ${response.config.method.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        }
      );
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Log de error
    if (import.meta.env.DEV) {
      console.error(
        `❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
        {
          status: status,
          message: error.response?.data?.message || error.message,
        }
      );
    }

    // Usar el handler correspondiente si existe
    if (status && errorHandlers[status]) {
      return errorHandlers[status](error, originalRequest);
    }

    // // Manejar diferentes códigos de error
    // if (error.response) {
    //   switch (error.response.status) {
    //     case 401: {
    //       // Token inválido o expirado
    //       // Intentar refrescar el token
    //       if (!originalRequest._retry) {
    //         originalRequest._retry = true;

    //         try {
    //           const { data } = await axios.post(
    //             `${axiosInstance.defaults.baseURL}/auth/refresh`,
    //             {},
    //             {
    //               headers: {
    //                 Authorization: `Bearer ${localStorage.getItem("token")}`,
    //               },
    //             }
    //           );

    //           // Actualizar token
    //           localStorage.setItem("token", data.token);

    //           // Reintentar petición original con nuevo token
    //           originalRequest.headers.Authorization = `Bearer ${data.token}`;
    //           return axiosInstance(originalRequest);
    //         } catch (refreshError) {
    //           // Si falla el refresh, limpiar sesión y redirigir a login
    //           localStorage.removeItem("token");
    //           localStorage.removeItem("user");

    //           // Redirigir a login
    //           if (typeof window !== "undefined") {
    //             window.location.href = "/login";
    //           }

    //           return Promise.reject(refreshError);
    //         }
    //       }
    //       break;
    //     }

    //     case 403: {
    //       // Sin permisos
    //       console.warn("⚠️ Acceso denegado: Sin permisos suficientes");

    //       // Opcional: redirigir a página de "no autorizado"
    //       if (
    //         typeof window !== "undefined" &&
    //         window.location.pathname !== "/unauthorized"
    //       ) {
    //         window.location.href = "/unauthorized";
    //       }
    //       break;
    //     }

    //     case 404: {
    //       // Recurso no encontrado
    //       console.warn("⚠️ Recurso no encontrado");
    //       break;
    //     }

    //     case 422: {
    //       // Error de validación
    //       console.warn("⚠️ Error de validación:", error.response.data);
    //       break;
    //     }

    //     case 429: {
    //       // Demasiadas peticiones
    //       console.warn(
    //         "⚠️ Demasiadas peticiones. Por favor, intenta más tarde."
    //       );
    //       break;
    //     }

    //     case 500: {
    //       // Error interno del servidor
    //       console.error("❌ Error del servidor");
    //       break;
    //     }

    //     case 503: {
    //       // Servicio no disponible
    //       console.error("❌ Servicio no disponible. Intenta más tarde.");
    //       break;
    //     }
    //   }
    // } else if (error.request) {
    //   // La petición se hizo pero no hubo respuesta
    //   console.error("❌ Sin respuesta del servidor:", error.message);
    // } else {
    //   // Error al configurar la petición
    //   console.error("❌ Error al configurar petición:", error.message);
    // }

    return Promise.reject(error);
  }
);

/**
 * Función helper para manejar errores de forma consistente
 * @param {Error} error - Error de Axios
 * @returns {string} Mensaje de error formateado
 */
export const getErrorMessage = (error) => {
  if (error.response) {
    // Error de respuesta del servidor
    return error.response.data?.message || "Error en el servidor";
  } else if (error.request) {
    // Sin respuesta del servidor
    return "Sin respuesta del servidor. Verifica tu conexión.";
  } else {
    // Error al configurar la petición
    return error.message || "Error desconocido";
  }
};

/**
 * Función helper para verificar si un error es de autenticación
 * @param {Error} error - Error de Axios
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  return error.response?.status === 401;
};

/**
 * Función helper para verificar si un error es de permisos
 * @param {Error} error - Error de Axios
 * @returns {boolean}
 */
export const isPermissionError = (error) => {
  return error.response?.status === 403;
};

/**
 * Función helper para verificar si un error es de validación
 * @param {Error} error - Error de Axios
 * @returns {boolean}
 */
export const isValidationError = (error) => {
  return error.response?.status === 422;
};

export default axiosInstance;
