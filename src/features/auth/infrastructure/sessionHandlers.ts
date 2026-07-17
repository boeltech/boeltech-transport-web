type UnauthorizedHandler = () => void;
type TokenRefreshedHandler = (newToken: string) => void;

let tenantUnauthorizedHandler: UnauthorizedHandler = () => {
  /* noop until AuthProvider mounts */
};

let tenantTokenRefreshedHandler: TokenRefreshedHandler = () => {
  /* noop until AuthProvider mounts */
};

export function setTenantUnauthorizedHandler(handler: UnauthorizedHandler): void {
  tenantUnauthorizedHandler = handler;
}

export function notifyTenantUnauthorized(): void {
  tenantUnauthorizedHandler();
}

export function setTenantTokenRefreshedHandler(handler: TokenRefreshedHandler): void {
  tenantTokenRefreshedHandler = handler;
}

export function notifyTenantTokenRefreshed(newToken: string): void {
  tenantTokenRefreshedHandler(newToken);
}
