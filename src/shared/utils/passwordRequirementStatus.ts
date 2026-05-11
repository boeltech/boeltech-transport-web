/**
 * Estado de requisitos de contraseña alineado con `changePasswordFormSchema`
 * (mín. 8, mayúscula, minúscula, dígito).
 */

export interface PasswordRequirementStatus {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasDigit: boolean;
}

export function getPasswordRequirementStatus(
  password: string,
): PasswordRequirementStatus {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /\d/.test(password),
  };
}

export function arePasswordRequirementsMet(
  status: PasswordRequirementStatus,
): boolean {
  return (
    status.minLength &&
    status.hasLowercase &&
    status.hasUppercase &&
    status.hasDigit
  );
}
