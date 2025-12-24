import { lazy } from "react";

// Lazy load all pages for code splitting
const SetupInicial = lazy(() => import("@/pages/SetupInicial"));
const GenericLandingPage = lazy(() => import("@/pages/GenericLandingPage"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const FieldUserDashboard = lazy(() => import("@/pages/FieldUserDashboard"));
const Estoque = lazy(() => import("@/pages/Estoque"));
const EstoqueEPI = lazy(() => import("@/pages/EstoqueEPI"));
const EstoqueEPC = lazy(() => import("@/pages/EstoqueEPC"));
const EstoqueFerramentas = lazy(() => import("@/pages/EstoqueFerramentas"));
const EstoqueMateriais = lazy(() => import("@/pages/EstoqueMateriais"));
const EstoqueEquipamentos = lazy(() => import("@/pages/EstoqueEquipamentos"));
const AuditoriaEstoque = lazy(() => import("@/pages/AuditoriaEstoque"));
const Movimentacao = lazy(() => import("@/pages/Movimentacao"));
const NotasFiscais = lazy(() => import("@/pages/NotasFiscais"));
const EmissaoNotasFiscais = lazy(() => import("@/pages/EmissaoNotasFiscais"));
const Fechamento = lazy(() => import("@/pages/Fechamento"));
const Frota = lazy(() => import("@/pages/Frota"));
const Equipes = lazy(() => import("@/pages/Equipes"));
const OrdensServico = lazy(() => import("@/pages/OrdensServico"));
const Clientes = lazy(() => import("@/pages/Clientes"));
const Obras = lazy(() => import("@/pages/Obras"));
const RelatorioAtualizacaoObra = lazy(() => import("@/pages/RelatorioAtualizacaoObra"));
const DiarioObras = lazy(() => import("@/pages/DiarioObras"));
const Cautelas = lazy(() => import("@/pages/Cautelas"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const Fornecedores = lazy(() => import("@/pages/Fornecedores"));
const RecursosHumanos = lazy(() => import("@/pages/RecursosHumanos"));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<() => JSX.Element>;
  isPublic?: boolean;
  isProtectedPrefix?: boolean;
}

// Protected route prefixes - any route starting with these requires auth
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/app",
  "/estoque",
  "/frota",
  "/equipes",
  "/os",
  "/clientes",
  "/obras",
  "/diario",
  "/cautelas",
  "/relatorios",
  "/configuracoes",
  "/fornecedores",
  "/rh",
  "/superadmin",
  "/admin",
  "/notas",
  "/emissao",
  "/fechamento",
];

// Route configurations
export const routes: RouteConfig[] = [
  // Public routes
  { path: "/setup", element: SetupInicial, isPublic: true },
  { path: "/", element: GenericLandingPage, isPublic: true },
  { path: "/auth", element: Auth, isPublic: true },
  
  // Protected routes
  { path: "/dashboard", element: Dashboard },
  { path: "/app", element: FieldUserDashboard },
  { path: "/estoque", element: Estoque },
  { path: "/estoque/epi", element: EstoqueEPI },
  { path: "/estoque/epc", element: EstoqueEPC },
  { path: "/estoque/ferramentas", element: EstoqueFerramentas },
  { path: "/estoque/materiais", element: EstoqueMateriais },
  { path: "/estoque/equipamentos", element: EstoqueEquipamentos },
  { path: "/estoque/auditoria", element: AuditoriaEstoque },
  { path: "/estoque/entrada", element: Movimentacao },
  { path: "/notas-fiscais", element: NotasFiscais },
  { path: "/emissao-nf", element: EmissaoNotasFiscais },
  { path: "/fechamento", element: Fechamento },
  { path: "/frota", element: Frota },
  { path: "/equipes", element: Equipes },
  { path: "/os", element: OrdensServico },
  { path: "/clientes", element: Clientes },
  { path: "/obras", element: Obras },
  { path: "/obras/relatorio/:diarioId", element: RelatorioAtualizacaoObra },
  { path: "/diario-obras", element: DiarioObras },
  { path: "/cautelas", element: Cautelas },
  { path: "/relatorios", element: Relatorios },
  { path: "/configuracoes", element: Configuracoes },
  { path: "/fornecedores", element: Fornecedores },
  { path: "/rh", element: RecursosHumanos },
  { path: "/superadmin", element: SuperAdmin },
  { path: "/admin", element: Admin },
  
  // Dynamic route for tenant landing pages
  { path: "/:slug", element: LandingPage, isPublic: true },
  
  // Catch-all route - must be last
  { path: "*", element: NotFound, isPublic: true },
];

// Helper to check if a route is public
export const isPublicRoute = (pathname: string): boolean => {
  // Check exact public routes
  const publicPaths = routes.filter(r => r.isPublic).map(r => r.path);
  if (publicPaths.includes(pathname)) return true;
  
  // Check if it matches any protected prefix
  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (isProtected) return false;
  
  // Routes not matching any protected prefix are considered public (like /:slug)
  return true;
};
