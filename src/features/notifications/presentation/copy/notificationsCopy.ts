export const notificationsCopy = {
  pageTitle: "Notificaciones",
  pageDescription: "Historial de alertas operativas y pendientes del sistema.",
  emptyTitle: "Sin notificaciones",
  emptyDescription: "Cuando haya pendientes o alertas, aparecerán aquí.",
  markAllRead: "Marcar todas como leídas",
  viewAll: "Ver todas",
  unread: "No leídas",
  read: "Leídas",
  all: "Todas",
  source: "Fuente",
  severity: "Severidad",
  status: "Estado",
  markReadSuccess: "Notificación marcada como leída",
  markAllReadSuccess: "Notificaciones marcadas como leídas",
  loadError: "No se pudieron cargar las notificaciones",
  ariaOpenInbox: "Abrir notificaciones",
  panelTitle: "Notificaciones",
  panelEmpty: "No tienes notificaciones pendientes",
} as const;

export const NOTIFICATION_SOURCE_LABELS = {
  approvals: "Aprobaciones",
  dashboard: "Operación",
} as const;

export const NOTIFICATION_SEVERITY_LABELS = {
  error: "Crítica",
  warning: "Advertencia",
  info: "Información",
} as const;
