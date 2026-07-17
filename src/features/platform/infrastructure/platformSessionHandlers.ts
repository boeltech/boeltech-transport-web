type UnauthorizedHandler = () => void;

let platformUnauthorizedHandler: UnauthorizedHandler = () => {
  /* noop until PlatformAuthProvider mounts */
};

export function setPlatformUnauthorizedHandler(handler: UnauthorizedHandler): void {
  platformUnauthorizedHandler = handler;
}

export function notifyPlatformUnauthorized(): void {
  platformUnauthorizedHandler();
}
