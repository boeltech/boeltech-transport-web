/**
 * User Helpers
 *
 * Funciones utilitarias para trabajar con datos de usuario.
 *
 * Ubicación: src/shared/lib/userHelpers.ts
 */

// ============================================
// Types
// ============================================

/**
 * Interfaz mínima de usuario para los helpers
 * Compatible con User entity y objetos planos
 */
export interface UserLike {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

// ============================================
// Name Helpers
// ============================================

/**
 * Obtiene el nombre completo del usuario
 *
 * @example
 * getUserFullName({ firstName: 'Juan', lastName: 'Pérez' }) // 'Juan Pérez'
 * getUserFullName({ firstName: 'Juan' }) // 'Juan'
 * getUserFullName(null) // 'Usuario'
 */
export function getUserFullName(user: UserLike | null | undefined): string {
  if (!user) return "Usuario";

  const { firstName, lastName } = user;

  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }

  if (firstName) return firstName.trim();
  if (lastName) return lastName.trim();

  return "Usuario";
}

/**
 * Obtiene las iniciales del usuario (máximo 2 caracteres)
 *
 * @example
 * getUserInitials({ firstName: 'Juan', lastName: 'Pérez' }) // 'JP'
 * getUserInitials({ firstName: 'Juan' }) // 'J'
 * getUserInitials(null) // 'U'
 */
export function getUserInitials(user: UserLike | null | undefined): string {
  if (!user) return "U";

  const { firstName, lastName } = user;
  const firstInitial = firstName?.[0]?.toUpperCase() || "";
  const lastInitial = lastName?.[0]?.toUpperCase() || "";

  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`;
  }

  if (firstInitial) return firstInitial;
  if (lastInitial) return lastInitial;

  return "U";
}

/**
 * Obtiene el primer nombre del usuario
 *
 * @example
 * getUserFirstName({ firstName: 'Juan Carlos', lastName: 'Pérez' }) // 'Juan Carlos'
 * getUserFirstName(null) // 'Usuario'
 */
export function getUserFirstName(user: UserLike | null | undefined): string {
  if (!user?.firstName) return "Usuario";
  return user.firstName.trim();
}

/**
 * Obtiene un saludo personalizado según la hora del día
 *
 * @example
 * getGreeting({ firstName: 'Juan' }) // 'Buenos días, Juan' (si es mañana)
 */
export function getGreeting(user: UserLike | null | undefined): string {
  const hour = new Date().getHours();
  const name = getUserFirstName(user);

  if (hour >= 5 && hour < 12) {
    return `Buenos días, ${name}`;
  }

  if (hour >= 12 && hour < 19) {
    return `Buenas tardes, ${name}`;
  }

  return `Buenas noches, ${name}`;
}

// ============================================
// Display Helpers
// ============================================

/**
 * Obtiene el email del usuario o un placeholder
 *
 * @example
 * getUserEmail({ email: 'juan@example.com' }) // 'juan@example.com'
 * getUserEmail(null) // 'Sin correo'
 */
export function getUserEmail(user: UserLike | null | undefined): string {
  return user?.email || "Sin correo";
}

/**
 * Genera un color de avatar basado en el nombre del usuario
 * Útil para avatares sin imagen
 *
 * @example
 * getUserAvatarColor({ firstName: 'Juan' }) // '#4F46E5' (siempre el mismo para 'Juan')
 */
export function getUserAvatarColor(user: UserLike | null | undefined): string {
  const colors = [
    "#4F46E5", // Indigo
    "#7C3AED", // Violet
    "#EC4899", // Pink
    "#EF4444", // Red
    "#F97316", // Orange
    "#EAB308", // Yellow
    "#22C55E", // Green
    "#14B8A6", // Teal
    "#06B6D4", // Cyan
    "#3B82F6", // Blue
  ];

  const name = getUserFullName(user);
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
