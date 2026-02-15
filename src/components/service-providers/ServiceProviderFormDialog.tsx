import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServiceProviders } from "@/hooks/useServiceProviders";
import { useBranchFilter } from "@/hooks/useBranchFilter";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ServiceProvider, PaymentType } from "@/types/serviceProviders";

const formSchema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  document_type: z.string().default("cpf"),
  document: z.string().optional(),
  rg: z.string().optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  specialty: z.string().optional(),
  notes: z.string().optional(),
  bank_name: z.string().optional(),
  bank_agency: z.string().optional(),
  bank_account: z.string().optional(),
  bank_account_type: z.string().optional(),
  pix_key: z.string().optional(),
  payment_type: z.enum(["diaria", "hora", "por_os", "mensal"]),
  daily_rate: z.coerce.number().optional(),
  hourly_rate: z.coerce.number().optional(),
  rate_per_os: z.coerce.number().optional(),
  monthly_rate: z.coerce.number().optional(),
  monthly_due_day: z.coerce.number().min(1).max(31).optional(),
  monthly_payment_day: z.coerce.number().min(1).max(31).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ServiceProvider | null;
}

export function ServiceProviderFormDialog({ open, onOpenChange, provider }: Props) {
  const { createProvider, updateProvider } = useServiceProviders();
  const { branchId } = useBranchFilter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      document_type: "cpf",
      payment_type: "diaria",
    },
  });

  useEffect(() => {
    if (provider) {
      form.reset({
        name: provider.name,
        document_type: provider.document_type || "cpf",
        document: provider.document || "",
        rg: provider.rg || "",
        phone: provider.phone || "",
        phone2: provider.phone2 || "",
        email: provider.email || "",
        address: provider.address || "",
        number: provider.number || "",
        complement: provider.complement || "",
        neighborhood: provider.neighborhood || "",
        city: provider.city || "",
        state: provider.state || "",
        zip_code: provider.zip_code || "",
        specialty: provider.specialty || "",
        notes: provider.notes || "",
        bank_name: provider.bank_name || "",
        bank_agency: provider.bank_agency || "",
        bank_account: provider.bank_account || "",
        bank_account_type: provider.bank_account_type || "",
        pix_key: provider.pix_key || "",
        payment_type: provider.payment_type as PaymentType,
        daily_rate: provider.daily_rate || undefined,
        hourly_rate: provider.hourly_rate || undefined,
        rate_per_os: provider.rate_per_os || undefined,
        monthly_rate: provider.monthly_rate || undefined,
        monthly_due_day: (provider as any).monthly_due_day || undefined,
        monthly_payment_day: (provider as any).monthly_payment_day || undefined,
      });
    } else {
      form.reset({
        name: "",
        document_type: "cpf",
        payment_type: "diaria",
      });
    }
  }, [provider, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const data = {
        ...values,
        name: values.name, // Explicitly required
        branch_id: branchId || undefined,
        email: values.email || null,
      };

      if (provider) {
        await updateProvider({ id: provider.id, ...data });
      } else {
        await createProvider({ ...data, name: data.name });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const paymentType = form.watch("payment_type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {provider ? "Editar Prestador" : "Novo Prestador de Serviço"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="address">Endereço</TabsTrigger>
                <TabsTrigger value="bank">Bancário</TabsTrigger>
                <TabsTrigger value="payment">Pagamento</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="document_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo Documento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF/CNPJ</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pedreiro, Eletricista, Fibra..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações gerais..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="address" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, Avenida..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto, Bloco..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="UF" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="bank" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do banco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bank_agency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agência</FormLabel>
                        <FormControl>
                          <Input placeholder="0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bank_account"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bank_account_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Conta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="corrente">Conta Corrente</SelectItem>
                          <SelectItem value="poupanca">Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pix_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave PIX</FormLabel>
                      <FormControl>
                        <Input placeholder="CPF, Email, Telefone ou Aleatória" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="payment" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="payment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo de Pagamento *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="diaria">Diária Fixa</SelectItem>
                          <SelectItem value="hora">Por Hora</SelectItem>
                          <SelectItem value="por_os">Por OS Concluída</SelectItem>
                          <SelectItem value="mensal">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {paymentType === "diaria" && (
                  <FormField
                    control={form.control}
                    name="daily_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Diária (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {paymentType === "hora" && (
                  <FormField
                    control={form.control}
                    name="hourly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor por Hora (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {paymentType === "por_os" && (
                  <FormField
                    control={form.control}
                    name="rate_per_os"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor por OS (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {paymentType === "mensal" && (
                  <>
                    <FormField
                      control={form.control}
                      name="monthly_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Mensal (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="monthly_due_day"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dia de Vencimento</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={31} placeholder="Ex: 10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="monthly_payment_day"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dia de Pagamento</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={31} placeholder="Ex: 15" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {provider ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
