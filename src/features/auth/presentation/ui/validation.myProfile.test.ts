import { describe, expect, it } from "vitest";
import {
  emailChangeRequestSchema,
  myProfileSchema,
} from "./validation";

describe("myProfileSchema (F2 — sin email)", () => {
  it("acepta solo nombre y apellido", () => {
    const parsed = myProfileSchema.safeParse({
      firstName: "Rosa",
      lastName: "Alcántara",
    });
    expect(parsed.success).toBe(true);
  });

  it("no exige email en el schema de perfil", () => {
    const shape = myProfileSchema.shape;
    expect("email" in shape).toBe(false);
    expect("firstName" in shape).toBe(true);
    expect("lastName" in shape).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const parsed = myProfileSchema.safeParse({
      firstName: "",
      lastName: "Alcántara",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("emailChangeRequestSchema", () => {
  it("exige correo nuevo y contraseña", () => {
    const parsed = emailChangeRequestSchema.safeParse({
      newEmail: "rosa@tbajio.mx",
      currentPassword: "Secreta1",
    });
    expect(parsed.success).toBe(true);
  });

  it("rechaza correo inválido", () => {
    const parsed = emailChangeRequestSchema.safeParse({
      newEmail: "no-es-correo",
      currentPassword: "Secreta1",
    });
    expect(parsed.success).toBe(false);
  });
});
