import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Plus, Search, Users, Eye, Trash2, FileText, Sun, Cloud, CloudRain, CloudSun, Calendar, CheckCircle, PenTool, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useDiarioObras, DiarioObra } from "@/hooks/useObras";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useAuthContext } from "@/contexts/AuthContext";
import { exportDiarioObraPDF } from "@/lib/exportDiarioObraPDF";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TablePagination } from "@/components/ui/table-pagination";
import { Separator } from "@/components/ui/separator";
import { MobileDiarioForm } from "@/components/diario/MobileDiarioForm";
import { SignatureModal } from "@/components/ui/signature-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  nome: string;
  funcao: string;
  assinatura?: string;
}

const DiarioObras = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDiario, setSelectedDiario] = useState<DiarioObra | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isValidateDialogOpen, setIsValidateDialogOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [validationObservation, setValidationObservation] = useState("");
  const [supervisorSignature, setSupervisorSignature] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isQuickValidation, setIsQuickValidation] = useState(false);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEquipe, setFilterEquipe] = useState<string>("all");
  const [filterDateStart, setFilterDateStart] = useState<Date | undefined>(undefined);
  const [filterDateEnd, setFilterDateEnd] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { diarios, isLoading, createDiario, deleteDiario, validateDiario } = useDiarioObras();
  const { tenant, user } = useAuthContext();
  const isMobile = useIsMobile();

  // Check if user can validate (admin, superadmin, or manager)
  useEffect(() => {
    const checkCanValidate = async () => {
      if (!user?.id || !tenant?.id) return;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();
      
      const canValidate = ['admin', 'superadmin', 'manager'].includes(data?.role || '');
      setIsAdmin(canValidate);
    };
    
    checkCanValidate();
  }, [user?.id, tenant?.id]);

  const handleExportPDF = (diario: DiarioObra) => {
    if (!tenant) return;
    
    const tenantData = tenant as any;
    exportDiarioObraPDF({
      diario,
      obra: null,
      tenant: {
        name: tenantData.name,
        logo_url: tenantData.logo_url,
        logo_dark_url: tenantData.logo_dark_url,
        address: tenantData.address,
        city: tenantData.city,
        state: tenantData.state,
        phone: tenantData.phone,
      },
    });
  };

  const getClimaIcon = (clima?: string) => {
    if (!clima) return null;
    const icons: Record<string, { icon: typeof Sun; color: string }> = {
      bom: { icon: Sun, color: 'text-yellow-500' },
      nublado: { icon: Cloud, color: 'text-gray-500' },
      chuva: { icon: CloudRain, color: 'text-blue-500' },
      instavel: { icon: CloudSun, color: 'text-orange-500' }
    };
    const config = icons[clima];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 ${config.color}`} />;
  };

  const handleCreateDiario = async (data: any) => {
    await createDiario.mutateAsync({
      ...data,
      equipe_presente: data.equipe_assinaturas?.length || data.equipe_presente,
    });
    setIsFormOpen(false);
  };

  const handleDeleteDiario = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      await deleteDiario.mutateAsync(id);
    }
  };

  const openValidateDialog = (diario: DiarioObra) => {
    setSelectedDiario(diario);
    setValidationObservation(diario.observacao_fiscalizacao || "");
    setSupervisorSignature(null);
    setIsValidateDialogOpen(true);
  };

  const openQuickValidation = () => {
    setIsQuickValidation(true);
    setIsSignatureModalOpen(true);
  };

  const handleSignatureSave = async (signature: string) => {
    setSupervisorSignature(signature);
    setIsSignatureModalOpen(false);
    
    if (isQuickValidation && selectedDiario && user?.id) {
      // Quick validation: validate immediately after signing
      await validateDiario.mutateAsync({
        id: selectedDiario.id,
        observacao_fiscalizacao: validationObservation,
        supervisor_signature: signature,
        validated_by: user.id,
      });
      
      setIsQuickValidation(false);
      setIsViewDialogOpen(false);
      setSelectedDiario(null);
      setSupervisorSignature(null);
      setValidationObservation("");
    }
  };

  const handleValidateDiario = async () => {
    if (!selectedDiario || !supervisorSignature || !user?.id) return;
    
    await validateDiario.mutateAsync({
      id: selectedDiario.id,
      observacao_fiscalizacao: validationObservation,
      supervisor_signature: supervisorSignature,
      validated_by: user.id,
    });
    
    setIsValidateDialogOpen(false);
    setSelectedDiario(null);
    setSupervisorSignature(null);
    setValidationObservation("");
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'validado') {
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Validado</Badge>;
    }
    return <Badge variant="outline" className="text-orange-600 border-orange-600">Aberto</Badge>;
  };

  // Get unique teams for filter
  const uniqueEquipes = [...new Set(diarios.map(d => d.equipe_manha).filter(Boolean))];

  const filteredDiarios = diarios.filter(diario => {
    // Search filter
    const matchesSearch = !searchTerm || 
      diario.atividades_realizadas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diario.equipe_manha?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(diario.data).toLocaleDateString('pt-BR').includes(searchTerm);
    
    // Status filter
    const matchesStatus = filterStatus === "all" || diario.status === filterStatus;
    
    // Team filter
    const matchesEquipe = filterEquipe === "all" || diario.equipe_manha === filterEquipe;
    
    // Date range filter
    const diarioDate = new Date(diario.data);
    const matchesDateStart = !filterDateStart || diarioDate >= filterDateStart;
    const matchesDateEnd = !filterDateEnd || diarioDate <= filterDateEnd;
    
    return matchesSearch && matchesStatus && matchesEquipe && matchesDateStart && matchesDateEnd;
  });

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterEquipe("all");
    setFilterDateStart(undefined);
    setFilterDateEnd(undefined);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const hasActiveFilters = filterStatus !== "all" || filterEquipe !== "all" || filterDateStart || filterDateEnd;

  // Pagination calculations
  const totalItems = filteredDiarios.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDiarios = filteredDiarios.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: any) => void, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <TableSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <PageHeader 
          title="Diário de Obras" 
          description="Registros diários de acompanhamento"
        />

        {/* Mobile Cards View */}
        {isMobile ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setIsFormOpen(true)}
                size="icon"
                className="h-9 w-9 shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showFilters && (
              <Card className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filtros</span>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="validado">Validado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterEquipe} onValueChange={setFilterEquipe}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Equipes</SelectItem>
                      {uniqueEquipes.map(equipe => (
                        <SelectItem key={equipe} value={equipe || ""}>{equipe}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 text-xs justify-start font-normal">
                        <Calendar className="h-3 w-3 mr-1" />
                        {filterDateStart ? filterDateStart.toLocaleDateString('pt-BR') : 'De'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filterDateStart}
                        onSelect={setFilterDateStart}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 text-xs justify-start font-normal">
                        <Calendar className="h-3 w-3 mr-1" />
                        {filterDateEnd ? filterDateEnd.toLocaleDateString('pt-BR') : 'Até'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filterDateEnd}
                        onSelect={setFilterDateEnd}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </Card>
            )}

            {filteredDiarios.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">
                Nenhum registro encontrado.
              </p>
            ) : (
              paginatedDiarios.map((diario) => (
                <Card key={diario.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm">
                            {new Date(diario.data).toLocaleDateString('pt-BR')}
                          </span>
                          <div className="flex gap-0.5">
                            {getClimaIcon(diario.clima_manha || diario.clima)}
                            {getClimaIcon(diario.clima_tarde)}
                          </div>
                          {getStatusBadge(diario.status)}
                        </div>

                        {diario.equipe_manha && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium">{diario.equipe_manha}</span>
                          </div>
                        )}

                        {diario.atividades_realizadas && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {diario.atividades_realizadas}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5">
                        {isAdmin && diario.status !== 'validado' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openValidateDialog(diario)}
                            title="Validar"
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleExportPDF(diario)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedDiario(diario);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteDiario(diario.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <Card>
            <CardHeader className="pb-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                      {[filterStatus !== "all", filterEquipe !== "all", filterDateStart, filterDateEnd].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
                
                <Button onClick={() => setIsFormOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Registro
                </Button>
              </div>
              
              {showFilters && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="validado">Validado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterEquipe} onValueChange={setFilterEquipe}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Equipes</SelectItem>
                      {uniqueEquipes.map(equipe => (
                        <SelectItem key={equipe} value={equipe || ""}>{equipe}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[130px] justify-start font-normal">
                        <Calendar className="h-4 w-4 mr-2" />
                        {filterDateStart ? filterDateStart.toLocaleDateString('pt-BR') : 'De'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filterDateStart}
                        onSelect={setFilterDateStart}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[130px] justify-start font-normal">
                        <Calendar className="h-4 w-4 mr-2" />
                        {filterDateEnd ? filterDateEnd.toLocaleDateString('pt-BR') : 'Até'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filterDateEnd}
                        onSelect={setFilterDateEnd}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {filteredDiarios.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum registro de diário encontrado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Atividades</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDiarios.map((diario) => (
                      <TableRow 
                        key={diario.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedDiario(diario);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          {new Date(diario.data).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {getClimaIcon(diario.clima_manha || diario.clima)}
                            {getClimaIcon(diario.clima_tarde)}
                            {getClimaIcon(diario.clima_noite)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(diario.equipe_assinaturas?.length || diario.equipe_presente) ? (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              {diario.equipe_assinaturas?.length || diario.equipe_presente}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {diario.atividades_realizadas || '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(diario.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {isAdmin && diario.status !== 'validado' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Validar"
                                onClick={() => openValidateDialog(diario)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Exportar PDF"
                              onClick={() => handleExportPDF(diario)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              title="Excluir"
                              onClick={() => handleDeleteDiario(diario.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        )}

        {/* Pagination */}
        {totalItems > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
            showAllOption={false}
            className="px-4"
          />
        )}

        {/* Mobile Form Wizard */}
        <MobileDiarioForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreateDiario}
          isSubmitting={createDiario.isPending}
        />

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">Detalhes do Diário</DialogTitle>
            </DialogHeader>
            {selectedDiario && (
              <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                <div className="space-y-4 py-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Data</Label>
                    <p className="font-medium">
                      {new Date(selectedDiario.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <Separator />

                  {/* Weather */}
                  <div>
                    <Label className="text-xs font-semibold">TEMPO</Label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Manhã:</span>
                        {getClimaIcon(selectedDiario.clima_manha)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Tarde:</span>
                        {getClimaIcon(selectedDiario.clima_tarde)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Noite:</span>
                        {getClimaIcon(selectedDiario.clima_noite)}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Morning Shift */}
                  {(selectedDiario.equipe_manha || selectedDiario.veiculo_manha) && (
                    <>
                      <div>
                        <Label className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded">TURNO MANHÃ</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          <div>
                            <Label className="text-muted-foreground text-xs">Equipe</Label>
                            <p className="text-sm">{selectedDiario.equipe_manha || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Veículo</Label>
                            <p className="text-sm">{selectedDiario.veiculo_manha || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Placa</Label>
                            <p className="text-sm">{selectedDiario.placa_manha || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Motorista</Label>
                            <p className="text-sm">{selectedDiario.motorista_manha || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">KM Ida</Label>
                            <p className="text-sm">{selectedDiario.km_ida_manha || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">KM Volta</Label>
                            <p className="text-sm">{selectedDiario.km_volta_manha || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Horário</Label>
                            <p className="text-sm">{selectedDiario.hora_inicio_manha || '-'} - {selectedDiario.hora_fim_manha || '-'}</p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Afternoon Shift */}
                  {(selectedDiario.equipe_tarde || selectedDiario.veiculo_tarde) && (
                    <>
                      <div>
                        <Label className="text-xs font-semibold bg-orange-500 text-white px-2 py-1 rounded">TURNO TARDE</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          <div>
                            <Label className="text-muted-foreground text-xs">Equipe</Label>
                            <p className="text-sm">{selectedDiario.equipe_tarde || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Veículo</Label>
                            <p className="text-sm">{selectedDiario.veiculo_tarde || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Placa</Label>
                            <p className="text-sm">{selectedDiario.placa_tarde || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Motorista</Label>
                            <p className="text-sm">{selectedDiario.motorista_tarde || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">KM Ida</Label>
                            <p className="text-sm">{selectedDiario.km_ida_tarde || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">KM Volta</Label>
                            <p className="text-sm">{selectedDiario.km_volta_tarde || '-'}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Horário</Label>
                            <p className="text-sm">{selectedDiario.hora_inicio_tarde || '-'} - {selectedDiario.hora_fim_tarde || '-'}</p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Materials */}
                  {selectedDiario.materiais_utilizados && (
                    <>
                      <div>
                        <Label className="text-muted-foreground text-xs">Materiais Utilizados</Label>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{selectedDiario.materiais_utilizados}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Services */}
                  <div>
                    <Label className="text-muted-foreground text-xs">Descrição dos Serviços Executados</Label>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{selectedDiario.atividades_realizadas || '-'}</p>
                  </div>

                  {/* Team Signatures */}
                  {selectedDiario.equipe_assinaturas && selectedDiario.equipe_assinaturas.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-xs font-semibold">Equipe Presente ({selectedDiario.equipe_assinaturas.length})</Label>
                        <div className="border rounded-md mt-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Função</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedDiario.equipe_assinaturas.map((member: TeamMember, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>{member.nome}</TableCell>
                                  <TableCell>{member.funcao}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Occurrences */}
                  {selectedDiario.ocorrencias && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground text-xs">Ocorrências</Label>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{selectedDiario.ocorrencias}</p>
                      </div>
                    </>
                  )}

                  {/* Fiscalization */}
                  {selectedDiario.observacao_fiscalizacao && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground text-xs">Registro da Fiscalização</Label>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{selectedDiario.observacao_fiscalizacao}</p>
                      </div>
                    </>
                  )}

                  {/* Supervisor Signature */}
                  {selectedDiario.supervisor_signature && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground text-xs">Assinatura do Supervisor</Label>
                        <img 
                          src={selectedDiario.supervisor_signature} 
                          alt="Assinatura do supervisor" 
                          className="h-20 border rounded mt-1"
                        />
                        {selectedDiario.validated_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Validado em: {new Date(selectedDiario.validated_at).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => handleExportPDF(selectedDiario)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                    {isAdmin && selectedDiario.status !== 'validado' && (
                      <Button 
                        variant="default"
                        onClick={openQuickValidation}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Validar
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* Validation Dialog */}
        <Dialog open={isValidateDialogOpen} onOpenChange={setIsValidateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Validar Diário de Obras</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Observações da Fiscalização</Label>
                <Textarea
                  value={validationObservation}
                  onChange={(e) => setValidationObservation(e.target.value)}
                  placeholder="Digite as observações da fiscalização..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Assinatura do Supervisor *</Label>
                {supervisorSignature ? (
                  <div className="space-y-2">
                    <img 
                      src={supervisorSignature} 
                      alt="Assinatura" 
                      className="h-20 border rounded"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsSignatureModalOpen(true)}
                    >
                      <PenTool className="h-4 w-4 mr-2" />
                      Refazer Assinatura
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="w-full"
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Assinar
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsValidateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleValidateDiario}
                disabled={!supervisorSignature || validateDiario.isPending}
              >
                {validateDiario.isPending ? 'Validando...' : 'Validar Diário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Signature Modal */}
        <SignatureModal
          open={isSignatureModalOpen}
          onClose={() => {
            setIsSignatureModalOpen(false);
            setIsQuickValidation(false);
          }}
          onSave={handleSignatureSave}
          title="Assinatura do Supervisor"
        />
      </div>
    </DashboardLayout>
  );
};

export default DiarioObras;
