// src/shared/ui/button.jsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

/**
 * Variantes del botón usando CVA (Class Variance Authority)
 * Define los estilos para cada variante, tamaño y estado
 */
const buttonVariants = cva(
  // Estilos base (aplicados a todos los botones)
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // Variantes de estilo
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Tamaños
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    // Valores por defecto
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Button Component
 * 
 * Componente de botón altamente personalizable con múltiples variantes.
 * Basado en shadcn/ui.
 * 
 * @example
 * // Botón básico
 * <Button>Click me</Button>
 * 
 * @example
 * // Botón con variante
 * <Button variant="destructive">Delete</Button>
 * 
 * @example
 * // Botón outline
 * <Button variant="outline">Cancel</Button>
 * 
 * @example
 * // Botón pequeño
 * <Button size="sm">Small button</Button>
 * 
 * @example
 * // Botón como link (usando asChild)
 * <Button asChild>
 *   <Link to="/dashboard">Go to Dashboard</Link>
 * </Button>
 * 
 * @example
 * // Botón deshabilitado
 * <Button disabled>Disabled</Button>
 * 
 * @example
 * // Botón con loading
 * <Button disabled={isLoading}>
 *   {isLoading ? 'Loading...' : 'Submit'}
 * </Button>
 */
const Button = React.forwardRef(({
  className,
  variant,
  size,
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }