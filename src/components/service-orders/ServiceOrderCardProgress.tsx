import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlayCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceOrderCardProgressProps {
  serviceOrderId: string;
  tenantId: string;
}

export const ServiceOrderCardProgress = ({ serviceOrderId, tenantId }: ServiceOrderCardProgressProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["service_order_etapas_summary", serviceOrderId],
    queryFn: async () => {
      const { data: etapas, error } = await supabase
        .from("service_order_etapas")
        .select("id, nome, status, percentual_peso")
        .eq("service_order_id", serviceOrderId)
        .eq("tenant_id", tenantId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      
      if (!etapas || etapas.length === 0) {
        return { activeEtapa: null, progress: 0, total: 0 };
      }

      const activeEtapa = etapas.find(e => e.status === 'em_andamento');
      const progress = Math.round(
        etapas
          .filter(e => e.status === 'concluida')
          .reduce((acc, e) => acc + Number(e.percentual_peso), 0)
      );

      return { 
        activeEtapa: activeEtapa?.nome || null, 
        progress, 
        total: etapas.length,
        completed: etapas.filter(e => e.status === 'concluida').length
      };
    },
    enabled: !!serviceOrderId && !!tenantId,
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2 border-t border-border/20">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (!data || data.total === 0) {
    return null;
  }

  return (
    <div className="space-y-2 pt-2 border-t border-border/20">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <Progress value={data.progress} className="h-2 flex-1" />
        <span className="text-xs font-medium text-muted-foreground min-w-[3rem] text-right">
          {data.progress}%
        </span>
      </div>
      
      {/* Active etapa */}
      <div className="flex items-center justify-between text-xs">
        {data.activeEtapa ? (
          <Badge variant="outline" className="text-xs gap-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200">
            <PlayCircle className="h-3 w-3" />
            {data.activeEtapa}
          </Badge>
        ) : (
          <span className="text-muted-foreground">Nenhuma etapa em andamento</span>
        )}
        <span className="text-muted-foreground">
          {data.completed}/{data.total} etapas
        </span>
      </div>
    </div>
  );
};
