import { Building2, ChevronDown, Check, Globe } from 'lucide-react';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DirectorBranchDropdownProps {
  className?: string;
  variant?: 'header' | 'sidebar';
}

export function DirectorBranchDropdown({ className, variant = 'header' }: DirectorBranchDropdownProps) {
  const { availableBranches, selectedBranch, selectBranch, isLoading, isDirector } = useDirectorBranch();

  if (!isDirector || isLoading) return null;

  const isSidebar = variant === 'sidebar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'gap-2 transition-all',
            isSidebar 
              ? 'w-full justify-between h-auto py-2 px-3 bg-sidebar-accent/20 hover:bg-sidebar-accent/40 text-sidebar-foreground rounded-lg' 
              : 'h-9 px-3 bg-primary/10 hover:bg-primary/20 text-foreground',
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedBranch ? (
              <>
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm font-medium">{selectedBranch.name}</span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm font-medium">Todas as Filiais</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={isSidebar ? "center" : "end"} 
        className="w-64 bg-popover"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
          <Building2 className="h-3 w-3" />
          Selecionar Filial
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Option to view all branches */}
        <DropdownMenuItem
          onClick={() => selectBranch(null)}
          className={cn(
            'cursor-pointer gap-3',
            !selectedBranch && 'bg-primary/10'
          )}
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <span className="font-medium">Todas as Filiais</span>
            <p className="text-xs text-muted-foreground">Ver dados consolidados</p>
          </div>
          {!selectedBranch && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Branch list */}
        {availableBranches.map((branch) => {
          const isSelected = selectedBranch?.id === branch.id;
          return (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => selectBranch(branch)}
              className={cn(
                'cursor-pointer gap-3',
                isSelected && 'bg-primary/10'
              )}
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{branch.name}</span>
                  {branch.is_main && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      Matriz
                    </Badge>
                  )}
                </div>
                {branch.city && branch.state && (
                  <p className="text-xs text-muted-foreground truncate">
                    {branch.city}/{branch.state}
                  </p>
                )}
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}