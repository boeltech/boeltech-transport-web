// src/shared/api/axiosConfig.js

import axios from "axios";
import { errorHandlers } from "./errorHandlers";

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
 * Response Interceptor (OCP compliant)
 * Intercepta todas las respuestas antes de procesarlas
 */
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
    const status = error.response?.status;
    
    // ✅ Buscar handler en el registry (OCP)
    const handler = errorHandlers[status];
    
    if (handler) {
      // Ejecutar handler específico
      return handler(error, axiosInstance);
    }
    
    // Handler por defecto para códigos no registrados
    console.error(`❌ Error ${status}:`, error.message);
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
