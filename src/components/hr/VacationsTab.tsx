import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Check,
  X,
  Eye,
  Trash2
} from 'lucide-react';
import { useVacations } from '@/hooks/useVacations';
import { VACATION_STATUS_LABELS } from '@/types/hr';
import { VacationFormDialog } from './VacationFormDialog';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { format, differenceInDays } from 'date-fns';

interface VacationsTabProps {
  isReadOnly?: boolean;
}

export function VacationsTab({ isReadOnly = false }: VacationsTabProps) {
  const { vacations, isLoading, approveVacation, rejectVacation, deleteVacation } = useVacations();
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const filteredVacations = vacations.filter(v => 
    (v.employee as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-500/10 text-yellow-500';
      case 'aprovada': return 'bg-green-500/10 text-green-500';
      case 'rejeitada': return 'bg-red-500/10 text-red-500';
      case 'em_gozo': return 'bg-blue-500/10 text-blue-500';
      case 'concluida': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleApprove = async (id: string) => {
    await approveVacation(id);
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo da rejeição:');
    if (reason) {
      await rejectVacation(id, reason);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de férias?')) {
      await deleteVacation(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {!isReadOnly && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Férias
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : filteredVacations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum registro de férias encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Período Aquisitivo</TableHead>
                  <TableHead>Período de Gozo</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Venda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVacations.map((vacation) => (
                  <TableRow key={vacation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{(vacation.employee as any)?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(vacation.employee as any)?.position}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(vacation.acquisition_start), 'dd/MM/yy')} - {format(new Date(vacation.acquisition_end), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(vacation.start_date), 'dd/MM/yy')} - {format(new Date(vacation.end_date), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>{vacation.days_taken}</TableCell>
                    <TableCell>{vacation.sold_days > 0 ? `${vacation.sold_days} dias` : '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(vacation.status)}>
                        {VACATION_STATUS_LABELS[vacation.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {vacation.status === 'pendente' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleApprove(vacation.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleReject(vacation.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(vacation.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VacationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
