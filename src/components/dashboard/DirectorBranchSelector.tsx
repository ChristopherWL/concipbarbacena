import { Building2, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function DirectorBranchSelector() {
  const { availableBranches, selectedBranch, selectBranch, isLoading } = useDirectorBranch();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Selecione uma Filial</h2>
          <p className="text-muted-foreground text-sm">
            Escolha a filial que deseja visualizar
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (availableBranches.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nenhuma filial disponível</h2>
        <p className="text-muted-foreground">
          Entre em contato com o administrador do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Selecione uma Filial</h2>
        <p className="text-muted-foreground">
          Escolha a filial que deseja visualizar para acessar os dados
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {availableBranches.map((branch) => {
          const isSelected = selectedBranch?.id === branch.id;
          
          return (
            <Card
              key={branch.id}
              className={cn(
                'cursor-pointer transition-all duration-300 hover:shadow-md relative overflow-hidden',
                isSelected
                  ? 'ring-2 ring-primary bg-primary/5 shadow-lg'
                  : 'hover:border-primary/50'
              )}
              onClick={() => selectBranch(branch)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-12 w-12 rounded-lg flex items-center justify-center transition-colors duration-300',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{branch.name}</h3>
                      {branch.city && branch.state && (
                        <p className="text-sm text-muted-foreground">
                          {branch.city}/{branch.state}
                        </p>
                      )}
                      {branch.is_main && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                          Matriz
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedBranch && (
        <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm text-muted-foreground">
            Visualizando dados de <strong>{selectedBranch.name}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
