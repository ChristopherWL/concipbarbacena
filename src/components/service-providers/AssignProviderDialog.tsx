import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServiceProviderAssignments } from "@/hooks/useServiceProviders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import type { ServiceProvider, PaymentType } from "@/types/serviceProviders";
import { PAYMENT_TYPE_LABELS } from "@/types/serviceProviders";
import { formatCurrency } from "@/lib/formatters";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

const formSchema = z.object({
  service_provider_id: z.string().min(1, "Selecione um prestador"),
  service_order_ref: z.string().max(50).optional(),
  payment_type: z.enum(["diaria", "hora", "por_os", "mensal"]),
  rate_applied: z.coerce.number().optional(),
  date_range: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
  hours_worked: z.coerce.number().optional(),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: ServiceProvider[];
}

export function AssignProviderDialog({ open, onOpenChange, providers }: Props) {
  const { assignToOrder } = useServiceProviderAssignments();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_type: "diaria",
      rate_applied: 0,
      date_range: { from: undefined, to: undefined },
    },
  });

  const selectedProviderId = form.watch("service_provider_id");
  const paymentType = form.watch("payment_type");
  const rateApplied = form.watch("rate_applied");
  const hoursWorked = form.watch("hours_worked");

  // Calculate days from date range
  const daysWorked = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : dateRange?.from ? 1 : 0;

  // Atualiza valores quando prestador é selecionado
  useEffect(() => {
    if (selectedProviderId) {
      const provider = providers.find(p => p.id === selectedProviderId);
      if (provider) {
        form.setValue("payment_type", provider.payment_type);
        
        const rates: Record<PaymentType, number | undefined> = {
          diaria: provider.daily_rate,
          hora: provider.hourly_rate,
          por_os: provider.rate_per_os,
          mensal: provider.monthly_rate,
        };
        form.setValue("rate_applied", rates[provider.payment_type] || 0);
      }
    }
  }, [selectedProviderId, providers, form]);

  // Calcula valor total
  const calculateTotal = () => {
    if (paymentType === "diaria" && daysWorked > 0) {
      return (rateApplied || 0) * daysWorked;
    }
    if (paymentType === "hora" && hoursWorked) {
      return (rateApplied || 0) * hoursWorked;
    }
    return rateApplied || 0;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await assignToOrder({
        service_provider_id: values.service_provider_id,
        payment_type: values.payment_type as PaymentType,
        rate_applied: values.rate_applied,
        days_worked: daysWorked > 0 ? daysWorked : undefined,
        hours_worked: values.hours_worked,
        notes: values.service_order_ref 
          ? `OS/Ref: ${values.service_order_ref}${values.notes ? ` - ${values.notes}` : ''}`
          : values.notes,
      });
      form.reset();
      setDateRange(undefined);
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Pagamento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="service_provider_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prestador *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o prestador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} {p.specialty && `(${p.specialty})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_order_ref"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referência OS (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: OS #123 ou descrição" maxLength={50} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rate_applied"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Valor Unitário (R$)
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentType === "diaria" && (
              <FormItem className="flex flex-col">
                <FormLabel>Período de Trabalho</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange?.from && "text-muted-foreground"
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
                        <span>Selecione o período</span>
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
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {daysWorked > 0 && (
                  <FormDescription>
                    {daysWorked} {daysWorked === 1 ? "dia" : "dias"} selecionado{daysWorked > 1 ? "s" : ""}
                  </FormDescription>
                )}
              </FormItem>
            )}

            {paymentType === "hora" && (
              <FormField
                control={form.control}
                name="hours_worked"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Trabalhadas</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(calculateTotal())}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
