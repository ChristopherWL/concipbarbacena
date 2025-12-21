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
  Edit, 
  Trash2, 
  HardHat,
  UserX,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEmployees } from '@/hooks/useEmployees';
import { Employee, EMPLOYEE_STATUS_LABELS, CONTRACT_TYPE_LABELS } from '@/types/hr';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import { EmployeeDetailsDialog } from './EmployeeDetailsDialog';
import { TerminationDialog } from './TerminationDialog';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { format } from 'date-fns';

interface EmployeesTabProps {
  isReadOnly?: boolean;
}

export function EmployeesTab({ isReadOnly = false }: EmployeesTabProps) {
  const { employees, isLoading, deleteEmployee } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [terminationOpen, setTerminationOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cpf?.includes(searchTerm) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeEmployees = filteredEmployees.filter(e => e.status !== 'desligado');
  const terminatedEmployees = filteredEmployees.filter(e => e.status === 'desligado');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-500/10 text-green-500';
      case 'ferias': return 'bg-blue-500/10 text-blue-500';
      case 'afastado': return 'bg-yellow-500/10 text-yellow-500';
      case 'desligado': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormOpen(true);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailsOpen(true);
  };

  const handleTerminate = (employee: Employee) => {
    setSelectedEmployee(employee);
    setTerminationOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (confirm(`Tem certeza que deseja excluir ${employee.name}?`)) {
      await deleteEmployee(employee.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
        {!isReadOnly && (
          <Button onClick={() => { setSelectedEmployee(null); setFormOpen(true); }} size="sm">
            <Plus className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Novo </span>Colaborador
          </Button>
        )}
      </div>

      {/* Mobile View - Cards */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeEmployees.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              <p>Nenhum colaborador encontrado</p>
            </CardContent>
          </Card>
        ) : (
          activeEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="overflow-hidden"
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {employee.photo_url ? (
                    <img 
                      src={employee.photo_url} 
                      alt={employee.name}
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                      {employee.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{employee.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {employee.position || 'Sem cargo'}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(employee.status)} text-xs shrink-0`}>
                        {EMPLOYEE_STATUS_LABELS[employee.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {CONTRACT_TYPE_LABELS[employee.contract_type]}
                      </Badge>
                      {employee.department && (
                        <span className="truncate">{employee.department}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-1 mt-3 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(employee)}
                    className="text-xs"
                  >
                    EPI
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTerminate(employee)}
                    className="text-orange-600"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop View - Table */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton columns={6} rows={5} />
          ) : activeEmployees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhum colaborador encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Admissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {employee.photo_url ? (
                          <img 
                            src={employee.photo_url} 
                            alt={employee.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          {employee.email && (
                            <p className="text-xs text-muted-foreground">{employee.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.position || '-'}</TableCell>
                    <TableCell>{employee.department || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CONTRACT_TYPE_LABELS[employee.contract_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee.hire_date 
                        ? format(new Date(employee.hire_date), 'dd/MM/yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(employee.status)}>
                        {EMPLOYEE_STATUS_LABELS[employee.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(employee)}>
                            <HardHat className="mr-2 h-4 w-4" />
                            EPI
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(employee)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleTerminate(employee)}
                            className="text-orange-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Desligar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(employee)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Terminated Employees - Mobile Cards */}
      {terminatedEmployees.length > 0 && (
        <>
          <div className="sm:hidden">
            <h3 className="font-medium mb-3 text-sm text-muted-foreground">
              Desligados ({terminatedEmployees.length})
            </h3>
            <div className="space-y-2">
              {terminatedEmployees.map((employee) => (
                <Card key={employee.id} className="opacity-60">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {employee.termination_date 
                            ? format(new Date(employee.termination_date), 'dd/MM/yyyy')
                            : '-'
                          }
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleView(employee)}>
                        <HardHat className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Terminated Employees - Desktop Table */}
          <Card className="hidden sm:block">
            <CardContent className="p-4">
              <h3 className="font-medium mb-4 text-muted-foreground">
                Colaboradores Desligados ({terminatedEmployees.length})
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Desligamento</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terminatedEmployees.map((employee) => (
                    <TableRow key={employee.id} className="opacity-60">
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.position || '-'}</TableCell>
                      <TableCell>
                        {employee.termination_date 
                          ? format(new Date(employee.termination_date), 'dd/MM/yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{employee.termination_reason || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleView(employee)}>
                          <HardHat className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={selectedEmployee}
      />

      <EmployeeDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        employee={selectedEmployee}
      />

      <TerminationDialog
        open={terminationOpen}
        onOpenChange={setTerminationOpen}
        employee={selectedEmployee}
      />
    </div>
  );
}
