import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDirectorBranch } from '@/contexts/DirectorBranchContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useVehicles, useCreateVehicle, useUpdateVehicle, useMaintenances, useCreateMaintenance, useDeleteVehicle, useDeleteMaintenance, useFuelLogs, useCreateFuelLog, useDeleteFuelLog } from '@/hooks/useFleet';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MAINTENANCE_STATUS_LABELS, MAINTENANCE_TYPE_LABELS, MaintenanceStatus, MaintenanceType, Vehicle, Maintenance, FuelLog } from '@/types/fleet';
import { Loader2, Truck, Plus, Wrench, AlertTriangle, CheckCircle, Clock, Trash2, Fuel, TrendingUp, Printer, Pencil } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';
import { FuelOrderReport } from '@/components/fleet/FuelOrderReport';

export default function Frota() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin } = useAuthContext();
  const { isReadOnly } = useDirectorBranch();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();
  const { data: maintenances = [], isLoading: maintenancesLoading } = useMaintenances();
  const { data: fuelLogs = [], isLoading: fuelLogsLoading } = useFuelLogs();
  const { data: suppliers = [] } = useSuppliers();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const createMaintenance = useCreateMaintenance();
  const createFuelLog = useCreateFuelLog();
  const deleteVehicle = useDeleteVehicle();
  const deleteMaintenance = useDeleteMaintenance();
  const deleteFuelLog = useDeleteFuelLog();

  const [activeTab, setActiveTab] = useState('vehicles');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [fuelDialogOpen, setFuelDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<Maintenance | null>(null);
  const [fuelLogToDelete, setFuelLogToDelete] = useState<FuelLog | null>(null);
  const [fuelLogToPrint, setFuelLogToPrint] = useState<FuelLog | null>(null);
  const [vehicleToPrint, setVehicleToPrint] = useState<Vehicle | null>(null);
  const [selectedFuelLogForPrint, setSelectedFuelLogForPrint] = useState<FuelLog | null>(null);
  const fuelLogPrintRef = useRef<HTMLDivElement>(null);
  const vehiclePrintRef = useRef<HTMLDivElement>(null);
  const [vehicleForm, setVehicleForm] = useState({ plate: '', brand: '', model: '', year: '', color: '', current_km: '0', fuel_type: 'flex', fleet_number: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ vehicle_id: '', maintenance_type: 'preventiva' as MaintenanceType, description: '', scheduled_date: '', cost: '0' });
  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', supplier_id: '', date: new Date().toISOString().split('T')[0], km_at_fill: '', liters: '', price_per_liter: '', fuel_type: 'gasolina', full_tank: true, notes: '' });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
  }, [user, authLoading, navigate]);

  if (authLoading) return <PageLoading text="Carregando frota" />;
  if (!user) return null;

  const handleCreateVehicle = async () => {
    if (!vehicleForm.plate || !vehicleForm.brand || !vehicleForm.model) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    await createVehicle.mutateAsync({
      ...vehicleForm,
      year: vehicleForm.year ? parseInt(vehicleForm.year) : undefined,
      current_km: parseInt(vehicleForm.current_km) || 0,
      is_active: true,
    });
    setVehicleDialogOpen(false);
    setVehicleForm({ plate: '', brand: '', model: '', year: '', color: '', current_km: '0', fuel_type: 'flex', fleet_number: '' });
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setVehicleToEdit(vehicle);
    setVehicleForm({
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year?.toString() || '',
      color: vehicle.color || '',
      current_km: vehicle.current_km.toString(),
      fuel_type: vehicle.fuel_type,
      fleet_number: vehicle.fleet_number || '',
    });
    setVehicleDialogOpen(true);
  };

  const handleUpdateVehicle = async () => {
    if (!vehicleToEdit || !vehicleForm.plate || !vehicleForm.brand || !vehicleForm.model) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    await updateVehicle.mutateAsync({
      id: vehicleToEdit.id,
      plate: vehicleForm.plate,
      brand: vehicleForm.brand,
      model: vehicleForm.model,
      year: vehicleForm.year ? parseInt(vehicleForm.year) : null,
      color: vehicleForm.color || null,
      current_km: parseInt(vehicleForm.current_km) || 0,
      fuel_type: vehicleForm.fuel_type,
      fleet_number: vehicleForm.fleet_number || null,
    });
    setVehicleDialogOpen(false);
    setVehicleToEdit(null);
    setVehicleForm({ plate: '', brand: '', model: '', year: '', color: '', current_km: '0', fuel_type: 'flex', fleet_number: '' });
  };

  const handleCloseVehicleDialog = () => {
    setVehicleDialogOpen(false);
    setVehicleToEdit(null);
    setVehicleForm({ plate: '', brand: '', model: '', year: '', color: '', current_km: '0', fuel_type: 'flex', fleet_number: '' });
  };

  const handleCreateMaintenance = async () => {
    if (!maintenanceForm.vehicle_id || !maintenanceForm.description) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    await createMaintenance.mutateAsync({
      ...maintenanceForm,
      cost: parseFloat(maintenanceForm.cost) || 0,
      status: 'agendada',
      scheduled_date: maintenanceForm.scheduled_date || null,
    });
    setMaintenanceDialogOpen(false);
    setMaintenanceForm({ vehicle_id: '', maintenance_type: 'preventiva', description: '', scheduled_date: '', cost: '0' });
  };

  const handleDeleteVehicle = async () => {
    if (vehicleToDelete) {
      await deleteVehicle.mutateAsync(vehicleToDelete.id);
      setVehicleToDelete(null);
    }
  };

  const handleDeleteMaintenance = async () => {
    if (maintenanceToDelete) {
      await deleteMaintenance.mutateAsync(maintenanceToDelete.id);
      setMaintenanceToDelete(null);
    }
  };

  const handleCreateFuelLog = async () => {
    if (!fuelForm.vehicle_id || !fuelForm.km_at_fill || !fuelForm.liters || !fuelForm.price_per_liter) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const liters = parseFloat(fuelForm.liters);
    const pricePerLiter = parseFloat(fuelForm.price_per_liter);
    await createFuelLog.mutateAsync({
      vehicle_id: fuelForm.vehicle_id,
      supplier_id: fuelForm.supplier_id || undefined,
      date: fuelForm.date,
      km_at_fill: parseInt(fuelForm.km_at_fill),
      liters,
      price_per_liter: pricePerLiter,
      total_cost: liters * pricePerLiter,
      fuel_type: fuelForm.fuel_type,
      full_tank: fuelForm.full_tank,
      notes: fuelForm.notes || undefined,
    });
    setFuelDialogOpen(false);
    setFuelForm({ vehicle_id: '', supplier_id: '', date: new Date().toISOString().split('T')[0], km_at_fill: '', liters: '', price_per_liter: '', fuel_type: 'gasolina', full_tank: true, notes: '' });
  };

  const handleDeleteFuelLog = async () => {
    if (fuelLogToDelete) {
      await deleteFuelLog.mutateAsync(fuelLogToDelete.id);
      setFuelLogToDelete(null);
    }
  };

  const handlePrintFuelOrder = () => {
    const ref = fuelLogToPrint ? fuelLogPrintRef : vehiclePrintRef;
    if (ref.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Ordem de Abastecimento</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; background: white; color: black; }
              .report-container { padding: 32px; width: 210mm; min-height: 297mm; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid black; padding-bottom: 16px; margin-bottom: 16px; }
              .logo-container { width: 96px; }
              .logo-container img { width: 100%; height: auto; }
              .logo-placeholder { width: 80px; height: 80px; background: #e5e5e5; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666; }
              .company-info { text-align: right; }
              .company-name { font-size: 20px; font-weight: bold; text-transform: uppercase; }
              .company-cnpj { font-size: 14px; }
              .title-box { background: #e5e5e5; text-align: center; padding: 8px; margin-bottom: 24px; border: 1px solid black; }
              .title-box h2 { font-size: 18px; font-weight: bold; }
              .field-row { display: flex; gap: 8px; margin-bottom: 8px; }
              .field-label { font-weight: 600; font-size: 14px; white-space: nowrap; }
              .field-value { border-bottom: 1px solid black; flex: 1; font-size: 14px; padding-left: 4px; }
              .field-value-fixed { border-bottom: 1px solid black; font-size: 14px; padding: 0 16px; }
              .vehicle-fields { display: flex; gap: 32px; margin-top: 8px; }
              table { width: 100%; border-collapse: collapse; margin: 24px 0 32px 0; }
              th, td { border: 1px solid black; padding: 8px; font-size: 14px; text-align: left; }
              th { background: #f0f0f0; }
              td.text-right, th.text-right { text-align: right; }
              .signature-section { margin-top: 48px; }
              .signature-row { display: flex; gap: 8px; margin-bottom: 32px; }
              .signature-label { font-weight: 600; font-size: 14px; }
              .signature-line { border-bottom: 1px solid black; flex: 1; height: 48px; }
              .footer { margin-top: 48px; text-align: center; font-size: 14px; color: #666; }
              @media print { 
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } 
                .report-container { padding: 16px; }
              }
            </style>
          </head>
          <body>
            ${ref.current.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const getFuelLogOrderNumber = (fuelLog: FuelLog) => {
    const sortedLogs = [...fuelLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedLogs.findIndex(f => f.id === fuelLog.id) + 1;
  };

  const getVehicleNextOrderNumber = (vehicle: Vehicle) => {
    const vehicleLogs = fuelLogs.filter(f => f.vehicle_id === vehicle.id);
    return vehicleLogs.length + 1;
  };


  const getStatusIcon = (status: MaintenanceStatus) => {
    switch (status) {
      case 'agendada': return <Clock className="h-4 w-4 text-info" />;
      case 'em_andamento': return <Wrench className="h-4 w-4 text-warning" />;
      case 'concluida': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'cancelada': return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
  };

  const pendingMaintenances = maintenances.filter(m => m.status === 'agendada' || m.status === 'em_andamento');
  const completedMaintenances = maintenances.filter(m => m.status === 'concluida');
  
  // Calculate fuel stats
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.total_cost, 0);
  const totalLiters = fuelLogs.reduce((sum, log) => sum + log.liters, 0);
  const avgPricePerLiter = fuelLogs.length > 0 ? totalFuelCost / totalLiters : 0;
  
  // Calculate average consumption (km/L) for a specific vehicle
  const calculateVehicleAvgConsumption = (vehicleId: string) => {
    const vehicleLogs = fuelLogs.filter(f => f.vehicle_id === vehicleId);
    const sortedLogs = [...vehicleLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let totalKm = 0;
    let totalLitersForCalc = 0;
    
    for (let i = 1; i < sortedLogs.length; i++) {
      if (sortedLogs[i].full_tank && sortedLogs[i-1].full_tank) {
        const kmDiff = sortedLogs[i].km_at_fill - sortedLogs[i-1].km_at_fill;
        if (kmDiff > 0) {
          totalKm += kmDiff;
          totalLitersForCalc += sortedLogs[i].liters;
        }
      }
    }
    return totalLitersForCalc > 0 ? totalKm / totalLitersForCalc : 0;
  };
  
  // Get selected vehicle stats
  const selectedVehicleAvg = selectedVehicle ? calculateVehicleAvgConsumption(selectedVehicle.id) : 0;
  const selectedVehicleFuelLogs = selectedVehicle ? fuelLogs.filter(f => f.vehicle_id === selectedVehicle.id) : [];
  const selectedVehicleTotalLiters = selectedVehicleFuelLogs.reduce((sum, log) => sum + log.liters, 0);
  const selectedVehicleTotalCost = selectedVehicleFuelLogs.reduce((sum, log) => sum + log.total_cost, 0);
  
  // Maintenance stats
  const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + m.cost, 0);
  const activeVehicles = vehicles.filter(v => v.is_active).length;
  const avgKm = vehicles.length > 0 ? vehicles.reduce((sum, v) => sum + v.current_km, 0) / vehicles.length : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in" data-tour="fleet-content">
        <PageHeader
          title="Gestão de Frota"
          description="Gerencie veículos, manutenções e abastecimentos"
        />
        {!isReadOnly && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setFuelDialogOpen(true)}><Fuel className="h-4 w-4 mr-2" />Abastecer</Button>
            <Button variant="outline" onClick={() => setMaintenanceDialogOpen(true)}><Wrench className="h-4 w-4 mr-2" />Nova Manutenção</Button>
            <Button onClick={() => setVehicleDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Veículo</Button>
          </div>
        )}

        {/* Stats - Dynamic based on active tab */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {activeTab === 'vehicles' && !selectedVehicle && (
            <>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Truck className="h-5 w-5 text-primary" /></div>
                <div><p className="text-2xl font-bold">{vehicles.length}</p><p className="text-xs text-muted-foreground">Total Veículos</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div>
                <div><p className="text-2xl font-bold">{activeVehicles}</p><p className="text-xs text-muted-foreground">Veículos Ativos</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
                <div><p className="text-2xl font-bold">{pendingMaintenances.length}</p><p className="text-xs text-muted-foreground">Manutenções Pendentes</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted"><TrendingUp className="h-5 w-5 text-muted-foreground" /></div>
                <div><p className="text-2xl font-bold">{avgKm.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">Média KM</p></div>
              </CardContent></Card>
            </>
          )}
          {activeTab === 'vehicles' && selectedVehicle && (
            <>
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedVehicle(null)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Truck className="h-5 w-5 text-primary" /></div>
                  <div><p className="text-lg font-bold truncate">{selectedVehicle.plate}</p><p className="text-xs text-muted-foreground">{selectedVehicle.brand} {selectedVehicle.model}</p></div>
                </CardContent>
              </Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10"><TrendingUp className="h-5 w-5 text-amber-500" /></div>
                <div><p className="text-2xl font-bold">{selectedVehicleAvg > 0 ? selectedVehicleAvg.toFixed(1) : '-'}</p><p className="text-xs text-muted-foreground">Média km/L</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><Fuel className="h-5 w-5 text-emerald-500" /></div>
                <div><p className="text-2xl font-bold">{selectedVehicleTotalLiters.toFixed(0)}L</p><p className="text-xs text-muted-foreground">Litros Total</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10"><TrendingUp className="h-5 w-5 text-rose-500" /></div>
                <div><p className="text-2xl font-bold">R$ {selectedVehicleTotalCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">Gasto Combustível</p></div>
              </CardContent></Card>
            </>
          )}
          {activeTab === 'fuel' && (
            <>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Fuel className="h-5 w-5 text-primary" /></div>
                <div><p className="text-2xl font-bold">{fuelLogs.length}</p><p className="text-xs text-muted-foreground">Abastecimentos</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><Fuel className="h-5 w-5 text-emerald-500" /></div>
                <div><p className="text-2xl font-bold">{totalLiters.toFixed(0)}L</p><p className="text-xs text-muted-foreground">Litros Total</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10"><TrendingUp className="h-5 w-5 text-amber-500" /></div>
                <div><p className="text-2xl font-bold">R$ {avgPricePerLiter > 0 ? avgPricePerLiter.toFixed(2) : '-'}</p><p className="text-xs text-muted-foreground">Preço Médio/L</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10"><TrendingUp className="h-5 w-5 text-rose-500" /></div>
                <div><p className="text-2xl font-bold">R$ {totalFuelCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">Gasto Total</p></div>
              </CardContent></Card>
            </>
          )}
          {activeTab === 'maintenances' && (
            <>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Wrench className="h-5 w-5 text-primary" /></div>
                <div><p className="text-2xl font-bold">{maintenances.length}</p><p className="text-xs text-muted-foreground">Total Manutenções</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
                <div><p className="text-2xl font-bold">{pendingMaintenances.length}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div>
                <div><p className="text-2xl font-bold">{completedMaintenances.length}</p><p className="text-xs text-muted-foreground">Concluídas</p></div>
              </CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10"><TrendingUp className="h-5 w-5 text-rose-500" /></div>
                <div><p className="text-2xl font-bold">R$ {totalMaintenanceCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">Custo Total</p></div>
              </CardContent></Card>
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedVehicle(null); }}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="vehicles" className="text-xs sm:text-sm">Veículos</TabsTrigger>
            <TabsTrigger value="fuel" className="text-xs sm:text-sm">Abastecimentos</TabsTrigger>
            <TabsTrigger value="maintenances" className="text-xs sm:text-sm">Manutenções</TabsTrigger>
          </TabsList>
          
          <TabsContent value="vehicles">
            <Card>
              <CardHeader className="px-3 sm:px-6"><CardTitle className="text-base sm:text-lg">Veículos Cadastrados</CardTitle></CardHeader>
              <CardContent className="p-0 sm:p-6">
                {vehiclesLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto my-8" /> : vehicles.length === 0 ? (
                  <div className="text-center py-8"><Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum veículo cadastrado</p></div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="sm:hidden divide-y divide-border">
                      {vehicles.map(v => (
                        <div 
                          key={v.id}
                          className={`p-4 space-y-3 cursor-pointer transition-colors ${selectedVehicle?.id === v.id ? 'bg-primary/10' : ''}`}
                          onClick={() => setSelectedVehicle(selectedVehicle?.id === v.id ? null : v)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-mono font-bold">{v.plate}</p>
                                <p className="text-sm text-muted-foreground">{v.brand} {v.model}</p>
                              </div>
                            </div>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                                onClick={() => {
                                  const vehicleFuelLogs = fuelLogs.filter(f => f.vehicle_id === v.id);
                                  const latestFuelLog = vehicleFuelLogs.length > 0 ? vehicleFuelLogs[0] : null;
                                  setVehicleToPrint(v);
                                  setSelectedFuelLogForPrint(latestFuelLog);
                                }}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditVehicle(v)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {isAdmin() && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => setVehicleToDelete(v)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-muted-foreground">Frota:</span> {v.fleet_number || '-'}</div>
                            <div><span className="text-muted-foreground">Ano:</span> {v.year || '-'}</div>
                            <div><span className="text-muted-foreground">KM:</span> {v.current_km.toLocaleString()}</div>
                            <div><Badge variant="outline" className="text-xs">{v.fuel_type}</Badge></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Placa</TableHead>
                            <TableHead>Veículo</TableHead>
                            <TableHead className="hidden lg:table-cell">Frota</TableHead>
                            <TableHead className="text-center">KM</TableHead>
                            <TableHead className="hidden xl:table-cell">Combustível</TableHead>
                            {!isReadOnly && <TableHead className="w-20"></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vehicles.map(v => (
                            <TableRow 
                              key={v.id} 
                              className={`cursor-pointer hover:bg-muted/50 transition-colors ${selectedVehicle?.id === v.id ? 'bg-primary/10' : ''}`}
                              onClick={() => setSelectedVehicle(selectedVehicle?.id === v.id ? null : v)}
                            >
                              <TableCell className="py-2">
                                <div>
                                  <span className="font-mono font-bold text-sm">{v.plate}</span>
                                  <span className="text-xs text-muted-foreground lg:hidden block">{v.fleet_number || '-'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2 text-sm">{v.brand} {v.model}</TableCell>
                              <TableCell className="hidden lg:table-cell text-sm">{v.fleet_number || '-'}</TableCell>
                              <TableCell className="text-center py-2">
                                <span className="font-semibold text-sm">{v.current_km.toLocaleString()}</span>
                              </TableCell>
                              <TableCell className="hidden xl:table-cell">
                                <Badge variant="outline" className="text-xs">{v.fuel_type}</Badge>
                              </TableCell>
                              {!isReadOnly && (
                                <TableCell className="py-2">
                                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => { const vehicleFuelLogs = fuelLogs.filter(f => f.vehicle_id === v.id); setVehicleToPrint(v); setSelectedFuelLogForPrint(vehicleFuelLogs[0] || null); }}>
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditVehicle(v)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    {isAdmin() && (
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setVehicleToDelete(v)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fuel">
            <Card>
              <CardHeader><CardTitle>Histórico de Abastecimentos</CardTitle></CardHeader>
              <CardContent>
                {fuelLogsLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : fuelLogs.length === 0 ? (
                  <div className="text-center py-8"><Fuel className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhum abastecimento registrado</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-center">Litros</TableHead>
                          <TableHead className="hidden lg:table-cell text-right">R$/L</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="hidden xl:table-cell">Comb.</TableHead>
                          {isAdmin() && !isReadOnly && <TableHead className="w-12"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fuelLogs.map(f => (
                          <TableRow key={f.id}>
                            <TableCell className="py-2">
                              <div>
                                <span className="font-mono text-sm">{f.vehicle?.plate}</span>
                                <span className="text-xs text-muted-foreground block">{f.km_at_fill.toLocaleString()} km</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm py-2">{new Date(f.date).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="text-center text-sm py-2">{f.liters.toFixed(1)}L</TableCell>
                            <TableCell className="hidden lg:table-cell text-right text-sm py-2">R$ {f.price_per_liter.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold text-sm py-2">R$ {f.total_cost.toFixed(2)}</TableCell>
                            <TableCell className="hidden xl:table-cell"><Badge variant="outline" className="text-xs">{f.fuel_type || '-'}</Badge></TableCell>
                            {isAdmin() && !isReadOnly && (
                              <TableCell className="py-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setFuelLogToDelete(f)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenances">
            <Card>
              <CardHeader><CardTitle>Histórico de Manutenções</CardTitle></CardHeader>
              <CardContent>
                {maintenancesLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : maintenances.length === 0 ? (
                  <div className="text-center py-8"><Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Nenhuma manutenção registrada</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="hidden lg:table-cell">Data</TableHead>
                          <TableHead className="hidden xl:table-cell text-right">Custo</TableHead>
                          <TableHead>Status</TableHead>
                          {isAdmin() && !isReadOnly && <TableHead className="w-12"></TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenances.map(m => (
                          <TableRow key={m.id}>
                            <TableCell className="py-2">
                              <div>
                                <span className="font-mono text-sm">{m.vehicle?.plate}</span>
                                <Badge variant="outline" className="text-xs block w-fit mt-1">{MAINTENANCE_TYPE_LABELS[m.maintenance_type]}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 text-sm max-w-[200px] truncate">{m.description}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm py-2">{m.scheduled_date ? new Date(m.scheduled_date).toLocaleDateString('pt-BR') : '-'}</TableCell>
                            <TableCell className="hidden xl:table-cell text-right text-sm py-2">R$ {m.cost.toFixed(2)}</TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-1">{getStatusIcon(m.status)}<span className="text-xs">{MAINTENANCE_STATUS_LABELS[m.status]}</span></div>
                            </TableCell>
                            {isAdmin() && !isReadOnly && (
                              <TableCell className="py-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setMaintenanceToDelete(m)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Vehicle Dialog */}
        <Dialog open={vehicleDialogOpen} onOpenChange={(open) => !open && handleCloseVehicleDialog()}>
          <DialogContent className="max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">{vehicleToEdit ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">{vehicleToEdit ? 'Atualize os dados do veículo' : 'Cadastre um novo veículo na frota'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Placa *</Label><Input placeholder="ABC-1234" value={vehicleForm.plate} onChange={e => setVehicleForm({...vehicleForm, plate: e.target.value.toUpperCase()})} /></div>
                <div><Label>Combustível</Label><Select value={vehicleForm.fuel_type} onValueChange={v => setVehicleForm({...vehicleForm, fuel_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="flex">Flex</SelectItem><SelectItem value="gasolina">Gasolina</SelectItem><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="eletrico">Elétrico</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Marca *</Label><Input placeholder="Toyota" value={vehicleForm.brand} onChange={e => setVehicleForm({...vehicleForm, brand: e.target.value})} /></div>
                <div><Label>Modelo *</Label><Input placeholder="Hilux" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><Label>Nº Frota</Label><Input placeholder="78" value={vehicleForm.fleet_number} onChange={e => setVehicleForm({...vehicleForm, fleet_number: e.target.value})} /></div>
                <div><Label>Ano</Label><Input type="number" placeholder="2024" value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year: e.target.value})} /></div>
                <div><Label>Cor</Label><Input placeholder="Branco" value={vehicleForm.color} onChange={e => setVehicleForm({...vehicleForm, color: e.target.value})} /></div>
                <div><Label>KM Atual</Label><Input type="number" value={vehicleForm.current_km} onChange={e => setVehicleForm({...vehicleForm, current_km: e.target.value})} /></div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={handleCloseVehicleDialog}>Cancelar</Button>
                {vehicleToEdit ? (
                  <Button onClick={handleUpdateVehicle} disabled={updateVehicle.isPending}>
                    {updateVehicle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                  </Button>
                ) : (
                  <Button onClick={handleCreateVehicle} disabled={createVehicle.isPending}>
                    {createVehicle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cadastrar'}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Maintenance Dialog */}
        <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">Nova Manutenção</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">Registre uma manutenção</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Veículo *</Label><Select value={maintenanceForm.vehicle_id} onValueChange={v => setMaintenanceForm({...maintenanceForm, vehicle_id: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Tipo</Label><Select value={maintenanceForm.maintenance_type} onValueChange={v => setMaintenanceForm({...maintenanceForm, maintenance_type: v as MaintenanceType})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="preventiva">Preventiva</SelectItem><SelectItem value="corretiva">Corretiva</SelectItem></SelectContent></Select></div>
                <div><Label>Data Agendada</Label><Input type="date" value={maintenanceForm.scheduled_date} onChange={e => setMaintenanceForm({...maintenanceForm, scheduled_date: e.target.value})} /></div>
              </div>
              <div><Label>Descrição *</Label><Textarea placeholder="Descreva a manutenção..." value={maintenanceForm.description} onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})} /></div>
              <div><Label>Custo Estimado (R$)</Label><Input type="number" step="0.01" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({...maintenanceForm, cost: e.target.value})} /></div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateMaintenance} disabled={createMaintenance.isPending}>
                  {createMaintenance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fuel Dialog */}
        <Dialog open={fuelDialogOpen} onOpenChange={setFuelDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">Novo Abastecimento</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">Registre um abastecimento</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Veículo *</Label><Select value={fuelForm.vehicle_id} onValueChange={v => setFuelForm({...fuelForm, vehicle_id: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Fornecedor</Label><Select value={fuelForm.supplier_id} onValueChange={v => setFuelForm({...fuelForm, supplier_id: v})}><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger><SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Data *</Label><Input type="date" value={fuelForm.date} onChange={e => setFuelForm({...fuelForm, date: e.target.value})} /></div>
                <div><Label>KM no Abastecimento *</Label><Input type="number" placeholder="Ex: 50000" value={fuelForm.km_at_fill} onChange={e => setFuelForm({...fuelForm, km_at_fill: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Litros *</Label><Input type="number" step="0.01" placeholder="45.5" value={fuelForm.liters} onChange={e => setFuelForm({...fuelForm, liters: e.target.value})} /></div>
                <div><Label>R$/L *</Label><Input type="number" step="0.01" placeholder="5.89" value={fuelForm.price_per_liter} onChange={e => setFuelForm({...fuelForm, price_per_liter: e.target.value})} /></div>
                <div><Label>Total</Label><Input disabled value={fuelForm.liters && fuelForm.price_per_liter ? `R$ ${(parseFloat(fuelForm.liters) * parseFloat(fuelForm.price_per_liter)).toFixed(2)}` : 'R$ 0,00'} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Combustível</Label><Select value={fuelForm.fuel_type} onValueChange={v => setFuelForm({...fuelForm, fuel_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gasolina">Gasolina</SelectItem><SelectItem value="etanol">Etanol</SelectItem><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="gnv">GNV</SelectItem></SelectContent></Select></div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox id="full_tank" checked={fuelForm.full_tank} onCheckedChange={(c) => setFuelForm({...fuelForm, full_tank: !!c})} />
                  <Label htmlFor="full_tank">Tanque cheio</Label>
                </div>
              </div>
              <div><Label>Observações</Label><Textarea placeholder="Observações opcionais..." value={fuelForm.notes} onChange={e => setFuelForm({...fuelForm, notes: e.target.value})} /></div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setFuelDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateFuelLog} disabled={createFuelLog.isPending}>
                  {createFuelLog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Maintenance Dialog */}
        <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
          <DialogContent>
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4"><DialogTitle className="text-primary-foreground">Nova Manutenção</DialogTitle><DialogDescription className="text-primary-foreground/80">Registre uma manutenção</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div><Label>Veículo *</Label><Select value={maintenanceForm.vehicle_id} onValueChange={v => setMaintenanceForm({...maintenanceForm, vehicle_id: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tipo</Label><Select value={maintenanceForm.maintenance_type} onValueChange={v => setMaintenanceForm({...maintenanceForm, maintenance_type: v as MaintenanceType})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="preventiva">Preventiva</SelectItem><SelectItem value="corretiva">Corretiva</SelectItem></SelectContent></Select></div>
                <div><Label>Data Agendada</Label><Input type="date" value={maintenanceForm.scheduled_date} onChange={e => setMaintenanceForm({...maintenanceForm, scheduled_date: e.target.value})} /></div>
              </div>
              <div><Label>Descrição *</Label><Textarea placeholder="Descreva a manutenção..." value={maintenanceForm.description} onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})} /></div>
              <div><Label>Custo Estimado (R$)</Label><Input type="number" step="0.01" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({...maintenanceForm, cost: e.target.value})} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateMaintenance} disabled={createMaintenance.isPending}>{createMaintenance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}</Button></div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fuel Dialog */}
        <Dialog open={fuelDialogOpen} onOpenChange={setFuelDialogOpen}>
          <DialogContent>
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4"><DialogTitle className="text-primary-foreground">Novo Abastecimento</DialogTitle><DialogDescription className="text-primary-foreground/80">Registre um abastecimento</DialogDescription></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Veículo *</Label><Select value={fuelForm.vehicle_id} onValueChange={v => setFuelForm({...fuelForm, vehicle_id: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Fornecedor</Label><Select value={fuelForm.supplier_id} onValueChange={v => setFuelForm({...fuelForm, supplier_id: v})}><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger><SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data *</Label><Input type="date" value={fuelForm.date} onChange={e => setFuelForm({...fuelForm, date: e.target.value})} /></div>
                <div><Label>KM no Abastecimento *</Label><Input type="number" placeholder="Ex: 50000" value={fuelForm.km_at_fill} onChange={e => setFuelForm({...fuelForm, km_at_fill: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Litros *</Label><Input type="number" step="0.01" placeholder="Ex: 45.5" value={fuelForm.liters} onChange={e => setFuelForm({...fuelForm, liters: e.target.value})} /></div>
                <div><Label>R$/Litro *</Label><Input type="number" step="0.01" placeholder="Ex: 5.89" value={fuelForm.price_per_liter} onChange={e => setFuelForm({...fuelForm, price_per_liter: e.target.value})} /></div>
                <div><Label>Total</Label><Input disabled value={fuelForm.liters && fuelForm.price_per_liter ? `R$ ${(parseFloat(fuelForm.liters) * parseFloat(fuelForm.price_per_liter)).toFixed(2)}` : 'R$ 0,00'} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Combustível</Label><Select value={fuelForm.fuel_type} onValueChange={v => setFuelForm({...fuelForm, fuel_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gasolina">Gasolina</SelectItem><SelectItem value="etanol">Etanol</SelectItem><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="gnv">GNV</SelectItem></SelectContent></Select></div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox id="full_tank" checked={fuelForm.full_tank} onCheckedChange={(c) => setFuelForm({...fuelForm, full_tank: !!c})} />
                  <Label htmlFor="full_tank">Tanque cheio</Label>
                </div>
              </div>
              <div><Label>Observações</Label><Textarea placeholder="Observações opcionais..." value={fuelForm.notes} onChange={e => setFuelForm({...fuelForm, notes: e.target.value})} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setFuelDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateFuelLog} disabled={createFuelLog.isPending}>{createFuelLog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}</Button></div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Vehicle Confirmation */}
        <AlertDialog open={!!vehicleToDelete} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir veículo?</AlertDialogTitle>
              <AlertDialogDescription>
                O veículo "{vehicleToDelete?.plate} - {vehicleToDelete?.brand} {vehicleToDelete?.model}" será removido do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteVehicle} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Maintenance Confirmation */}
        <AlertDialog open={!!maintenanceToDelete} onOpenChange={(open) => !open && setMaintenanceToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir manutenção?</AlertDialogTitle>
              <AlertDialogDescription>
                A manutenção "{maintenanceToDelete?.description}" será removida do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMaintenance} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Fuel Log Confirmation */}
        <AlertDialog open={!!fuelLogToDelete} onOpenChange={(open) => !open && setFuelLogToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir abastecimento?</AlertDialogTitle>
              <AlertDialogDescription>
                O registro de abastecimento de {fuelLogToDelete?.liters.toFixed(2)}L em {fuelLogToDelete?.date ? new Date(fuelLogToDelete.date).toLocaleDateString('pt-BR') : ''} será removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteFuelLog} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Print Fuel Order Dialog (from fuel log) */}
        <Dialog open={!!fuelLogToPrint} onOpenChange={(open) => !open && setFuelLogToPrint(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">Ordem de Abastecimento</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">Visualize e imprima a ordem de abastecimento</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div ref={fuelLogPrintRef}>
                {fuelLogToPrint && fuelLogToPrint.vehicle && (
                  <FuelOrderReport
                    vehicle={fuelLogToPrint.vehicle}
                    fuelLog={fuelLogToPrint}
                    orderNumber={getFuelLogOrderNumber(fuelLogToPrint)}
                  />
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setFuelLogToPrint(null)}>Fechar</Button>
                <Button onClick={handlePrintFuelOrder}><Printer className="h-4 w-4 mr-2" />Imprimir</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Print Fuel Order Dialog (from vehicle) */}
        <Dialog open={!!vehicleToPrint} onOpenChange={(open) => { if (!open) { setVehicleToPrint(null); setSelectedFuelLogForPrint(null); } }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
              <DialogTitle className="text-primary-foreground">Ordem de Abastecimento</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">Relatório de abastecimento</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {vehicleToPrint && (
                <>
                  <div ref={vehiclePrintRef}>
                    <FuelOrderReport
                      vehicle={vehicleToPrint}
                      fuelLog={selectedFuelLogForPrint || undefined}
                      orderNumber={selectedFuelLogForPrint ? getFuelLogOrderNumber(selectedFuelLogForPrint) : Date.now()}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => { setVehicleToPrint(null); setSelectedFuelLogForPrint(null); }}>Fechar</Button>
                    <Button onClick={handlePrintFuelOrder}><Printer className="h-4 w-4 mr-2" />Imprimir</Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}