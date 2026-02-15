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
  Trash2,
  FileText
} from 'lucide-react';
import { useLeaves } from '@/hooks/useLeaves';
import { LEAVE_TYPE_LABELS } from '@/types/hr';
import { LeaveFormDialog } from './LeaveFormDialog';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { format } from 'date-fns';

interface LeavesTabProps {
  isReadOnly?: boolean;
}

export function LeavesTab({ isReadOnly = false }: LeavesTabProps) {
  const { leaves, isLoading, deleteLeave } = useLeaves();
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const filteredLeaves = leaves.filter(l => 
    (l.employee as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.cid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'atestado_medico': return 'bg-blue-500/10 text-blue-500';
      case 'licenca_maternidade': return 'bg-pink-500/10 text-pink-500';
      case 'licenca_paternidade': return 'bg-cyan-500/10 text-cyan-500';
      case 'acidente_trabalho': return 'bg-red-500/10 text-red-500';
      case 'falta_justificada': return 'bg-yellow-500/10 text-yellow-500';
      case 'falta_injustificada': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      await deleteLeave(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por colaborador ou CID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {!isReadOnly && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Afastamento
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton columns={7} rows={5} />
          ) : filteredLeaves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum afastamento registrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>CID</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{(leave.employee as any)?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(leave.employee as any)?.position}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(leave.leave_type)}>
                        {LEAVE_TYPE_LABELS[leave.leave_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(leave.start_date), 'dd/MM/yy')} - {format(new Date(leave.end_date), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell>{leave.cid || '-'}</TableCell>
                    <TableCell>
                      {leave.doctor_name ? (
                        <div>
                          <p className="text-sm">{leave.doctor_name}</p>
                          {leave.crm && <p className="text-xs text-muted-foreground">CRM: {leave.crm}</p>}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {leave.document_url && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => window.open(leave.document_url!, '_blank')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(leave.id)}
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

      <LeaveFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}
