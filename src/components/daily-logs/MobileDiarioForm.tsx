import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Plus, Trash2, BookOpen, Sun, Cloud, CloudRain, CloudSun, Users, ClipboardList, CheckCircle, Calendar, ChevronDown, PenTool } from 'lucide-react';
import { SignaturePad } from '@/components/ui/signature-pad';
import { MobileFormWizard, WizardStep } from '@/components/ui/mobile-form-wizard';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface TeamMember {
  nome: string;
  funcao: string;
  assinatura?: string;
}

interface TeamData {
  id: string;
  name: string;
  vehicle?: {
    model: string;
    brand: string;
    plate: string;
  } | null;
  members: { name: string; position: string }[];
}

interface DiarioFormData {
  data: string;
  clima_manha: string;
  clima_tarde: string;
  clima_noite: string;
  equipe_manha: string;
  veiculo_manha: string;
  placa_manha: string;
  motorista_manha: string;
  km_ida_manha: string;
  km_volta_manha: string;
  hora_inicio_manha: string;
  hora_fim_manha: string;
  km_rodado_manha: string;
  equipe_tarde: string;
  veiculo_tarde: string;
  placa_tarde: string;
  motorista_tarde: string;
  km_ida_tarde: string;
  km_volta_tarde: string;
  hora_inicio_tarde: string;
  hora_fim_tarde: string;
  km_rodado_tarde: string;
  responsavel_entrega_materiais: string;
  responsavel_devolucao_materiais: string;
  materiais_utilizados: string;
  atividades_realizadas: string;
  ocorrencias: string;
  observacao_fiscalizacao: string;
  equipe_assinaturas: TeamMember[];
  equipe_presente: number;
}

interface MobileDiarioFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DiarioFormData) => Promise<void>;
  isSubmitting: boolean;
}

const initialFormData: DiarioFormData = {
  data: new Date().toISOString().split('T')[0],
  clima_manha: "",
  clima_tarde: "",
  clima_noite: "",
  equipe_manha: "",
  veiculo_manha: "",
  placa_manha: "",
  motorista_manha: "",
  km_ida_manha: "",
  km_volta_manha: "",
  hora_inicio_manha: "08:00",
  hora_fim_manha: "12:00",
  km_rodado_manha: "",
  equipe_tarde: "",
  veiculo_tarde: "",
  placa_tarde: "",
  motorista_tarde: "",
  km_ida_tarde: "",
  km_volta_tarde: "",
  hora_inicio_tarde: "13:00",
  hora_fim_tarde: "17:00",
  km_rodado_tarde: "",
  responsavel_entrega_materiais: "",
  responsavel_devolucao_materiais: "",
  materiais_utilizados: "",
  atividades_realizadas: "",
  ocorrencias: "",
  observacao_fiscalizacao: "",
  equipe_assinaturas: [],
  equipe_presente: 0,
};

const CLIMA_OPTIONS = [
  { value: 'bom', label: 'Bom', icon: Sun, color: 'text-yellow-500' },
  { value: 'nublado', label: 'Nublado', icon: Cloud, color: 'text-gray-500' },
  { value: 'chuva', label: 'Chuva', icon: CloudRain, color: 'text-blue-500' },
  { value: 'instavel', label: 'Instável', icon: CloudSun, color: 'text-orange-500' },
];

export function MobileDiarioForm({ open, onClose, onSubmit, isSubmitting }: MobileDiarioFormProps) {
  const [formData, setFormData] = useState<DiarioFormData>(initialFormData);
  const [newMember, setNewMember] = useState({ nome: '', funcao: '' });
  const [employees, setEmployees] = useState<{ id: string; name: string; position: string }[]>([]);
  const [userTeams, setUserTeams] = useState<TeamData[]>([]);
  const [selectedTeamManha, setSelectedTeamManha] = useState<string>("");
  const [selectedTeamTarde, setSelectedTeamTarde] = useState<string>("");
  const [showTeamDropdownManha, setShowTeamDropdownManha] = useState(false);
  const [showTeamDropdownTarde, setShowTeamDropdownTarde] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signingMemberIndex, setSigningMemberIndex] = useState<number | null>(null);
  
  const { user, tenant } = useAuthContext();

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.id || !tenant?.id) return;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();
      
      setIsAdmin(data?.role === 'admin' || data?.role === 'superadmin');
    };
    
    if (open) {
      checkAdminRole();
    }
  }, [open, user?.id, tenant?.id]);

  // Fetch user's teams
  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!user?.id) return;

      // First get the employee id for this user
      const { data: employee } = await supabase
        .from('employees')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!employee) return;

      // Get teams where the user is a member
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner (
            id,
            name,
            vehicle_id,
            vehicles (
              model,
              brand,
              plate
            )
          )
        `)
        .eq('employee_id', employee.id);

      // Also check if user is a team leader
      const { data: leaderTeams } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          vehicle_id,
          vehicles (
            model,
            brand,
            plate
          )
        `)
        .eq('leader_employee_id', employee.id)
        .eq('is_active', true);

      const teamsMap = new Map<string, TeamData>();

      // Process team memberships
      if (teamMemberships) {
        for (const membership of teamMemberships) {
          const team = membership.teams as any;
          if (team && !teamsMap.has(team.id)) {
            // Get team members
            const { data: members } = await supabase
              .from('team_members')
              .select(`
                employees (
                  name,
                  position
                )
              `)
              .eq('team_id', team.id);

            teamsMap.set(team.id, {
              id: team.id,
              name: team.name,
              vehicle: team.vehicles,
              members: members?.map((m: any) => ({
                name: m.employees?.name || '',
                position: m.employees?.position || ''
              })).filter((m: any) => m.name) || []
            });
          }
        }
      }

      // Process leader teams
      if (leaderTeams) {
        for (const team of leaderTeams) {
          if (!teamsMap.has(team.id)) {
            const { data: members } = await supabase
              .from('team_members')
              .select(`
                employees (
                  name,
                  position
                )
              `)
              .eq('team_id', team.id);

            teamsMap.set(team.id, {
              id: team.id,
              name: team.name,
              vehicle: team.vehicles as any,
              members: members?.map((m: any) => ({
                name: m.employees?.name || '',
                position: m.employees?.position || ''
              })).filter((m: any) => m.name) || []
            });
          }
        }
      }

      // Deduplicate teams (some tenants may have duplicated names)
      const teams = Array.from(teamsMap.values());

      const uniqueTeams = teams.reduce<TeamData[]>((acc, team) => {
        const key = team.name.trim().toLowerCase();
        const existingIndex = acc.findIndex(t => t.name.trim().toLowerCase() === key);
        if (existingIndex === -1) return [...acc, team];

        // Prefer the one that has vehicle info (more useful for auto-fill)
        const existing = acc[existingIndex];
        const existingScore = existing.vehicle ? 1 : 0;
        const nextScore = team.vehicle ? 1 : 0;
        if (nextScore > existingScore) {
          const copy = [...acc];
          copy[existingIndex] = team;
          return copy;
        }
        return acc;
      }, []);

      setUserTeams(uniqueTeams);

      // If user has only one team, auto-select it
      if (uniqueTeams.length === 1) {
        const team = uniqueTeams[0];
        setSelectedTeamManha(team.id);
        setSelectedTeamTarde(team.id);
        
        // Auto-fill vehicle data
        const vehicleModel = team.vehicle ? `${team.vehicle.brand || ''} ${team.vehicle.model || ''}`.trim() : '';
        const vehiclePlate = team.vehicle?.plate || '';
        
        // Find driver from team members based on position_categories
        let driverName = '';
        if (team.members.length > 0) {
          const { data: driverPositions } = await supabase
            .from('position_categories')
            .select('name')
            .eq('is_driver', true);
          
          const driverPositionNames = driverPositions?.map(p => p.name.toLowerCase()) || ['motorista'];
          const driver = team.members.find(m => 
            driverPositionNames.includes(m.position?.toLowerCase() || '')
          );
          if (driver) {
            driverName = driver.name;
          }
        }
        
        setFormData(prev => ({
          ...prev,
          equipe_manha: team.name,
          equipe_tarde: team.name,
          veiculo_manha: vehicleModel,
          veiculo_tarde: vehicleModel,
          placa_manha: vehiclePlate,
          placa_tarde: vehiclePlate,
          motorista_manha: driverName,
          motorista_tarde: driverName,
          equipe_assinaturas: team.members.map(m => ({
            nome: m.name,
            funcao: m.position || '-'
          }))
        }));
      }
    };

    if (open) {
      fetchUserTeams();
    }
  }, [open, user?.id]);

  // Fetch employees for manual member addition
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase
        .from('employees')
        .select('id, name, position')
        .eq('status', 'ativo')
        .order('name');
      if (data) setEmployees(data);
    };
    fetchEmployees();
  }, []);

  // Reset form when closing (not opening, to avoid resetting after team fetch)
  useEffect(() => {
    if (!open) {
      setFormData(initialFormData);
      setSelectedTeamManha("");
      setSelectedTeamTarde("");
      setUserTeams([]);
    }
  }, [open]);

  const handleTeamSelectManha = async (teamId: string) => {
    setSelectedTeamManha(teamId);
    const team = userTeams.find(t => t.id === teamId);
    if (team) {
      const vehicleModel = team.vehicle ? `${team.vehicle.brand || ''} ${team.vehicle.model || ''}`.trim() : '';
      
      // Fetch last report for this team to get motorista and km_volta
      const { data: lastReport } = await supabase
        .from('diario_obras')
        .select('motorista_manha, km_volta_manha')
        .eq('equipe_manha', team.name)
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Find driver from team members based on position_categories
      let driverName = lastReport?.motorista_manha || '';
      if (!driverName && team.members.length > 0) {
        // Get driver positions from position_categories
        const { data: driverPositions } = await supabase
          .from('position_categories')
          .select('name')
          .eq('is_driver', true);
        
        const driverPositionNames = driverPositions?.map(p => p.name.toLowerCase()) || ['motorista'];
        const driver = team.members.find(m => 
          driverPositionNames.includes(m.position?.toLowerCase() || '')
        );
        if (driver) {
          driverName = driver.name;
        }
      }

      setFormData(prev => ({
        ...prev,
        equipe_manha: team.name,
        veiculo_manha: vehicleModel,
        placa_manha: team.vehicle?.plate || '',
        motorista_manha: driverName,
        km_ida_manha: lastReport?.km_volta_manha || '',
      }));
    }
  };

  const handleTeamSelectTarde = async (teamId: string) => {
    setSelectedTeamTarde(teamId);
    const team = userTeams.find(t => t.id === teamId);
    if (team) {
      const vehicleModel = team.vehicle ? `${team.vehicle.brand || ''} ${team.vehicle.model || ''}`.trim() : '';
      
      // Fetch last report for this team to get motorista and km_volta
      const { data: lastReport } = await supabase
        .from('diario_obras')
        .select('motorista_tarde, km_volta_tarde')
        .eq('equipe_tarde', team.name)
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Find driver from team members based on position_categories
      let driverName = lastReport?.motorista_tarde || '';
      if (!driverName && team.members.length > 0) {
        // Get driver positions from position_categories
        const { data: driverPositions } = await supabase
          .from('position_categories')
          .select('name')
          .eq('is_driver', true);
        
        const driverPositionNames = driverPositions?.map(p => p.name.toLowerCase()) || ['motorista'];
        const driver = team.members.find(m => 
          driverPositionNames.includes(m.position?.toLowerCase() || '')
        );
        if (driver) {
          driverName = driver.name;
        }
      }

      setFormData(prev => ({
        ...prev,
        equipe_tarde: team.name,
        veiculo_tarde: vehicleModel,
        placa_tarde: team.vehicle?.plate || '',
        motorista_tarde: driverName,
        km_ida_tarde: lastReport?.km_volta_tarde || '',
      }));
    }
  };

  const loadTeamMembers = (teamId: string) => {
    const team = userTeams.find(t => t.id === teamId);
    if (team) {
      setFormData(prev => ({
        ...prev,
        equipe_assinaturas: team.members.map(m => ({
          nome: m.name,
          funcao: m.position || '-'
        }))
      }));
    }
  };

  const updateKmRodado = (turno: 'manha' | 'tarde', field: 'ida' | 'volta', value: string) => {
    const kmIdaField = turno === 'manha' ? 'km_ida_manha' : 'km_ida_tarde';
    const kmVoltaField = turno === 'manha' ? 'km_volta_manha' : 'km_volta_tarde';
    const kmRodadoField = turno === 'manha' ? 'km_rodado_manha' : 'km_rodado_tarde';
    
    const newData = { ...formData, [field === 'ida' ? kmIdaField : kmVoltaField]: value };
    const kmIda = field === 'ida' ? value : formData[kmIdaField];
    const kmVolta = field === 'volta' ? value : formData[kmVoltaField];
    
    if (kmIda && kmVolta) {
      newData[kmRodadoField] = String(Number(kmVolta) - Number(kmIda));
    }
    
    setFormData(newData);
  };

  const addTeamMember = () => {
    if (newMember.nome) {
      setFormData({
        ...formData,
        equipe_assinaturas: [...formData.equipe_assinaturas, { 
          nome: newMember.nome, 
          funcao: newMember.funcao || '-' 
        }],
      });
      setNewMember({ nome: '', funcao: '' });
    }
  };

  const removeTeamMember = (index: number) => {
    setFormData({
      ...formData,
      equipe_assinaturas: formData.equipe_assinaturas.filter((_, i) => i !== index),
    });
  };

  const handleSignature = (signatureDataUrl: string) => {
    if (signingMemberIndex !== null) {
      const updatedMembers = [...formData.equipe_assinaturas];
      updatedMembers[signingMemberIndex] = {
        ...updatedMembers[signingMemberIndex],
        assinatura: signatureDataUrl
      };
      setFormData({ ...formData, equipe_assinaturas: updatedMembers });
      setSigningMemberIndex(null);
    }
  };

  const allMembersSigned = formData.equipe_assinaturas.length > 0 && 
    formData.equipe_assinaturas.every(member => member.assinatura);

  const handleSubmit = async () => {
    if (!allMembersSigned) {
      return;
    }
    await onSubmit({
      ...formData,
      equipe_presente: formData.equipe_assinaturas.length || formData.equipe_presente,
    });
  };

  if (!open) return null;

  // Step 1: Data
  const step1Content = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Calendar className="h-5 w-5" />
        <span className="font-medium">Data do Registro</span>
      </div>
      
      <div className="space-y-2">
        <Label className="text-base">Data *</Label>
        <Input 
          type="date" 
          value={formData.data}
          onChange={(e) => setFormData({ ...formData, data: e.target.value })}
          className="h-12"
        />
      </div>
    </div>
  );

  // Step 2: Clima
  const step2Content = (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Selecione as condições climáticas de cada período</p>
      
      {['manha', 'tarde', 'noite'].map((periodo) => (
        <div key={periodo} className="space-y-2">
          <Label className="text-base capitalize">{periodo === 'manha' ? 'Manhã' : periodo === 'tarde' ? 'Tarde' : 'Noite'}</Label>
          <div className="grid grid-cols-4 gap-2">
            {CLIMA_OPTIONS.map((clima) => {
              const fieldName = `clima_${periodo}` as keyof DiarioFormData;
              const isSelected = formData[fieldName] === clima.value;
              return (
                <button
                  key={clima.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, [fieldName]: clima.value })}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                >
                  <clima.icon className={cn("h-6 w-6", clima.color)} />
                  <span className="text-xs">{clima.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Step 3: Turno Manhã
  const step3Content = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Sun className="h-5 w-5" />
        <span className="font-medium">Turno da Manhã</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 relative">
          <Label className="text-sm">Equipe</Label>
          <div className="relative">
            <Input 
              value={formData.equipe_manha}
              onChange={(e) => setFormData({ ...formData, equipe_manha: e.target.value })}
              onFocus={() => userTeams.length > 0 && setShowTeamDropdownManha(true)}
              placeholder="Nome da equipe"
              className="pr-8"
            />
            {userTeams.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTeamDropdownManha(!showTeamDropdownManha)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
            {showTeamDropdownManha && userTeams.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50">
                {userTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                    onClick={() => {
                      handleTeamSelectManha(team.id);
                      setShowTeamDropdownManha(false);
                    }}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Motorista</Label>
          <Input 
            value={formData.motorista_manha}
            onChange={(e) => setFormData({ ...formData, motorista_manha: e.target.value })}
            placeholder="Nome"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Veículo</Label>
          <Input 
            value={formData.veiculo_manha}
            onChange={(e) => setFormData({ ...formData, veiculo_manha: e.target.value })}
            placeholder="Modelo"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Placa</Label>
          <Input 
            value={formData.placa_manha}
            onChange={(e) => setFormData({ ...formData, placa_manha: e.target.value })}
            placeholder="ABC-1234"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">KM Ida</Label>
          <Input 
            type="number"
            value={formData.km_ida_manha}
            onChange={(e) => updateKmRodado('manha', 'ida', e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">KM Volta</Label>
          <Input 
            type="number"
            value={formData.km_volta_manha}
            onChange={(e) => updateKmRodado('manha', 'volta', e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">KM Rodado</Label>
          <Input 
            type="number"
            value={formData.km_rodado_manha}
            readOnly
            className="bg-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Hora Início</Label>
          <Input 
            type="time"
            value={formData.hora_inicio_manha}
            onChange={(e) => setFormData({ ...formData, hora_inicio_manha: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Hora Fim</Label>
          <Input 
            type="time"
            value={formData.hora_fim_manha}
            onChange={(e) => setFormData({ ...formData, hora_fim_manha: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  // Step 4: Turno Tarde
  const step4Content = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-orange-500">
        <CloudSun className="h-5 w-5" />
        <span className="font-medium">Turno da Tarde</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 relative">
          <Label className="text-sm">Equipe</Label>
          <div className="relative">
            <Input 
              value={formData.equipe_tarde}
              onChange={(e) => setFormData({ ...formData, equipe_tarde: e.target.value })}
              onFocus={() => userTeams.length > 0 && setShowTeamDropdownTarde(true)}
              placeholder="Nome da equipe"
              className="pr-8"
            />
            {userTeams.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTeamDropdownTarde(!showTeamDropdownTarde)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
            {showTeamDropdownTarde && userTeams.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50">
                {userTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                    onClick={() => {
                      handleTeamSelectTarde(team.id);
                      setShowTeamDropdownTarde(false);
                    }}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Motorista</Label>
          <Input 
            value={formData.motorista_tarde}
            onChange={(e) => setFormData({ ...formData, motorista_tarde: e.target.value })}
            placeholder="Nome"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Veículo</Label>
          <Input 
            value={formData.veiculo_tarde}
            onChange={(e) => setFormData({ ...formData, veiculo_tarde: e.target.value })}
            placeholder="Modelo"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Placa</Label>
          <Input 
            value={formData.placa_tarde}
            onChange={(e) => setFormData({ ...formData, placa_tarde: e.target.value })}
            placeholder="ABC-1234"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">KM Ida</Label>
          <Input 
            type="number"
            value={formData.km_ida_tarde}
            onChange={(e) => updateKmRodado('tarde', 'ida', e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">KM Volta</Label>
          <Input 
            type="number"
            value={formData.km_volta_tarde}
            onChange={(e) => updateKmRodado('tarde', 'volta', e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">KM Rodado</Label>
          <Input 
            type="number"
            value={formData.km_rodado_tarde}
            readOnly
            className="bg-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Hora Início</Label>
          <Input 
            type="time"
            value={formData.hora_inicio_tarde}
            onChange={(e) => setFormData({ ...formData, hora_inicio_tarde: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Hora Fim</Label>
          <Input 
            type="time"
            value={formData.hora_fim_tarde}
            onChange={(e) => setFormData({ ...formData, hora_fim_tarde: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  // Step 5: Materiais
  const step5Content = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Responsável pela Entrega dos Materiais</Label>
          <Input 
            value={formData.responsavel_entrega_materiais}
            onChange={(e) => setFormData({ ...formData, responsavel_entrega_materiais: e.target.value })}
            placeholder="Nome do responsável"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Responsável pela Devolução dos Materiais</Label>
          <Input 
            value={formData.responsavel_devolucao_materiais}
            onChange={(e) => setFormData({ ...formData, responsavel_devolucao_materiais: e.target.value })}
            placeholder="Nome do responsável"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-sm">Materiais Utilizados</Label>
        <Textarea 
          value={formData.materiais_utilizados}
          onChange={(e) => setFormData({ ...formData, materiais_utilizados: e.target.value })}
          placeholder="Descreva os materiais utilizados..."
          rows={4}
        />
      </div>
    </div>
  );

  // Step 6: Atividades
  const step6Content = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary mb-2">
        <ClipboardList className="h-5 w-5" />
        <span className="font-medium">Registro de Atividades</span>
      </div>

      <div className="space-y-1">
        <Label className="text-sm">Atividades Realizadas *</Label>
        <Textarea 
          value={formData.atividades_realizadas}
          onChange={(e) => setFormData({ ...formData, atividades_realizadas: e.target.value })}
          placeholder="Descreva as atividades realizadas no dia..."
          rows={4}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-sm">Ocorrências</Label>
        <Textarea 
          value={formData.ocorrencias}
          onChange={(e) => setFormData({ ...formData, ocorrencias: e.target.value })}
          placeholder="Registre quaisquer ocorrências..."
          rows={3}
        />
      </div>

      {isAdmin && (
        <div className="space-y-1">
          <Label className="text-sm">Observações da Fiscalização</Label>
          <Textarea 
            value={formData.observacao_fiscalizacao}
            onChange={(e) => setFormData({ ...formData, observacao_fiscalizacao: e.target.value })}
            placeholder="Observações do fiscal..."
            rows={3}
          />
        </div>
      )}
    </div>
  );

  // Step 7: Equipe
  const step7Content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-5 w-5" />
          <span className="font-medium">Equipe Presente</span>
        </div>
        {userTeams.length > 0 && selectedTeamManha && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => loadTeamMembers(selectedTeamManha)}
          >
            Carregar da Equipe
          </Button>
        )}
      </div>

      <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Nome</Label>
            <Select value={newMember.nome} onValueChange={(v) => setNewMember({ ...newMember, nome: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.name}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Função</Label>
            <Input 
              value={newMember.funcao}
              onChange={(e) => setNewMember({ ...newMember, funcao: e.target.value })}
              placeholder="Função"
            />
          </div>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={addTeamMember}
          className="w-full"
          disabled={!newMember.nome}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      <ScrollArea className="h-[250px] border rounded-lg">
        <div className="p-2 space-y-2">
          {formData.equipe_assinaturas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum membro adicionado</p>
          ) : (
            formData.equipe_assinaturas.map((member, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div>
                    <p className="font-medium text-sm">{member.nome}</p>
                    <p className="text-xs text-muted-foreground">{member.funcao}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.assinatura ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Assinado
                    </Badge>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSigningMemberIndex(index)}
                      className="gap-1"
                    >
                      <PenTool className="h-3 w-3" />
                      Assinar
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeTeamMember(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {formData.equipe_assinaturas.length > 0 && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg",
          allMembersSigned ? "bg-green-500/10" : "bg-orange-500/10"
        )}>
          {allMembersSigned ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Todas as assinaturas coletadas</span>
            </>
          ) : (
            <>
              <PenTool className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">
                {formData.equipe_assinaturas.filter(m => m.assinatura).length} de {formData.equipe_assinaturas.length} assinaturas
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );

  const wizardSteps: WizardStep[] = [
    { id: 'data', title: 'Data', content: step1Content },
    { id: 'clima', title: 'Clima', content: step2Content },
    { id: 'manha', title: 'Manhã', content: step3Content },
    { id: 'tarde', title: 'Tarde', content: step4Content },
    { id: 'materiais', title: 'Materiais', content: step5Content },
    { id: 'atividades', title: 'Atividades', content: step6Content },
    { id: 'equipe', title: 'Equipe', content: step7Content },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-hidden">
      <div className="px-4 py-4 flex items-center justify-between flex-shrink-0 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2 font-medium text-base flex-1 justify-center">
          <BookOpen className="w-5 h-5" />
          Novo Diário
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <MobileFormWizard
        steps={wizardSteps}
        onComplete={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        submitLabel="Salvar Diário"
        className="flex-1 min-h-0"
        canComplete={allMembersSigned}
      />

      <SignaturePad
        open={signingMemberIndex !== null}
        onClose={() => setSigningMemberIndex(null)}
        onSave={handleSignature}
        title={signingMemberIndex !== null ? `Assinatura: ${formData.equipe_assinaturas[signingMemberIndex]?.nome}` : 'Assinatura'}
      />
    </div>,
    document.body
  );
}
