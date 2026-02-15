import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface BranchStats {
  branchId: string;
  branchName: string;
  isMain: boolean;
  products: number;
  stockValue: number;
  employees: number;
  vehicles: number;
  osThisMonth: number;
  openOS: number;
  completedOS: number;
  obras: number;
}

interface BranchStatsTableProps {
  branches: BranchStats[];
  totals: {
    products: number;
    stockValue: number;
    employees: number;
    vehicles: number;
    osThisMonth: number;
    openOS: number;
    completedOS: number;
    obras: number;
  };
}

export function BranchStatsTable({ branches, totals }: BranchStatsTableProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Detalhamento por Filial</CardTitle>
                <CardDescription>Dados consolidados de todas as unidades</CardDescription>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                {isOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Recolher
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Expandir
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filial</TableHead>
                    <TableHead className="text-right">Produtos</TableHead>
                    <TableHead className="text-right">Valor Estoque</TableHead>
                    <TableHead className="text-right">Colaboradores</TableHead>
                    <TableHead className="text-right">Veículos</TableHead>
                    <TableHead className="text-right">OS (Mês)</TableHead>
                    <TableHead className="text-right">Obras</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.branchId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{branch.branchName}</span>
                          {branch.isMain && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                              Matriz
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{branch.products}</TableCell>
                      <TableCell className="text-right">{formatCurrency(branch.stockValue)}</TableCell>
                      <TableCell className="text-right">{branch.employees}</TableCell>
                      <TableCell className="text-right">{branch.vehicles}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span>{branch.osThisMonth}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {branch.openOS} abertas / {branch.completedOS} concluídas
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{branch.obras}</TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>
                      <span className="text-primary">TOTAL GERAL</span>
                    </TableCell>
                    <TableCell className="text-right">{totals.products}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.stockValue)}</TableCell>
                    <TableCell className="text-right">{totals.employees}</TableCell>
                    <TableCell className="text-right">{totals.vehicles}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span>{totals.osThisMonth}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {totals.openOS} abertas / {totals.completedOS} concluídas
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{totals.obras}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
