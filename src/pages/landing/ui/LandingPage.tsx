import { Link } from "react-router-dom";
import {
  Truck,
  Route,
  Users,
  BarChart3,
  FileText,
  Shield,
  ChevronRight,
  CheckCircle,
  Fuel,
  Wrench,
  DollarSign,
  Clock,
  UserPlus,
} from "lucide-react";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/cn";

/**
 * LandingPage
 *
 * Página de inicio pública del ERP de Transporte.
 * Presenta las características del sistema y dirige al login/registro.
 */
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Modules Section */}
      <ModulesSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

// ============================================
// Header
// ============================================
const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Boeltech ERP</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Características
          </a>
          <a
            href="#modules"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Módulos
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Iniciar Sesión</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/register">
              <UserPlus className="mr-2 h-4 w-4" />
              Registrar Empresa
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

// ============================================
// Hero Section
// ============================================
const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      {/* Decorative elements */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

      <div className="container mx-auto px-4 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center rounded-full border bg-background px-4 py-1.5 text-sm">
          <span className="mr-2 flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Sistema de Gestión Empresarial
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Gestiona tu flota de transporte con{" "}
          <span className="text-primary">eficiencia total</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          ERP completo para empresas de transporte. Controla vehículos,
          conductores, viajes, facturación y más desde una sola plataforma.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link to="/register">
              Comenzar Gratis
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">Ya tengo cuenta</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          <StatItem value="100+" label="Vehículos gestionados" />
          <StatItem value="50+" label="Conductores activos" />
          <StatItem value="1,000+" label="Viajes mensuales" />
          <StatItem value="99.9%" label="Disponibilidad" />
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <div className="text-3xl font-bold text-primary md:text-4xl">{value}</div>
    <div className="mt-1 text-sm text-muted-foreground">{label}</div>
  </div>
);

// ============================================
// Features Section
// ============================================
const features = [
  {
    icon: Clock,
    title: "Tiempo Real",
    description:
      "Monitorea el estado de tu flota y operaciones en tiempo real.",
  },
  {
    icon: Shield,
    title: "Seguro",
    description: "Control de acceso por roles y permisos granulares.",
  },
  {
    icon: BarChart3,
    title: "Reportes",
    description: "Informes detallados para toma de decisiones estratégicas.",
  },
  {
    icon: DollarSign,
    title: "Facturación",
    description: "Genera facturas y complementos de pago con timbrado CFDI.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="border-t bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Todo lo que necesitas para tu operación
          </h2>
          <p className="mt-4 text-muted-foreground">
            Herramientas diseñadas específicamente para empresas de transporte.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group rounded-xl border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// Modules Section
// ============================================
const modules = [
  {
    icon: Truck,
    title: "Flota",
    description: "Gestión completa de vehículos, mantenimientos y documentos.",
    features: [
      "Inventario de vehículos",
      "Mantenimiento preventivo",
      "Control de documentos",
    ],
  },
  {
    icon: Route,
    title: "Viajes",
    description: "Programación y seguimiento de viajes y rutas.",
    features: [
      "Programación de viajes",
      "Seguimiento GPS",
      "Evidencias digitales",
    ],
  },
  {
    icon: Users,
    title: "Personal",
    description: "Administración de conductores y personal operativo.",
    features: [
      "Expedientes digitales",
      "Licencias y certificaciones",
      "Disponibilidad",
    ],
  },
  {
    icon: FileText,
    title: "Facturación",
    description: "Facturación electrónica y control de pagos.",
    features: ["CFDI 4.0", "Complementos de pago", "Reportes fiscales"],
  },
  {
    icon: Fuel,
    title: "Combustible",
    description: "Control de cargas de combustible y rendimientos.",
    features: [
      "Registro de cargas",
      "Rendimiento por unidad",
      "Análisis de costos",
    ],
  },
  {
    icon: Wrench,
    title: "Mantenimiento",
    description: "Programa de mantenimiento preventivo y correctivo.",
    features: [
      "Órdenes de servicio",
      "Historial de reparaciones",
      "Alertas automáticas",
    ],
  },
];

const ModulesSection = () => {
  return (
    <section id="modules" className="py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Módulos integrados
          </h2>
          <p className="mt-4 text-muted-foreground">
            Un ecosistema completo para gestionar toda tu operación de
            transporte.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <div
              key={index}
              className="group rounded-xl border bg-background p-6 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <module.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{module.title}</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {module.description}
              </p>
              <ul className="space-y-2">
                {module.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// CTA Section
// ============================================
const CTASection = () => {
  return (
    <section className="border-t bg-primary py-20 text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          ¿Listo para optimizar tu operación?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
          Únete a las empresas de transporte que ya confían en Boeltech ERP para
          gestionar su flota de manera eficiente.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" variant="secondary" asChild>
            <Link to="/register">
              Registrar mi Empresa
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            asChild
          >
            <a href="mailto:ventas@boeltech.com">Contactar Ventas</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

// ============================================
// Footer
// ============================================
const Footer = () => {
  return (
    <footer className="border-t py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Boeltech ERP</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Términos de Servicio
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Política de Privacidad
            </a>
            <a
              href="mailto:soporte@boeltech.com"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Soporte
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Boeltech. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingPage;
