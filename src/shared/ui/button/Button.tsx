import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

/**
 * Variantes del botón usando class-variance-authority (CVA)
 */
const buttonVariants = cva(
  // Clases base (siempre se aplican)
  [
    "cursor-pointer",
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white shadow-sm hover:bg-green-600/90",
        warning: "bg-yellow-500 text-white shadow-sm hover:bg-yellow-500/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Props del componente Button
 */
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Si es true, el botón se renderiza como un Slot (para composición con Link, etc.)
   * IMPORTANTE: Cuando asChild=true, NO uses leftIcon, rightIcon ni isLoading
   */
  asChild?: boolean;

  /**
   * Muestra un spinner de carga y deshabilita el botón
   * NO usar con asChild=true
   */
  isLoading?: boolean;

  /**
   * Icono a mostrar antes del texto
   * NO usar con asChild=true
   */
  leftIcon?: React.ReactNode;

  /**
   * Icono a mostrar después del texto
   * NO usar con asChild=true
   */
  rightIcon?: React.ReactNode;
}

/**
 * Componente Button
 *
 * @example
 * // Botón básico
 * <Button>Click me</Button>
 *
 * @example
 * // Con variantes
 * <Button variant="destructive" size="lg">Eliminar</Button>
 *
 * @example
 * // Con loading
 * <Button isLoading>Guardando...</Button>
 *
 * @example
 * // Con iconos
 * <Button leftIcon={<Plus />}>Agregar</Button>
 *
 * @example
 * // Como Link (composición) - NO usar leftIcon/rightIcon aquí
 * <Button asChild variant="link">
 *   <Link to="/vehicles">Ver vehículos</Link>
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    // Si asChild es true, usar Slot y NO agregar contenido extra
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as React.Ref<HTMLElement>}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    // Renderizado normal del botón
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Spinner de loading */}
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}

        {/* Icono izquierdo (no mostrar si está loading) */}
        {!isLoading && leftIcon}

        {/* Contenido */}
        {children}

        {/* Icono derecho */}
        {rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
