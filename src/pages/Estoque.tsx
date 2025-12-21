import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useProducts } from '@/hooks/useProducts';
import { useStockAudits } from '@/hooks/useStockAudits';
import { StockCategory, CATEGORY_LABELS } from '@/types/stock';
import { Loader2, HardHat, Shield, Wrench, Boxes, Monitor, ClipboardCheck } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';

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

export default function Estoque() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuthContext();

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: audits = [] } = useStockAudits();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <PageLoading text="Carregando estoque" />;
  }

  if (!user) return null;

  const getCategoryStats = (cat: StockCategory) => {
    const catProducts = products.filter(p => p.category === cat);
    return {
      total: catProducts.length,
      totalStock: catProducts.reduce((acc, p) => acc + (p.current_stock || 0), 0),
      lowStock: catProducts.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)).length,
    };
  };

  const getAuditStats = () => {
    const pending = audits.filter(a => a.status === 'aberto' || a.status === 'em_analise').length;
    const total = audits.length;
    return { total, pending };
  };

  const categories: StockCategory[] = ['epi', 'epc', 'ferramentas', 'materiais', 'equipamentos'];
  const auditStats = getAuditStats();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Gestão de Estoque"
          description="Visão geral do estoque por categoria"
        />

        {/* Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const stats = getCategoryStats(cat);
            return (
              <Card 
                key={cat} 
                className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border hover:border-primary/50"
                onClick={() => navigate(CATEGORY_ROUTES[cat])}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-foreground">{CATEGORY_LABELS[cat]}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.total} produtos • {stats.totalStock} un
                      </p>
                      {stats.lowStock > 0 && (
                        <p className="text-xs text-destructive font-medium">
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
            className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border hover:border-primary/50"
            onClick={() => navigate('/estoque/auditoria')}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                  <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-foreground">Auditoria</p>
                  <p className="text-xs text-muted-foreground">
                    {auditStats.total} registros
                  </p>
                  {auditStats.pending > 0 && (
                    <p className="text-xs text-amber-500 font-medium">
                      {auditStats.pending} pendentes
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {productsLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
