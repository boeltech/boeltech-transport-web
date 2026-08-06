import { describe, expect, it } from "vitest";
import { isTrialDateReached, resolveBillingNotice } from "./billingNotice";

const NOW = new Date("2026-08-01T12:00:00.000Z").getTime();

const base = {
  isSubscriptionResolved: true,
  status: "active",
  trialEndsAt: null,
  includedStamps: 120,
  stampsUsed: 10,
  usagePercent: 8,
  branchesOverQuota: false,
  hasOpenArrears: false,
  now: NOW,
};

describe("resolveBillingNotice", () => {
  it("no decide nada mientras la suscripción no resuelve", () => {
    expect(
      resolveBillingNotice({ ...base, isSubscriptionResolved: false }),
    ).toBeNull();
  });

  it("no inventa no_plan cuando la query falló (p. ej. 403)", () => {
    expect(
      resolveBillingNotice({
        ...base,
        isSubscriptionResolved: false,
        status: null,
      }),
    ).toBeNull();
  });

  it("sin plan gana sobre cualquier otra condición", () => {
    expect(
      resolveBillingNotice({
        ...base,
        status: null,
        usagePercent: 100,
        branchesOverQuota: true,
        hasOpenArrears: true,
      }),
    ).toBe("no_plan");
  });

  it.each(["paused", "canceled"])("plan %s se reporta como bloqueado", (status) => {
    expect(
      resolveBillingNotice({
        ...base,
        status,
        usagePercent: 100,
        hasOpenArrears: true,
      }),
    ).toBe("blocked");
  });

  it("arrears no emite notice: la card es la superficie (D3)", () => {
    expect(
      resolveBillingNotice({
        ...base,
        status: "active",
        hasOpenArrears: true,
        usagePercent: 100,
      }),
    ).toBe("stamps_exhausted");
  });

  it("con saldo open no emite past_due (la card cubre el cobro)", () => {
    expect(
      resolveBillingNotice({
        ...base,
        status: "past_due",
        hasOpenArrears: true,
        usagePercent: 8,
        branchesOverQuota: false,
      }),
    ).toBeNull();
  });

  it("past_due gana sin open arrears sobre umbrales de timbres y sobrecupo", () => {
    expect(
      resolveBillingNotice({
        ...base,
        status: "past_due",
        hasOpenArrears: false,
        usagePercent: 100,
        branchesOverQuota: true,
      }),
    ).toBe("past_due");
  });

  it("prueba agotada gana sobre prueba vencida", () => {
    expect(
      resolveBillingNotice({
        ...base,
        status: "trialing",
        stampsUsed: 15,
        includedStamps: 15,
        usagePercent: 100,
        trialEndsAt: "2026-07-01T00:00:00.000Z",
      }),
    ).toBe("trial_exhausted");
  });

  it("prueba vencida solo cuando aún queda cupo", () => {
    expect(
      resolveBillingNotice({
        ...base,
        status: "trialing",
        stampsUsed: 3,
        includedStamps: 15,
        usagePercent: 20,
        trialEndsAt: "2026-07-01T00:00:00.000Z",
      }),
    ).toBe("trial_ended");
  });

  it("no marca la prueba como vencida si la fecha es futura", () => {
    expect(
      resolveBillingNotice({
        ...base,
        status: "trialing",
        stampsUsed: 3,
        includedStamps: 15,
        usagePercent: 20,
        trialEndsAt: "2026-08-15T00:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("timbres agotados gana sobre timbres bajos y sobrecupo", () => {
    expect(
      resolveBillingNotice({
        ...base,
        usagePercent: 100,
        branchesOverQuota: true,
      }),
    ).toBe("stamps_exhausted");
  });

  it("avisa desde el umbral de 80%", () => {
    expect(resolveBillingNotice({ ...base, usagePercent: 80 })).toBe(
      "stamps_low",
    );
    expect(resolveBillingNotice({ ...base, usagePercent: 79 })).toBeNull();
  });

  it("el sobrecupo de sucursales es el último de la fila", () => {
    expect(
      resolveBillingNotice({ ...base, branchesOverQuota: true }),
    ).toBe("branches_over_quota");
  });

  it("sin condiciones no muestra aviso", () => {
    expect(resolveBillingNotice(base)).toBeNull();
  });
});

describe("isTrialDateReached", () => {
  it("es falso sin fecha o con fecha inválida", () => {
    expect(isTrialDateReached(null, NOW)).toBe(false);
    expect(isTrialDateReached("no-es-fecha", NOW)).toBe(false);
  });

  it("compara contra la referencia recibida", () => {
    expect(isTrialDateReached("2026-07-31T00:00:00.000Z", NOW)).toBe(true);
    expect(isTrialDateReached("2026-08-02T00:00:00.000Z", NOW)).toBe(false);
  });
});
