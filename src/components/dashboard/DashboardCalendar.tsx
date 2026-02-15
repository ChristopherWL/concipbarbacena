import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarDays, List, Plus, Bell, Trash2, MapPin, Repeat, User, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useBranchFilter } from '@/hooks/useBranchFilter';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminder_date: string;
  reminder_time?: string;
  type: string;
  priority?: 'baixa' | 'media' | 'alta' | 'urgente';
  location?: string;
  is_active: boolean;
  sector?: string;
  is_recurring?: boolean;
  recurrence_type?: string;
  assigned_user_id?: string;
  assigned_role?: string;
  user_id?: string;
}

interface CalendarEvent {
  type: 'maintenance' | 'service_order' | 'movement' | 'obra' | 'diario';
  date: Date;
  id: string;
  title: string;
  priority?: string;
}

interface DashboardCalendarProps {
  sector?: 'overview' | 'vendas' | 'rh' | 'frota' | 'estoque' | 'servico' | 'obras';
}

const SECTOR_LABELS: Record<string, string> = {
  overview: 'Visão Geral',
  vendas: 'Vendas',
  rh: 'Recursos Humanos',
  frota: 'Frota',
  estoque: 'Estoque',
  servico: 'Serviço',
  obras: 'Obras',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuário',
  technician: 'Técnico',
};

const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

// Calendar event colors
const EVENT_COLORS = {
  maintenance: 'bg-cyan-500',
  service_order: 'bg-amber-500',
  movement: 'bg-blue-500',
  obra: 'bg-purple-500',
  diario: 'bg-emerald-500',
};

const PRIORITY_LINE_COLORS = {
  baixa: 'bg-muted-foreground',
  media: 'bg-blue-500',
  alta: 'bg-warning',
  urgente: 'bg-destructive',
};

export function DashboardCalendar({ sector = 'overview' }: DashboardCalendarProps) {
  const queryClient = useQueryClient();
  const { user, tenant, isSuperAdmin, isAdmin } = useAuthContext();
  const { permissions } = useUserPermissions();
  const { branchId, shouldFilter } = useBranchFilter();
  const [showAgenda, setShowAgenda] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDayDialog, setShowDayDialog] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    time: '09:00',
    type: 'reminder',
    priority: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    location: '',
    sector: sector as 'overview' | 'vendas' | 'rh' | 'frota' | 'estoque' | 'servico' | 'obras',
    is_recurring: false,
    recurrence_type: 'weekly',
    assigned_user_id: '',
    assigned_role: '',
  });

  // Get current user's role
  const { data: currentUserRole } = useQuery({
    queryKey: ['current-user-role', user?.id, tenant?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.id) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant.id)
        .maybeSingle();
      if (error) return null;
      return data?.role || null;
    },
    enabled: !!user?.id && !!tenant?.id,
  });

  // Check if user is admin/superadmin
  const isAdminOrSuper = isSuperAdmin() || isAdmin();

  // Fetch users for assignment
  const { data: tenantUsers = [] } = useQuery({
    queryKey: ['tenant-users', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Fetch available roles
  const { data: availableRoles = [] } = useQuery({
    queryKey: ['available-roles', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('tenant_id', tenant.id);
      if (error) throw error;
      const uniqueRoles = [...new Set(data?.map(r => r.role) || [])];
      return uniqueRoles;
    },
    enabled: !!tenant?.id,
  });

  // Fetch reminders filtered by sector AND assignment (user or role)
  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', tenant?.id, sector, user?.id, currentUserRole, isAdminOrSuper],
    queryFn: async () => {
      if (!tenant?.id || !user?.id) return [];
      
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .eq('sector', sector)
        .order('reminder_date', { ascending: true });
      
      if (error) throw error;
      
      // Filter reminders based on assignment
      // Admin/superadmin see all reminders
      if (isAdminOrSuper) {
        return data as Reminder[];
      }
      
      // Regular users see reminders:
      // 1. Created by themselves (user_id matches)
      // 2. Assigned to them specifically (assigned_user_id matches)
      // 3. Assigned to their role (assigned_role matches)
      // 4. No assignment (available to all)
      return (data as Reminder[]).filter(reminder => {
        // Created by this user
        if (reminder.user_id === user.id) return true;
        
        // Assigned specifically to this user
        if (reminder.assigned_user_id === user.id) return true;
        
        // Assigned to user's role
        if (currentUserRole && reminder.assigned_role === currentUserRole) return true;
        
        // No specific assignment (public within the sector)
        if (!reminder.assigned_user_id && !reminder.assigned_role) return true;
        
        return false;
      });
    },
    enabled: !!tenant?.id && !!user?.id,
  });

  // Calendar events
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Check permission-based visibility for calendar events
  const canViewFleet = permissions.page_fleet;
  const canViewServiceOrders = permissions.page_service_orders;
  const canViewStock = permissions.page_stock || permissions.page_movimentacao;
  const canViewObras = permissions.page_obras;
  const canViewDiario = permissions.page_diario_obras;

  const { data: maintenances = [] } = useQuery({
    queryKey: ['calendar-maintenances', tenant?.id, format(monthStart, 'yyyy-MM'), branchId],
    queryFn: async () => {
      if (!tenant?.id || !canViewFleet) return [];
      let query = supabase
        .from('maintenances')
        .select('id, scheduled_date, description, vehicle_id')
        .eq('tenant_id', tenant.id)
        .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'));
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      } else {
        query = query.not('branch_id', 'is', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id && canViewFleet,
  });

  const { data: serviceOrders = [] } = useQuery({
    queryKey: ['calendar-service-orders', tenant?.id, format(monthStart, 'yyyy-MM'), branchId],
    queryFn: async () => {
      if (!tenant?.id || !canViewServiceOrders) return [];
      let query = supabase
        .from('service_orders')
        .select('id, scheduled_date, title, priority')
        .eq('tenant_id', tenant.id)
        .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'));
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      } else {
        query = query.not('branch_id', 'is', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id && canViewServiceOrders,
  });

  const { data: stockMovements = [] } = useQuery({
    queryKey: ['calendar-movements', tenant?.id, format(monthStart, 'yyyy-MM'), branchId],
    queryFn: async () => {
      if (!tenant?.id || !canViewStock) return [];
      let query = supabase
        .from('stock_movements')
        .select('id, created_at, movement_type, reason')
        .eq('tenant_id', tenant.id)
        .gte('created_at', format(monthStart, 'yyyy-MM-dd'))
        .lte('created_at', format(addDays(monthEnd, 1), 'yyyy-MM-dd'));
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      } else {
        query = query.not('branch_id', 'is', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id && canViewStock,
  });

  const { data: obras = [] } = useQuery({
    queryKey: ['calendar-obras', tenant?.id, format(monthStart, 'yyyy-MM'), branchId],
    queryFn: async () => {
      if (!tenant?.id || !canViewObras) return [];
      let query = supabase
        .from('obras')
        .select('id, data_inicio, nome')
        .eq('tenant_id', tenant.id)
        .gte('data_inicio', format(monthStart, 'yyyy-MM-dd'))
        .lte('data_inicio', format(monthEnd, 'yyyy-MM-dd'));
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      } else {
        query = query.not('branch_id', 'is', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id && canViewObras,
  });

  const { data: diarioObras = [] } = useQuery({
    queryKey: ['calendar-diario', tenant?.id, format(monthStart, 'yyyy-MM'), branchId],
    queryFn: async () => {
      if (!tenant?.id || !canViewDiario) return [];
      let query = supabase
        .from('diario_obras')
        .select('id, data, atividades_realizadas')
        .eq('tenant_id', tenant.id)
        .gte('data', format(monthStart, 'yyyy-MM-dd'))
        .lte('data', format(monthEnd, 'yyyy-MM-dd'));
      
      if (shouldFilter && branchId) {
        query = query.eq('branch_id', branchId);
      } else {
        query = query.not('branch_id', 'is', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id && canViewDiario,
  });

  // Build calendar events map
  const calendarEventsMap = useMemo(() => {
    const map = new Map<string, { events: Set<CalendarEvent['type']>; items: CalendarEvent[] }>();
    
    const addEvent = (dateStr: string, event: CalendarEvent) => {
      if (!dateStr) return;
      const key = format(new Date(dateStr), 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, { events: new Set(), items: [] });
      }
      const entry = map.get(key)!;
      entry.events.add(event.type);
      entry.items.push(event);
    };

    // Only add events if user has permission
    if (canViewFleet) {
      maintenances.forEach(m => {
        if (m.scheduled_date) {
          addEvent(m.scheduled_date, {
            type: 'maintenance',
            date: new Date(m.scheduled_date),
            id: m.id,
            title: m.description || 'Manutenção',
          });
        }
      });
    }

    if (canViewServiceOrders) {
      serviceOrders.forEach(so => {
        if (so.scheduled_date) {
          addEvent(so.scheduled_date, {
            type: 'service_order',
            date: new Date(so.scheduled_date),
            id: so.id,
            title: so.title || 'OS',
            priority: so.priority,
          });
        }
      });
    }

    if (canViewStock) {
      stockMovements.forEach(sm => {
        if (sm.created_at) {
          const dateStr = format(new Date(sm.created_at), 'yyyy-MM-dd');
          addEvent(dateStr, {
            type: 'movement',
            date: new Date(sm.created_at),
            id: sm.id,
            title: sm.reason || sm.movement_type,
          });
        }
      });
    }

    if (canViewObras) {
      obras.forEach(o => {
        if (o.data_inicio) {
          addEvent(o.data_inicio, {
            type: 'obra',
            date: new Date(o.data_inicio),
            id: o.id,
            title: o.nome || 'Obra',
          });
        }
      });
    }

    if (canViewDiario) {
      diarioObras.forEach(d => {
        if (d.data) {
          addEvent(d.data, {
            type: 'diario',
            date: new Date(d.data),
            id: d.id,
            title: d.atividades_realizadas?.substring(0, 50) || 'Diário de Obra',
          });
        }
      });
    }

    return map;
  }, [maintenances, serviceOrders, stockMovements, obras, diarioObras, canViewFleet, canViewServiceOrders, canViewStock, canViewObras, canViewDiario]);

  // Create reminder mutation
  const createReminder = useMutation({
    mutationFn: async (data: typeof reminderForm & { date: Date }) => {
      if (!tenant?.id || !user?.id) throw new Error('Não autenticado');
      
      const { error } = await supabase
        .from('reminders')
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          reminder_date: format(data.date, 'yyyy-MM-dd'),
          reminder_time: data.time || null,
          type: data.type,
          priority: data.priority,
          location: data.location || null,
          sector: data.sector,
          is_recurring: data.is_recurring,
          recurrence_type: data.is_recurring ? data.recurrence_type : null,
          assigned_user_id: data.assigned_user_id || null,
          assigned_role: data.assigned_role || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Lembrete criado com sucesso');
      setShowReminderForm(false);
      setReminderForm({ 
        title: '', 
        description: '', 
        time: '09:00', 
        type: 'reminder', 
        priority: 'media', 
        location: '', 
        sector,
        is_recurring: false,
        recurrence_type: 'weekly',
        assigned_user_id: '',
        assigned_role: '',
      });
    },
    onError: (error) => {
      toast.error('Erro ao criar lembrete: ' + error.message);
    },
  });

  // Delete reminder mutation
  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Lembrete removido');
    },
  });

  // Calendar helpers
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();

  const getRemindersForDay = (day: Date) => {
    return reminders.filter(r => isSameDay(new Date(r.reminder_date), day));
  };

  const getEventsForDay = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    return calendarEventsMap.get(key) || { events: new Set(), items: [] };
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setShowDayDialog(true);
    setShowReminderForm(false);
  };

  const handleCreateReminder = () => {
    if (!selectedDay || !reminderForm.title) return;
    createReminder.mutate({ ...reminderForm, date: selectedDay });
  };

  // Get upcoming reminders for agenda view
  const upcomingReminders = reminders
    .filter(r => new Date(r.reminder_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .slice(0, 10);

  // Build dynamic legend based on permissions
  const legendItems = useMemo(() => {
    const items = [];
    if (canViewFleet) items.push({ color: 'bg-cyan-500', label: 'Manutenção' });
    if (canViewServiceOrders) items.push({ color: 'bg-amber-500', label: 'OS' });
    if (canViewStock) items.push({ color: 'bg-blue-500', label: 'Movimentação' });
    if (canViewObras) items.push({ color: 'bg-purple-500', label: 'Obra' });
    if (canViewDiario) items.push({ color: 'bg-emerald-500', label: 'Diário' });
    return items;
  }, [canViewFleet, canViewServiceOrders, canViewStock, canViewObras, canViewDiario]);

  return (
    <>
      <Card className="futuristic-card rounded-xl">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold capitalize text-primary">
                {showAgenda ? 'Agenda' : format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <CardDescription className="text-xs">
                {showAgenda ? SECTOR_LABELS[sector] : 'Clique em um dia para ver detalhes'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {!showAgenda && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    <span className="text-lg">‹</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    <span className="text-lg">›</span>
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowAgenda(!showAgenda)}
              >
                {showAgenda ? (
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <List className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4">
          {showAgenda ? (
            // Agenda View
            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {upcomingReminders.length > 0 ? (
                upcomingReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(reminder.reminder_date), "dd 'de' MMMM", { locale: ptBR })}
                        {reminder.reminder_time && ` às ${reminder.reminder_time}`}
                      </p>
                      {reminder.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {reminder.location}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {isToday(new Date(reminder.reminder_date)) ? 'Hoje' : format(new Date(reminder.reminder_date), 'dd/MM')}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                    <CalendarDays className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhum lembrete agendado</p>
                </div>
              )}
            </div>
          ) : (
            // Calendar View
            <div className="space-y-3">
              {/* Days of week header */}
              <div className="grid grid-cols-7 text-center border-b border-border/50 pb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
                  <div key={i} className="text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10" />
                ))}
                {/* Actual days */}
                {daysInMonth.map((day) => {
                  const dayReminders = getRemindersForDay(day);
                  const hasReminders = dayReminders.length > 0;
                  const dayEvents = getEventsForDay(day);
                  const eventTypes = Array.from(dayEvents.events);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        'h-10 w-full flex flex-col items-center justify-center rounded-lg text-sm cursor-pointer transition-all relative',
                        isToday(day)
                          ? 'bg-primary text-primary-foreground font-bold shadow-md'
                          : 'hover:bg-muted border border-transparent hover:border-border/50'
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                      
                      {/* Event dots */}
                      {eventTypes.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {eventTypes.slice(0, 3).map((eventType) => (
                            <div 
                              key={eventType} 
                              className={cn('w-1.5 h-1.5 rounded-full', EVENT_COLORS[eventType])} 
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Reminder indicator */}
                      {hasReminders && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              {legendItems.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-3 border-t border-border/50">
                  {legendItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className={cn('w-2 h-2 rounded-full', item.color)} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Details Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="sm:max-w-md border-border/50 shadow-sm bg-card">
          <DialogHeader className="bg-primary rounded-t-lg p-4 -mx-6 -mt-6 mb-4">
            <DialogTitle className="capitalize text-primary-foreground">
              {selectedDay && format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              {isToday(selectedDay!) ? 'Hoje' : selectedDay && format(selectedDay, 'dd/MM/yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          {!showReminderForm ? (
            <div className="space-y-4">
              {/* Events for this day */}
              {selectedDay && getEventsForDay(selectedDay).items.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-muted-foreground">Eventos do dia</p>
                  <div className="space-y-1.5">
                    {getEventsForDay(selectedDay).items.slice(0, 5).map((event) => (
                      <div key={`${event.type}-${event.id}`} className="flex items-center gap-2 text-xs">
                        <div className={cn('w-2 h-2 rounded-full', EVENT_COLORS[event.type])} />
                        <span className="font-medium capitalize">{event.type.replace('_', ' ')}:</span>
                        <span className="text-muted-foreground truncate">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Reminders for this day */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Lembretes</p>
                {selectedDay && getRemindersForDay(selectedDay).length > 0 ? (
                  getRemindersForDay(selectedDay).map((reminder) => (
                    <div key={reminder.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={cn('w-1 h-full rounded-full self-stretch', PRIORITY_LINE_COLORS[reminder.priority || 'media'])} />
                      <Bell className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{reminder.title}</p>
                        {reminder.reminder_time && (
                          <p className="text-xs text-muted-foreground">às {reminder.reminder_time}</p>
                        )}
                        {reminder.description && (
                          <p className="text-xs text-muted-foreground mt-1">{reminder.description}</p>
                        )}
                        {reminder.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {reminder.location}
                          </p>
                        )}
                        {/* Show assignment info */}
                        {(reminder.assigned_user_id || reminder.assigned_role) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            {reminder.assigned_user_id ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                            {reminder.assigned_user_id 
                              ? tenantUsers.find(u => u.id === reminder.assigned_user_id)?.full_name || 'Usuário'
                              : ROLE_LABELS[reminder.assigned_role || ''] || reminder.assigned_role
                            }
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteReminder.mutate(reminder.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nenhum lembrete para este dia
                  </div>
                )}
              </div>
              
              <Button onClick={() => setShowReminderForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Criar Lembrete
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto -mr-6 pr-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome do lembrete"
                />
              </div>
              
              {/* Sector Selection */}
              <div className="space-y-2">
                <Label htmlFor="sector">Setor</Label>
                <Select
                  value={reminderForm.sector}
                  onValueChange={(v) => setReminderForm(prev => ({ ...prev, sector: v as typeof reminderForm.sector }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SECTOR_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={reminderForm.time}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={reminderForm.priority}
                    onValueChange={(v) => setReminderForm(prev => ({ ...prev, priority: v as typeof reminderForm.priority }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                          Baixa
                        </div>
                      </SelectItem>
                      <SelectItem value="media">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          Média
                        </div>
                      </SelectItem>
                      <SelectItem value="alta">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-warning" />
                          Alta
                        </div>
                      </SelectItem>
                      <SelectItem value="urgente">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-destructive" />
                          Urgente
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recurring Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="is_recurring" className="text-sm font-normal cursor-pointer">
                    Lembrete recorrente
                  </Label>
                </div>
                <Switch
                  id="is_recurring"
                  checked={reminderForm.is_recurring}
                  onCheckedChange={(checked) => setReminderForm(prev => ({ ...prev, is_recurring: checked }))}
                />
              </div>

              {/* Recurrence Type */}
              {reminderForm.is_recurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurrence_type">Frequência</Label>
                  <Select
                    value={reminderForm.recurrence_type}
                    onValueChange={(v) => setReminderForm(prev => ({ ...prev, recurrence_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECURRENCE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Assign to User */}
              <div className="space-y-2">
                <Label htmlFor="assigned_user" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Atribuir a Usuário
                </Label>
                <Select
                  value={reminderForm.assigned_user_id || "none"}
                  onValueChange={(v) => setReminderForm(prev => ({ ...prev, assigned_user_id: v === "none" ? "" : v, assigned_role: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {tenantUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assign to Role */}
              <div className="space-y-2">
                <Label htmlFor="assigned_role" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Atribuir a Perfil
                </Label>
                <Select
                  value={reminderForm.assigned_role || "none"}
                  onValueChange={(v) => setReminderForm(prev => ({ ...prev, assigned_role: v === "none" ? "" : v, assigned_user_id: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role] || role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={reminderForm.location}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Endereço ou local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={reminderForm.description}
                  onChange={(e) => setReminderForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalhes do lembrete"
                  rows={2}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowReminderForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateReminder} disabled={!reminderForm.title || createReminder.isPending}>
                  Salvar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
