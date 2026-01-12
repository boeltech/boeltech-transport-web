import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { cn } from "@shared/lib/cn";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@shared/ui/dropdown-menu";
import { useAuth } from "@app/providers/AuthProvider";
import { useTheme } from "@app/providers/ThemeProvider";
import { useSidebar } from "@widgets/layout";

// ============================================
// Header Principal
// ============================================
export const Header = () => {
  const { openMobile, isMobile } = useSidebar();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      {/* Lado izquierdo */}
      <div className="flex items-center gap-4">
        {/* Botón hamburguesa (solo móvil) */}
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={openMobile}>
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Barra de búsqueda */}
        <SearchBar />
      </div>

      {/* Lado derecho */}
      <div className="flex items-center gap-2">
        {/* Selector de tema */}
        <ThemeDropdown />

        {/* Notificaciones */}
        <NotificationButton />

        {/* Menú de usuario */}
        <UserDropdown />
      </div>
    </header>
  );
};

// ============================================
// Barra de Búsqueda
// ============================================
const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <div className="relative">
      {/* Botón para móvil */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Input de búsqueda */}
      <div
        className={cn(
          "absolute left-0 top-full mt-2 w-64 lg:relative lg:top-0 lg:mt-0 lg:block",
          isOpen ? "block" : "hidden lg:block"
        )}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              "h-9 w-full rounded-md border bg-background pl-9 pr-4 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring"
            )}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// Dropdown de Tema
// ============================================
const ThemeDropdown = () => {
  const { mode, setMode, theme } = useTheme();

  const options = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ] as const;

  const currentIcon = theme === "dark" ? Moon : Sun;
  const CurrentIcon = currentIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <CurrentIcon className="h-5 w-5" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => setMode(value as typeof mode)}
        >
          {options.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============================================
// Botón de Notificaciones
// ============================================
const NotificationButton = () => {
  // TODO: Integrar con sistema de notificaciones real
  const notificationCount = 3;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
            Marcar como leídas
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Lista de notificaciones */}
        <div className="max-h-80 overflow-y-auto">
          <NotificationItem
            title="Nuevo viaje asignado"
            description="VH-001 → Monterrey - Salida en 2 horas"
            time="Hace 5 min"
            unread
          />
          <NotificationItem
            title="Mantenimiento pendiente"
            description="VH-003 requiere cambio de aceite"
            time="Hace 1 hora"
            unread
          />
          <NotificationItem
            title="Factura pagada"
            description="Cliente ABC realizó pago de $15,000"
            time="Hace 3 horas"
          />
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center">
          Ver todas las notificaciones
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============================================
// Item de Notificación
// ============================================
interface NotificationItemProps {
  title: string;
  description: string;
  time: string;
  unread?: boolean;
}

const NotificationItem = ({
  title,
  description,
  time,
  unread,
}: NotificationItemProps) => {
  return (
    <div
      className={cn(
        "flex gap-3 p-3 hover:bg-accent cursor-pointer",
        unread && "bg-accent/50"
      )}
    >
      {/* Indicador de no leído */}
      <div className="pt-1">
        {unread ? (
          <div className="h-2 w-2 rounded-full bg-primary" />
        ) : (
          <div className="h-2 w-2" />
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
};

// ============================================
// Dropdown de Usuario
// ============================================
const UserDropdown = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Obtener iniciales del nombre
  const initials =
    user?.nombre
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {initials}
          </div>

          {/* Nombre (oculto en móvil) */}
          <div className="hidden flex-col items-start md:flex">
            <span className="text-sm font-medium">{user?.nombre}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {user?.rol}
            </span>
          </div>

          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Info del usuario */}
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{user?.nombre}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Mi Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
