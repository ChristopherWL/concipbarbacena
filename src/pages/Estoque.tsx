import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useEstoque } from '@/hooks/useEstoque';
import { StockCategory, CATEGORY_LABELS } from '@/types/stock';
import { Loader2, HardHat, Shield, Wrench, Boxes, Monitor, ClipboardCheck } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';

// ============= CONSTANTS =============

const CATEGORY_ICONS: Record<StockCategory, React.ComponentType<{ className?: string }>> = {
  epi: HardHat,
  epc: Shield,
  ferramentas: Wrench,
  materiais: Boxes,
  equipamentos: Monitor,
};

const CATEGORY_ROUTES: Record<StockCategory, string> = {
  epi: '/estoque/epi',
  epc: '/estoque/epc',
  ferramentas: '/estoque/ferramentas',
  materiais: '/estoque/materiais',
  equipamentos: '/estoque/equipamentos',
};

const CATEGORIES: StockCategory[] = ['epi', 'epc', 'ferramentas', 'materiais', 'equipamentos'];

// ============= COMPONENT =============

export default function Estoque() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();
  const { getCategoryStats, auditStats, productsLoading } = useEstoque();

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <PageLoading text="Carregando estoque" />;
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Gestão de Estoque"
          description="Visão geral do estoque por categoria"
          icon={<Boxes className="h-5 w-5" />}
        />

        {/* Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-stagger">
          {CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const stats = getCategoryStats(category);
            
            return (
              <Card 
                key={category} 
                variant="interactive"
                onClick={() => navigate(CATEGORY_ROUTES[category])}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-foreground">
                        {CATEGORY_LABELS[category]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.total} produtos • {stats.totalStock} un
                      </p>
                      {stats.lowStock > 0 && (
                        <p className="text-xs text-destructive font-medium mt-0.5">
                          {stats.lowStock} em baixa
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Auditoria Card */}
          <Card 
            variant="interactive"
            onClick={() => navigate('/estoque/auditoria')}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                  <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-foreground">Auditoria</p>
                  <p className="text-xs text-muted-foreground">
                    {auditStats.total} registros
                  </p>
                  {auditStats.pending > 0 && (
                    <p className="text-xs text-amber-500 font-medium mt-0.5">
                      {auditStats.pending} pendentes
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading indicator */}
        {productsLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
