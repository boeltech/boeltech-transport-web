/**
 * Tailwind v4 Config — minimal
 *
 * Tailwind v4 vive principalmente en CSS via `@import "tailwindcss"` y
 * `@theme inline` (ver `src/app/styles/index.css`). Este archivo SOLO
 * declara `content` para escaneo de clases en TS/TSX, y `darkMode: "class"`
 * que sigue siendo requerido por el plugin `tailwindcss-animate`.
 *
 * NO declarar colores, radius, keyframes ni animation aquí. Todo eso ya
 * está en `index.css` como la única fuente de verdad de tokens.
 *
 * Design System — Fase 0 (Convergencia de tokens).
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
};
