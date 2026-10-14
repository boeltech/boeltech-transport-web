import type { NotificationSource } from "../../domain";

export const notificationsCopy = {
  pageTitle: "Notificaciones",
  pageDescription: "Historial de alertas operativas y pendientes del sistema.",
  emptyTitle: "Sin notificaciones",
  emptyDescription: "Cuando haya pendientes o alertas, aparecerán aquí.",
  emptyFilteredTitle: "Sin resultados",
  emptyFilteredDescription:
    "Nada coincide con los filtros actuales. Prueba otros recortes o limpia los filtros.",
  markAllRead: "Marcar todas como leídas",
  viewAll: "Ver todas",
  open: "Abrir",
  unread: "No leídas",
  read: "Leídas",
  all: "Todas",
  source: "Fuente",
  severity: "Severidad",
  status: "Estado",
  clearFilters: "Limpiar filtros",
  retry: "Reintentar",
  markReadSuccess: "Notificación marcada como leída",
  markAllReadSuccess: "Notificaciones marcadas como leídas",
  loadError: "No se pudieron cargar las notificaciones",
  ariaOpenInbox: "Abrir notificaciones",
  panelTitle: "Notificaciones",
  panelEmpty: "No tienes notificaciones pendientes",
  filter: {
    showFilters: "Filtros",
  },
} as const;

export const NOTIFICATION_SOURCE_LABELS: Record<NotificationSource, string> = {
  approvals: "Aprobaciones",
  dashboard: "Operación",
  billing_dispatch: "Envío de facturas",
  invoice_downloads: "Descargas CFDI",
};

export const NOTIFICATION_SEVERITY_LABELS = {
  error: "Crítica",
  warning: "Advertencia",
  info: "Información",
} as const;
