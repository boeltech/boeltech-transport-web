import config from "@shared/config/env";

/**
 * Kill-switch web de consola platform v1 (CEO TEC-Q3/Q4).
 * Default OFF — preserva chrome actual / pedido Conform hermano.
 */
export function isPlatformConsoleV1Enabled(): boolean {
  return config.platform.consoleV1Enabled;
}
