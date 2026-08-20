import { describe, expect, it } from "vitest";

import {
  defaultEmployeePersonalAddressValues,
  isEmployeeDomicilioBlank,
} from "./employeePersonalAddressSchema";

describe("isEmployeeDomicilioBlank", () => {
  it("treats the default form as blank", () => {
    expect(isEmployeeDomicilioBlank(defaultEmployeePersonalAddressValues)).toBe(
      true,
    );
  });

  it("is not blank when the user captured a postal code", () => {
    expect(
      isEmployeeDomicilioBlank({
        ...defaultEmployeePersonalAddressValues,
        postalCode: "44100",
      }),
    ).toBe(false);
  });
});
