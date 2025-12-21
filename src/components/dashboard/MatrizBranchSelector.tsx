import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Branch } from '@/types/database';

interface MatrizBranchSelectorProps {
  selectedBranchId: string | null;
  onSelectBranch: (branchId: string | null) => void;
  variant?: 'sidebar' | 'content';
}

export function MatrizBranchSelector({ selectedBranchId, onSelectBranch, variant = 'content' }: MatrizBranchSelectorProps) {
  const { tenant } = useAuthContext();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!tenant?.id) return;

      try {
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .order('is_main', { ascending: false })
          .order('name');

        if (error) throw error;
        setBranches((data as Branch[]) || []);
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [tenant?.id]);

  const selectedBranch = selectedBranchId ? branches.find(b => b.id === selectedBranchId) : null;

  if (isLoading || branches.length === 0) {
    return null;
  }

  const isSidebar = variant === 'sidebar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isSidebar ? "ghost" : "outline"} 
          size="sm" 
          className={isSidebar 
            ? "gap-2 h-7 px-3 max-w-[180px] bg-black/20 hover:bg-black/30 text-sidebar-foreground/90 rounded-full text-xs justify-between"
            : "gap-2 h-8 px-3 max-w-[200px] bg-muted/50 hover:bg-muted text-foreground rounded-lg text-xs justify-between border-border"
          }
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            {selectedBranch ? (
              <span className="flex items-center gap-1.5">
                {selectedBranch.name}
                {selectedBranch.is_main && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">Matriz</Badge>
                )}
              </span>
            ) : (
              <span>Todas as Filiais</span>
            )}
          </div>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] bg-popover">
        <DropdownMenuItem
          onClick={() => onSelectBranch(null)}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          <span>Todas as Filiais</span>
          {!selectedBranchId && <Badge variant="secondary" className="ml-auto text-[10px]">Ativo</Badge>}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {branches.map((branch) => (
          <DropdownMenuItem
            key={branch.id}
            onClick={() => onSelectBranch(branch.id)}
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            <span className="flex-1">{branch.name}</span>
            {branch.is_main && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">Matriz</Badge>
            )}
            {selectedBranchId === branch.id && (
              <Badge variant="secondary" className="text-[10px]">Ativo</Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
