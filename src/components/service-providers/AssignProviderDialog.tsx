import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServiceProviderAssignments } from "@/hooks/useServiceProviders";
import { useServiceOrders } from "@/hooks/useServiceOrders";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceProvider, PaymentType } from "@/types/serviceProviders";
import { PAYMENT_TYPE_LABELS } from "@/types/serviceProviders";
import { formatCurrency } from "@/lib/formatters";

const formSchema = z.object({
  service_provider_id: z.string().min(1, "Selecione um prestador"),
  service_order_id: z.string().optional(),
  payment_type: z.enum(["diaria", "hora", "por_os", "mensal"]),
  rate_applied: z.coerce.number().optional(),
  days_worked: z.coerce.number().optional(),
  hours_worked: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: ServiceProvider[];
}

export function AssignProviderDialog({ open, onOpenChange, providers }: Props) {
  const { assignToOrder } = useServiceProviderAssignments();
  const { data: serviceOrders = [] } = useServiceOrders();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_type: "diaria",
      rate_applied: 0,
      days_worked: 1,
    },
  });

  const selectedProviderId = form.watch("service_provider_id");
  const paymentType = form.watch("payment_type");
  const rateApplied = form.watch("rate_applied");
  const daysWorked = form.watch("days_worked");
  const hoursWorked = form.watch("hours_worked");

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
    if (paymentType === "diaria" && daysWorked) {
      return rateApplied * daysWorked;
    }
    if (paymentType === "hora" && hoursWorked) {
      return rateApplied * hoursWorked;
    }
    return rateApplied;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await assignToOrder({
        service_provider_id: values.service_provider_id,
        service_order_id: values.service_order_id,
        payment_type: values.payment_type as PaymentType,
        rate_applied: values.rate_applied,
        days_worked: values.days_worked,
        hours_worked: values.hours_worked,
        notes: values.notes,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Filtra OS abertas/em andamento
  const availableOrders = serviceOrders.filter(
    (os) => os.status === "aberta" || os.status === "em_andamento"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir OS a Prestador</DialogTitle>
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
              name="service_order_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Serviço</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a OS (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableOrders.map((os) => (
                        <SelectItem key={os.id} value={os.id}>
                          #{os.order_number} - {os.title}
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
              <FormField
                control={form.control}
                name="days_worked"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias Trabalhados</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <Button type="submit">
                Atribuir
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
