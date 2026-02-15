import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/estoque': 'Estoque',
  '/estoque/materiais': 'Materiais',
  '/estoque/equipamentos': 'Equipamentos',
  '/estoque/ferramentas': 'Ferramentas',
  '/estoque/epi': 'EPI',
  '/estoque/epc': 'EPC',
  '/estoque/entrada': 'Entrada/Saída',
  '/notas-fiscais': 'Entrada de NF',
  '/emissao-nf': 'Emissão de NF',
  '/fechamento': 'Fechamento',
  '/frota': 'Frota',
  '/equipes': 'Equipes',
  '/os': 'Ordens de Serviço',
  '/clientes': 'Clientes',
  '/fornecedores': 'Fornecedores',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
  '/superadmin': 'Super Admin',
  '/cautelas': 'Cautelas',
  '/rh': 'Recursos Humanos',
  '/obras': 'Obras',
  '/diario-obras': 'Diário de Obras',
  '/auditoria-estoque': 'Auditoria',
};

const parentRoutes: Record<string, { path: string; label: string }> = {
  '/estoque/materiais': { path: '/estoque', label: 'Estoque' },
  '/estoque/equipamentos': { path: '/estoque', label: 'Estoque' },
  '/estoque/ferramentas': { path: '/estoque', label: 'Estoque' },
  '/estoque/epi': { path: '/estoque', label: 'Estoque' },
  '/estoque/epc': { path: '/estoque', label: 'Estoque' },
  '/auditoria-estoque': { path: '/estoque', label: 'Estoque' },
  '/notas-fiscais': { path: '/notas-fiscais', label: 'Notas Fiscais' },
  '/emissao-nf': { path: '/notas-fiscais', label: 'Notas Fiscais' },
  '/os': { path: '/os', label: 'Atendimento' },
  '/clientes': { path: '/os', label: 'Atendimento' },
  '/obras': { path: '/os', label: 'Atendimento' },
  '/diario-obras': { path: '/obras', label: 'Obras' },
};

export function Breadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;

  // Don't show breadcrumb on dashboard
  if (pathname === '/dashboard') {
    return null;
  }

  const currentLabel = routeLabels[pathname] || pathname.split('/').pop() || '';
  const parent = parentRoutes[pathname];

  return (
    <nav className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3 ml-6">
      <ChevronRight className="h-2.5 w-2.5" />
      
      {parent && (
        <>
          <span>{parent.label}</span>
          <ChevronRight className="h-3 w-3" />
        </>
      )}
      
      <span className="font-medium text-foreground">{currentLabel}</span>
    </nav>
  );
}
