import { describe, expect, it } from "vitest";
import {
  AUTH_FUNNEL_MINIMAL_BRAND_MODES,
  minimalBrandLine,
  resolveAuthFunnelBrandMode,
} from "./authFunnelCopy";

describe("resolveAuthFunnelBrandMode", () => {
  it("maps register / forgot / reset / verify / invite / activate / login", () => {
    expect(resolveAuthFunnelBrandMode("/register")).toBe("register");
    expect(resolveAuthFunnelBrandMode("/register/open")).toBe("register");
    expect(resolveAuthFunnelBrandMode("/forgot-password")).toBe("forgot");
    expect(resolveAuthFunnelBrandMode("/reset-password")).toBe("reset");
    expect(resolveAuthFunnelBrandMode("/reset-password?token=x")).toBe("reset");
    expect(resolveAuthFunnelBrandMode("/verify-email")).toBe("verify");
    expect(resolveAuthFunnelBrandMode("/accept-invitation")).toBe("invite");
    expect(resolveAuthFunnelBrandMode("/activate-tenant")).toBe("activate");
    expect(resolveAuthFunnelBrandMode("/login")).toBe("login");
    expect(resolveAuthFunnelBrandMode("/")).toBe("login");
  });
});

describe("AUTH_FUNNEL_MINIMAL_BRAND_MODES", () => {
  it("covers Operate token routes (forgot, reset, verify, invite, activate)", () => {
    expect(AUTH_FUNNEL_MINIMAL_BRAND_MODES.has("forgot")).toBe(true);
    expect(AUTH_FUNNEL_MINIMAL_BRAND_MODES.has("reset")).toBe(true);
    expect(AUTH_FUNNEL_MINIMAL_BRAND_MODES.has("verify")).toBe(true);
    expect(AUTH_FUNNEL_MINIMAL_BRAND_MODES.has("invite")).toBe(true);
    expect(AUTH_FUNNEL_MINIMAL_BRAND_MODES.has("activate")).toBe(true);
    expect(AUTH_FUNNEL_MINIMAL_BRAND_MODES.has("login")).toBe(false);
  });
});

describe("minimalBrandLine", () => {
  it("returns a line for minimal modes only", () => {
    expect(minimalBrandLine("forgot")).toMatch(/acceso/i);
    expect(minimalBrandLine("reset")).toMatch(/contraseña/i);
    expect(minimalBrandLine("reset")).toMatch(/iniciar sesión/i);
    expect(minimalBrandLine("reset")).not.toMatch(/operar/i);
    expect(minimalBrandLine("verify")).toMatch(/correo/i);
    expect(minimalBrandLine("invite")).toMatch(/invitación/i);
    expect(minimalBrandLine("activate")).toMatch(/administrador|empresa/i);
    expect(minimalBrandLine("login")).toBeNull();
    expect(minimalBrandLine("register")).toBeNull();
  });
});

