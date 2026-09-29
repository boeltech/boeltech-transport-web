import { describe, expect, it } from "vitest";
import { BRAND } from "@shared/ui/brand";
import {
  onboardingCopy,
  resolveOnboardingHandshake,
  resolveOnboardingHouseLabel,
} from "./onboardingCopy";

const LEGACY_V3 = /Esencial|Crecimiento|Escala|Corporativo|operacion_esencial/;
const FOUNDER_JARGON =
  /Q_fact|Orientativ|self-serve|tenant|banda|cupo|Plan preferido|Preferencia al registrarte|Flota declarada|Sin declarar|Estado en el servidor/i;

function founderFacingBlob(): string {
  return [
    onboardingCopy.header.title,
    onboardingCopy.header.subtitle,
    onboardingCopy.header.submitFounder,
    onboardingCopy.header.stepsAria,
    onboardingCopy.steps.welcome.title,
    onboardingCopy.steps.welcome.description,
    onboardingCopy.steps.preferences.title,
    onboardingCopy.steps.preferences.description,
    onboardingCopy.steps.plan.title,
    onboardingCopy.steps.plan.descriptionA,
    onboardingCopy.steps.plan.descriptionB,
    onboardingCopy.welcome.founderBody("Ana"),
    onboardingCopy.preferences.themeLabel,
    onboardingCopy.preferences.themeHint,
    onboardingCopy.plan.assignedTitle,
    ...onboardingCopy.plan.assignedParagraphs,
    onboardingCopy.plan.assignedFooter,
    onboardingCopy.plan.trialTitle,
    onboardingCopy.plan.trialBody,
    onboardingCopy.plan.preferenceTitle,
    onboardingCopy.plan.preferenceBody("Operación Pequeña"),
    onboardingCopy.plan.fleetIndicated("1–10 unidades"),
    onboardingCopy.plan.ctaSubscription,
    onboardingCopy.plan.ctaHint,
    onboardingCopy.handshake.admin.title("Mar"),
    onboardingCopy.handshake.admin.body,
    onboardingCopy.toast.successTitle,
    onboardingCopy.toast.successDescription,
    onboardingCopy.toast.errorTitle,
  ].join(" ");
}

describe("onboardingCopy founder A/B", () => {
  it("uses the shared header, toast and founder submit copy", () => {
    expect(onboardingCopy.header.title).toBe("Primeros pasos");
    expect(onboardingCopy.header.subtitle).toBe(
      `Prepara tu cuenta en ${BRAND.productName}`,
    );
    expect(onboardingCopy.header.submitFounder).toBe(
      "Ir a Datos para facturar",
    );
    expect(onboardingCopy.header.stepsAria).toBe("Pasos de bienvenida");
    expect(onboardingCopy.toast.successTitle).toBe("Listo");
    expect(onboardingCopy.toast.successDescription).toBe(
      "Ya no verás estos pasos la próxima vez que entres.",
    );
    expect(onboardingCopy.toast.errorTitle).toBe("No se pudo guardar");
  });

  it("variant A assigned copy points to Tu plan without trial or catalog", () => {
    expect(onboardingCopy.steps.plan.title).toBe("Tu plan");
    expect(onboardingCopy.steps.plan.descriptionA).toBe("Dónde consultarlo");
    expect(onboardingCopy.plan.assignedTitle).toBe("El plan de tu empresa");
    expect(onboardingCopy.plan.assignedParagraphs).toHaveLength(3);
    expect(onboardingCopy.plan.assignedFooter).toBe(
      "Al continuar, vamos a Datos para facturar.",
    );

    const blob = [
      onboardingCopy.plan.assignedTitle,
      ...onboardingCopy.plan.assignedParagraphs,
      onboardingCopy.plan.assignedFooter,
      onboardingCopy.steps.plan.descriptionA,
    ].join(" ");
    expect(blob).toMatch(/Configuración → Tu plan/);
    expect(blob).not.toMatch(FOUNDER_JARGON);
    expect(blob).not.toMatch(/14 días/);
    expect(blob).not.toMatch(/periodo de prueba/i);
    expect(blob).not.toMatch(/\$389|1–5|30 timbres/i);
  });

  it("variant B trial copy keeps 14 days / 15 stamps without catalog list", () => {
    expect(onboardingCopy.steps.plan.descriptionB).toBe(
      "Tu prueba de 14 días",
    );
    expect(onboardingCopy.plan.trialTitle).toBe("Estás en periodo de prueba");
    expect(onboardingCopy.plan.trialBody).toMatch(/14 días/);
    expect(onboardingCopy.plan.trialBody).toMatch(/15 folios para facturar \(timbres\)/);
    expect(onboardingCopy.plan.preferenceTitle).toBe(
      "Lo que indicaste al registrarte",
    );
    expect(
      onboardingCopy.plan.preferenceBody("Operación Pequeña"),
    ).toMatch(/Elegiste Operación Pequeña como referencia/);
    expect(onboardingCopy.plan.preferenceBody("Operación Pequeña")).toMatch(
      /Operación Micro/,
    );
    expect(onboardingCopy.plan.ctaSubscription).toBe("Ver Tu plan");
    expect(onboardingCopy.plan.ctaHint).toMatch(/Datos para facturar/);
    expect(onboardingCopy.plan.fleetIndicated("1–10 unidades")).toBe(
      "Flota que indicaste: 1–10 unidades",
    );

    const blob = [
      onboardingCopy.plan.trialTitle,
      onboardingCopy.plan.trialBody,
      onboardingCopy.plan.preferenceTitle,
      onboardingCopy.plan.preferenceBody("Operación Pequeña"),
      onboardingCopy.plan.ctaHint,
    ].join(" ");
    expect(blob).not.toMatch(/Q_fact|Orientativ|self-serve|\$389|Sin declarar/i);
  });

  it("founder-facing copy has no commercial jargon", () => {
    expect(founderFacingBlob()).not.toMatch(FOUNDER_JARGON);
  });

  it("does not use v3 Esencial/Crecimiento/Escala/Corporativo labels", () => {
    expect(JSON.stringify(onboardingCopy)).not.toMatch(LEGACY_V3);
  });
});

describe("onboardingCopy family handshake", () => {
  it("F1 welcome names screen look, plan consult and billing house", () => {
    const body = onboardingCopy.welcome.founderBody("Ana");
    expect(body).toBe(
      "Hola, Ana. En un momento eliges cómo se ve la pantalla y te decimos dónde consultar el plan de la empresa. Al terminar te llevamos a Datos para facturar, para cargar la información con la que tu empresa factura a sus clientes. Estos pasos no vuelven a aparecer.",
    );
  });

  it("F2/F3 handshake is role-specific and stays off commercial copy", () => {
    const dispatcher = resolveOnboardingHandshake("dispatcher", "Luis");
    expect(dispatcher.title).toBe("Luis, tu día empieza en Viajes");
    expect(dispatcher.body).toBe(
      "Ahí reservas e inicias los viajes. No es la lista de facturas ni la de usuarios.",
    );
    expect(`${dispatcher.title} ${dispatcher.body}`).not.toMatch(
      /patio|sales el viaje|oficina|SAT|CFDI|Por facturar|Atención fiscal|flota/i,
    );
    expect(dispatcher.body).not.toMatch(/organizas los viajes, las unidades/i);
    expect(onboardingCopy.header.submitHouse("Viajes")).toBe("Ir a Viajes");

    const operator = resolveOnboardingHandshake("operator", "Eva");
    expect(operator.title).toBe("Eva, cargas los gastos en Viajes");
    expect(operator.body).toBe(
      "Ahí cargas casetas, combustible y extras. Tu trabajo no es reservar ni facturar.",
    );
    expect(`${operator.title} ${operator.body}`).not.toMatch(
      /\bjob\b|viven|SAT|CFDI|patio|Por facturar|Atención fiscal|Costos|tab/i,
    );

    const manager = resolveOnboardingHandshake("manager", "Gil");
    expect(manager.title).toBe("Gil, empiezas en Viajes");
    expect(manager.body).toBe(
      "Ahí organizas los viajes, las unidades y los conductores. No es la lista de facturas ni la de usuarios.",
    );
    expect(`${manager.title} ${manager.body}`).not.toMatch(
      /SAT|CFDI|bandeja|trámite|patio|Por facturar|Atención fiscal/i,
    );

    const accountant = resolveOnboardingHandshake("accountant", "Ana");
    expect(accountant.title).toBe("Ana, empiezas en Por facturar");
    expect(accountant.body).toBe(
      "Ahí facturas los viajes que ya están listos. No es donde se organizan los viajes ni la lista de usuarios.",
    );
    expect(`${accountant.title} ${accountant.body}`).not.toMatch(
      /CFDI|cola|patio|Atención fiscal|SAT|timbrar|sustituir/i,
    );

    const driver = resolveOnboardingHandshake("driver", "Paco");
    expect(driver.title).toBe("Paco, empiezas en Mis viajes");
    expect(driver.body).toBe(
      "Ahí inicias y completas los viajes que te asignaron. No reservas ni cargas gastos.",
    );
    expect(`${driver.title} ${driver.body}`).not.toMatch(
      /detalle|recorrido|Seguimiento|Programado|paradas|facturar|Por facturar|SAT|CFDI|patio|\bjob\b/i,
    );

    const client = resolveOnboardingHandshake("client", "Lia");
    expect(client.title).toBe("Lia, empiezas en Mis envíos");
    expect(client.body).toBe(
      "Ahí consultas el estado de tus envíos. No los creas ni los mueves.",
    );
    expect(`${client.title} ${client.body}`).not.toMatch(
      /oficina|capturó|operas|\bviajes?\b|patio|SAT|CFDI|Por facturar|\bjob\b|timbrar|Mis facturas/i,
    );

    const admin = resolveOnboardingHandshake("admin", "Mar");
    expect(admin.title).toBe("Mar, empiezas en Datos para facturar");
    expect(admin.body).toBe(
      "Ahí cargas la información con la que la empresa factura a sus clientes. No es la lista de viajes ni la de usuarios.",
    );
    expect(`${admin.title} ${admin.body}`).not.toMatch(
      /trial|timbres|Q_fact/i,
    );
  });

  it("F1 submit goes to Datos para facturar", () => {
    expect(onboardingCopy.header.submitFounder).toBe(
      "Ir a Datos para facturar",
    );
  });

  it.each([
    ["admin", "Datos para facturar"],
    ["manager", "Viajes"],
    ["dispatcher", "Viajes"],
    ["operator", "Viajes"],
    ["accountant", "Por facturar"],
    ["driver", "Mis viajes"],
    ["client", "Mis envíos"],
  ] as const)("house label for %s is %s", (role, house) => {
    expect(resolveOnboardingHouseLabel(role)).toBe(house);
  });

  it("founder family maps admin to Datos para facturar", () => {
    expect(resolveOnboardingHouseLabel("admin", "founder")).toBe(
      "Datos para facturar",
    );
  });

  it("admin staff family also names Datos para facturar", () => {
    expect(resolveOnboardingHouseLabel("admin", "staff")).toBe(
      "Datos para facturar",
    );
  });
});
