import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Fuerza el JWT de plataforma o tenant en el interceptor de auth. */
    authScope?: "tenant" | "platform";
  }
}
