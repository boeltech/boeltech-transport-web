/** Límite de usuarios del plan Esencial (alineado a API `ESSENTIAL_PLAN_LIMITS.maxUsers`). */
export const ESSENTIAL_USER_LIMIT = 3;

export const usersCopy = {
  limitReached: {
    title: "Límite de usuarios alcanzado",
    description:
      "Tu plan actual permite hasta 3 usuarios. Contacta a soporte para ampliar tu plan.",
    createDisabled: "Límite de plan alcanzado",
    inviteDisabled: "No puedes invitar más usuarios con tu plan actual.",
  },
  create: {
    toasts: {
      errorTitle: "Error al crear usuario",
      successTitle: "Usuario creado",
    },
  },
  invite: {
    toasts: {
      errorTitle: "No se pudo enviar la invitación",
    },
  },
} as const;
