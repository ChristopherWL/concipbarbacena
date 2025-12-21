import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, User, Camera, X } from 'lucide-react';
import { useCreateTechnician } from '@/hooks/useTeams';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatCPF, formatRG, formatPhone } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFormWizard, WizardStep } from '@/components/ui/mobile-form-wizard';

interface ColaboradorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 
  'SP', 'SE', 'TO'
];

export function ColaboradorFormDialog({ open, onOpenChange, onCreated }: ColaboradorFormDialogProps) {
  const isMobile = useIsMobile();
  const { tenant } = useAuthContext();
  const createTechnician = useCreateTechnician();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    cpf: '',
    rg: '',
    phone: '',
    email: '',
    position: '',
    hourly_rate: '',
    hire_date: '',
    address: '',
    city: '',
    state: '',
    photo_url: '',
    notes: '',
  });

  const steps = [
    { id: 'pessoal', title: 'Dados Pessoais' },
    { id: 'contato', title: 'Contato e Endereço' },
    { id: 'profissional', title: 'Dados Profissionais' },
  ];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenant.id}/colaboradores/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tenant-assets')
        .getPublicUrl(fileName);

      setForm(prev => ({ ...prev, photo_url: publicUrl }));
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar foto');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const result = await createTechnician.mutateAsync({
      name: form.name,
      cpf: form.cpf || undefined,
      rg: form.rg || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      position: form.position || undefined,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : undefined,
      hire_date: form.hire_date || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      photo_url: form.photo_url || undefined,
      notes: form.notes || undefined,
      is_active: true,
    });

    onOpenChange(false);
    resetForm();
    
    // Notify parent about the newly created colaborador
    if (result && onCreated) {
      onCreated(result.id);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      cpf: '',
      rg: '',
      phone: '',
      email: '',
      position: '',
      hourly_rate: '',
      hire_date: '',
      address: '',
      city: '',
      state: '',
      photo_url: '',
      notes: '',
    });
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep === 0 && !form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Step 1: Dados Pessoais
  const step1Content = (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            {form.photo_url ? (
              <AvatarImage src={form.photo_url} alt="Foto do colaborador" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {form.name ? getInitials(form.name) : <User className="h-8 w-8" />}
              </AvatarFallback>
            )}
          </Avatar>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
        <div>
          <p className="text-sm font-medium">Foto</p>
          <p className="text-xs text-muted-foreground">Máximo 5MB</p>
        </div>
      </div>

      <div>
        <Label>Nome Completo *</Label>
        <Input
          placeholder="Nome completo do colaborador"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>CPF</Label>
          <Input
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })}
            maxLength={14}
          />
        </div>
        <div>
          <Label>RG</Label>
          <Input
            placeholder="00.000.000-0"
            value={form.rg}
            onChange={e => setForm({ ...form, rg: formatRG(e.target.value) })}
            maxLength={12}
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Contato
  const step2Content = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Telefone</Label>
          <Input
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: formatPhone(e.target.value) })}
            maxLength={15}
          />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Endereço</Label>
        <Input
          placeholder="Rua, número, bairro"
          value={form.address}
          onChange={e => setForm({ ...form, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cidade</Label>
          <Input
            placeholder="Cidade"
            value={form.city}
            onChange={e => setForm({ ...form, city: e.target.value })}
          />
        </div>
        <div>
          <Label>Estado</Label>
          <Select value={form.state} onValueChange={v => setForm({ ...form, state: v })}>
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_BR.map(uf => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // Step 3: Profissional
  const step3Content = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cargo / Função</Label>
          <Input
            placeholder="Ex: Técnico de Campo"
            value={form.position}
            onChange={e => setForm({ ...form, position: e.target.value })}
          />
        </div>
        <div>
          <Label>Data de Admissão</Label>
          <Input
            type="date"
            value={form.hire_date}
            onChange={e => setForm({ ...form, hire_date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Valor/Hora (R$)</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.hourly_rate}
          onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
        />
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea
          placeholder="Observações adicionais sobre o colaborador..."
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );

  if (isMobile && open) {
    const steps: WizardStep[] = [
      { id: 'pessoal', title: 'Dados Pessoais', content: step1Content },
      { id: 'contato', title: 'Contato e Endereço', content: step2Content },
      { id: 'profissional', title: 'Dados Profissionais', content: step3Content },
    ];

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
        <div className="bg-primary px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-foreground">
            Novo Colaborador
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <MobileFormWizard
          steps={steps}
          onComplete={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={createTechnician.isPending}
          submitLabel="Cadastrar Colaborador"
        />
      </div>,
      document.body
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary rounded-t-xl -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="text-primary-foreground">Novo Colaborador</DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            Passo {currentStep + 1} de {steps.length}: {steps[currentStep].title}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 py-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 rounded ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6 py-4">
          {/* Step 1: Dados Pessoais */}
          {currentStep === 0 && (
            <>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {form.photo_url ? (
                      <AvatarImage src={form.photo_url} alt="Foto do colaborador" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {form.name ? getInitials(form.name) : <User className="h-8 w-8" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Foto do Colaborador</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP. Máximo 5MB.</p>
                </div>
              </div>

              <div>
                <Label>Nome Completo *</Label>
                <Input
                  placeholder="Nome completo do colaborador"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CPF</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                    maxLength={14}
                  />
                </div>
                <div>
                  <Label>RG</Label>
                  <Input
                    placeholder="00.000.000-0"
                    value={form.rg}
                    onChange={e => setForm({ ...form, rg: formatRG(e.target.value) })}
                    maxLength={12}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2: Contato e Endereço */}
          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: formatPhone(e.target.value) })}
                    maxLength={15}
                  />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Endereço</Label>
                <Input
                  placeholder="Rua, número, bairro"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cidade</Label>
                  <Input
                    placeholder="Cidade"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={form.state} onValueChange={v => setForm({ ...form, state: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Dados Profissionais */}
          {currentStep === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cargo / Função</Label>
                  <Input
                    placeholder="Ex: Técnico de Campo"
                    value={form.position}
                    onChange={e => setForm({ ...form, position: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data de Admissão</Label>
                  <Input
                    type="date"
                    value={form.hire_date}
                    onChange={e => setForm({ ...form, hire_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Valor/Hora (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.hourly_rate}
                  onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações adicionais sobre o colaborador..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={currentStep === 0 ? () => onOpenChange(false) : handleBack}
          >
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Próximo
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={createTechnician.isPending}>
              {createTechnician.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
