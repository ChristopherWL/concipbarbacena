import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Calculator } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import type { ServiceProvider, PaymentType } from "@/types/serviceProviders";
import { PAYMENT_TYPE_LABELS } from "@/types/serviceProviders";
import { DateRange } from "react-day-picker";

interface ManualPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: ServiceProvider[];
  onSubmit: (data: {
    service_provider_id: string;
    period_start: string;
    period_end: string;
    payment_type: string;
    days_worked?: number;
    hours_worked?: number;
    rate_applied: number;
    description?: string;
    notes?: string;
  }) => Promise<void>;
}

export function ManualPaymentDialog({ open, onOpenChange, providers, onSubmit }: ManualPaymentDialogProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [paymentType, setPaymentType] = useState<PaymentType>("diaria");
  const [daysWorked, setDaysWorked] = useState<number>(0);
  const [hoursWorked, setHoursWorked] = useState<number>(0);
  const [rateApplied, setRateApplied] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  // Atualiza valores quando muda o prestador
  useEffect(() => {
    if (selectedProvider) {
      setPaymentType(selectedProvider.payment_type);
      switch (selectedProvider.payment_type) {
        case 'diaria':
          setRateApplied(selectedProvider.daily_rate || 0);
          break;
        case 'hora':
          setRateApplied(selectedProvider.hourly_rate || 0);
          break;
        case 'por_os':
          setRateApplied(selectedProvider.rate_per_os || 0);
          break;
        case 'mensal':
          setRateApplied(selectedProvider.monthly_rate || 0);
          break;
      }
    }
  }, [selectedProvider]);

  // Calcula dias automaticamente quando muda o período
  useEffect(() => {
    if (dateRange?.from && dateRange?.to && paymentType === 'diaria') {
      const days = differenceInDays(dateRange.to, dateRange.from) + 1;
      setDaysWorked(days);
    }
  }, [dateRange, paymentType]);

  const calculateTotal = () => {
    if (paymentType === 'diaria') {
      return daysWorked * rateApplied;
    } else if (paymentType === 'hora') {
      return hoursWorked * rateApplied;
    }
    return rateApplied;
  };

  const handleSubmit = async () => {
    if (!selectedProviderId || !dateRange?.from || !dateRange?.to) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        service_provider_id: selectedProviderId,
        period_start: format(dateRange.from, 'yyyy-MM-dd'),
        period_end: format(dateRange.to, 'yyyy-MM-dd'),
        payment_type: paymentType,
        days_worked: paymentType === 'diaria' ? daysWorked : undefined,
        hours_worked: paymentType === 'hora' ? hoursWorked : undefined,
        rate_applied: rateApplied,
        description,
        notes,
      });
      handleReset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedProviderId("");
    setDateRange(undefined);
    setPaymentType("diaria");
    setDaysWorked(0);
    setHoursWorked(0);
    setRateApplied(0);
    setDescription("");
    setNotes("");
  };

  const activeProviders = providers.filter(p => p.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento por Período</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prestador */}
          <div className="space-y-2">
            <Label>Prestador *</Label>
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o prestador" />
              </SelectTrigger>
              <SelectContent>
                {activeProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} - {PAYMENT_TYPE_LABELS[p.payment_type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div className="space-y-2">
            <Label>Período Trabalhado *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Selecione o período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tipo de Pagamento e Quantidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Pagamento</Label>
              <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="hora">Por Hora</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentType === 'diaria' && (
              <div className="space-y-2">
                <Label>Dias Trabalhados</Label>
                <Input
                  type="number"
                  min={0}
                  value={daysWorked}
                  onChange={(e) => setDaysWorked(Number(e.target.value))}
                />
              </div>
            )}

            {paymentType === 'hora' && (
              <div className="space-y-2">
                <Label>Horas Trabalhadas</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label>
              {paymentType === 'diaria' ? 'Valor da Diária' : 
               paymentType === 'hora' ? 'Valor por Hora' : 
               'Valor Mensal'} (R$)
            </Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={rateApplied}
              onChange={(e) => setRateApplied(Number(e.target.value))}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Serviços realizados na obra X"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          {/* Cálculo Total */}
          <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="font-medium">Valor Total:</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedProviderId || !dateRange?.from || !dateRange?.to || isSubmitting}
          >
            {isSubmitting ? "Registrando..." : "Registrar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
