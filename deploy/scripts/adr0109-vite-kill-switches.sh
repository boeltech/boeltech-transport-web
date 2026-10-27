#!/usr/bin/env bash
# ADR-0109 — Valida espejos web (bake VITE_*) desde GitHub Environment vars.
# Uso: source deploy/scripts/adr0109-vite-kill-switches.sh
# Falla si alguna falta o no es true|false (tras trim + lowercase).
# Reescribe las vars en el shell actual para el `npm run build` siguiente.
set -euo pipefail

require_bool() {
  local name="$1"
  local raw="${2-}"
  local normalized
  normalized=$(printf '%s' "$raw" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
  if [ "$normalized" != "true" ] && [ "$normalized" != "false" ]; then
    echo "ADR-0109: vars.${name} debe ser 'true' o 'false' (recibido: '${raw:-<vacío>}')" >&2
    exit 1
  fi
  printf '%s' "$normalized"
}

VITE_HELP_TICKETS_ENABLED=$(require_bool VITE_HELP_TICKETS_ENABLED "${VITE_HELP_TICKETS_ENABLED-}")
VITE_HELP_SPOTLIGHT_ENABLED=$(require_bool VITE_HELP_SPOTLIGHT_ENABLED "${VITE_HELP_SPOTLIGHT_ENABLED-}")
VITE_PUBLIC_SELF_SERVE_REGISTER=$(require_bool VITE_PUBLIC_SELF_SERVE_REGISTER "${VITE_PUBLIC_SELF_SERVE_REGISTER-}")
export VITE_HELP_TICKETS_ENABLED VITE_HELP_SPOTLIGHT_ENABLED VITE_PUBLIC_SELF_SERVE_REGISTER

echo "ADR-0109 vite kill-switches: VITE_HELP_TICKETS_ENABLED=${VITE_HELP_TICKETS_ENABLED} VITE_HELP_SPOTLIGHT_ENABLED=${VITE_HELP_SPOTLIGHT_ENABLED} VITE_PUBLIC_SELF_SERVE_REGISTER=${VITE_PUBLIC_SELF_SERVE_REGISTER}"
