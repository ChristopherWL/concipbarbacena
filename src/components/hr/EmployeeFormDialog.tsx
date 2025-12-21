import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, X, Plus, Check } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { usePositionCategories, useCreatePositionCategory } from '@/hooks/usePositionCategories';
import { Employee, ContractType, CONTRACT_TYPE_LABELS } from '@/types/hr';
import { formatCPF, formatPhone, formatCEP, formatRG } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFormWizard, WizardStep } from '@/components/ui/mobile-form-wizard';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

const GENDER_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
];

const BANK_ACCOUNT_TYPES = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Conta Poupança' },
];

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function EmployeeFormDialog({ open, onOpenChange, employee }: Props) {
  const isMobile = useIsMobile();
  const { createEmployee, updateEmployee } = useEmployees();
  const { data: positionCategories = [] } = usePositionCategories();
  const createPositionCategory = useCreatePositionCategory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionIsDriver, setNewPositionIsDriver] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);

  const steps = [
    { id: 'pessoal', title: 'Dados Pessoais' },
    { id: 'contato', title: 'Contato' },
    { id: 'profissional', title: 'Profissional' },
    { id: 'bancario', title: 'Bancário' },
  ];

  const [form, setForm] = useState({
    name: '',
    cpf: '',
    rg: '',
    birth_date: '',
    gender: '',
    marital_status: '',
    nationality: 'Brasileiro',
    email: '',
    phone: '',
    phone2: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    registration_number: '',
    position: '',
    department: '',
    contract_type: 'clt' as ContractType,
    hire_date: '',
    base_salary: 0,
    hourly_rate: 0,
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    bank_account_type: '',
    pix_key: '',
    is_technician: false,
    notes: '',
    blusa_numero: '',
    calca_numero: '',
    calcado_numero: '',
  });

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        cpf: employee.cpf || '',
        rg: employee.rg || '',
        birth_date: employee.birth_date || '',
        gender: employee.gender || '',
        marital_status: employee.marital_status || '',
        nationality: employee.nationality || 'Brasileiro',
        email: employee.email || '',
        phone: employee.phone || '',
        phone2: employee.phone2 || '',
        address: employee.address || '',
        number: employee.number || '',
        complement: employee.complement || '',
        neighborhood: employee.neighborhood || '',
        city: employee.city || '',
        state: employee.state || '',
        zip_code: employee.zip_code || '',
        registration_number: employee.registration_number || '',
        position: employee.position || '',
        department: employee.department || '',
        contract_type: employee.contract_type || 'clt',
        hire_date: employee.hire_date || '',
        base_salary: employee.base_salary || 0,
        hourly_rate: employee.hourly_rate || 0,
        bank_name: employee.bank_name || '',
        bank_agency: employee.bank_agency || '',
        bank_account: employee.bank_account || '',
        bank_account_type: employee.bank_account_type || '',
        pix_key: employee.pix_key || '',
        is_technician: employee.is_technician || false,
        notes: employee.notes || '',
        blusa_numero: employee.blusa_numero || '',
        calca_numero: employee.calca_numero || '',
        calcado_numero: employee.calcado_numero || '',
      });
      setCurrentStep(0);
    } else {
      setForm({
        name: '',
        cpf: '',
        rg: '',
        birth_date: '',
        gender: '',
        marital_status: '',
        nationality: 'Brasileiro',
        email: '',
        phone: '',
        phone2: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        registration_number: '',
        position: '',
        department: '',
        contract_type: 'clt',
        hire_date: '',
        base_salary: 0,
        hourly_rate: 0,
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        bank_account_type: '',
        pix_key: '',
        is_technician: false,
        notes: '',
        blusa_numero: '',
        calca_numero: '',
        calcado_numero: '',
      });
      setCurrentStep(0);
    }
  }, [employee, open]);

  const handleCEPBlur = async () => {
    const cep = form.zip_code.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            address: data.logradouro || prev.address,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
        }
      } catch (error) {
        console.error('Error fetching CEP:', error);
      }
    }
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    if (!name) return;

    // Avoid sending empty-string dates to the backend (causes "invalid input syntax for type date: \"\"" )
    const payload = {
      ...form,
      name,
      birth_date: form.birth_date ? form.birth_date : null,
      hire_date: form.hire_date ? form.hire_date : null,
    };

    setIsSubmitting(true);
    try {
      if (employee) {
        const ok = await updateEmployee(employee.id, payload);
        if (!ok) return;
      } else {
        const created = await createEmployee(payload);
        if (!created) return;
      }

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Dados Pessoais
  const step1Content = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nome Completo *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nome do colaborador"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={form.cpf}
            onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>
        <div>
          <Label htmlFor="rg">RG</Label>
          <Input
            id="rg"
            value={form.rg}
            onChange={(e) => setForm({ ...form, rg: formatRG(e.target.value) })}
            placeholder="00.000.000-0"
            maxLength={12}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="birth_date">Data de Nascimento</Label>
          <Input
            id="birth_date"
            type="date"
            value={form.birth_date}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="gender">Gênero</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="marital_status">Estado Civil</Label>
          <Select value={form.marital_status} onValueChange={(v) => setForm({ ...form, marital_status: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {MARITAL_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="nationality">Nacionalidade</Label>
          <Input
            id="nationality"
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            placeholder="Brasileiro"
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Contato e Endereço
  const step2Content = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="email@exemplo.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
        </div>
        <div>
          <Label htmlFor="phone2">Telefone 2</Label>
          <Input
            id="phone2"
            value={form.phone2}
            onChange={(e) => setForm({ ...form, phone2: formatPhone(e.target.value) })}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zip_code">CEP</Label>
          <Input
            id="zip_code"
            value={form.zip_code}
            onChange={(e) => setForm({ ...form, zip_code: formatCEP(e.target.value) })}
            onBlur={handleCEPBlur}
            placeholder="00000-000"
            maxLength={9}
          />
        </div>
        <div>
          <Label htmlFor="state">Estado</Label>
          <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Cidade"
          />
        </div>
        <div>
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
            placeholder="Bairro"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Rua, Avenida..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            placeholder="Nº"
          />
        </div>
        <div>
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={form.complement}
            onChange={(e) => setForm({ ...form, complement: e.target.value })}
            placeholder="Apto, Bloco..."
          />
        </div>
      </div>
    </div>
  );

  // Step 3: Profissional
  const step3Content = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="registration_number">Matrícula</Label>
          <Input
            id="registration_number"
            value={form.registration_number}
            onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
            placeholder="Número da matrícula"
          />
        </div>
        <div>
          <Label htmlFor="contract_type">Tipo de Contrato</Label>
          <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v as ContractType })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="position">Cargo</Label>
          <div className="flex gap-2">
            <Select
              value={form.position}
              onValueChange={(value) => setForm({ ...form, position: value })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                {positionCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name} {cat.is_driver && '🚗'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover open={showAddPosition} onOpenChange={setShowAddPosition}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-3">
                  <Label>Novo Cargo</Label>
                  <Input
                    value={newPositionName}
                    onChange={(e) => setNewPositionName(e.target.value)}
                    placeholder="Nome do cargo"
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="is_driver"
                      checked={newPositionIsDriver}
                      onCheckedChange={(checked) => setNewPositionIsDriver(checked === true)}
                    />
                    <Label htmlFor="is_driver" className="text-sm font-normal">
                      Este cargo é de motorista
                    </Label>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    disabled={!newPositionName.trim() || createPositionCategory.isPending}
                    onClick={async () => {
                      if (newPositionName.trim()) {
                        const result = await createPositionCategory.mutateAsync({
                          name: newPositionName.trim(),
                          is_driver: newPositionIsDriver,
                        });
                        setForm({ ...form, position: result.name });
                        setNewPositionName('');
                        setNewPositionIsDriver(false);
                        setShowAddPosition(false);
                      }
                    }}
                  >
                    {createPositionCategory.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" /> Adicionar
                      </>
                    )}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div>
          <Label htmlFor="department">Departamento</Label>
          <Input
            id="department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            placeholder="Departamento"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hire_date">Data de Admissão</Label>
          <Input
            id="hire_date"
            type="date"
            value={form.hire_date}
            onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="base_salary">Salário Base (R$)</Label>
          <Input
            id="base_salary"
            type="number"
            step="0.01"
            min="0"
            value={form.base_salary}
            onChange={(e) => setForm({ ...form, base_salary: parseFloat(e.target.value) || 0 })}
            placeholder="0,00"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="hourly_rate">Valor Hora (R$)</Label>
        <Input
          id="hourly_rate"
          type="number"
          step="0.01"
          min="0"
          value={form.hourly_rate}
          onChange={(e) => setForm({ ...form, hourly_rate: parseFloat(e.target.value) || 0 })}
          placeholder="0,00"
        />
      </div>

      {/* Tamanhos de Uniforme */}
      <div className="border-t pt-4 mt-4">
        <Label className="text-sm font-medium text-muted-foreground mb-3 block">Tamanhos de Uniforme</Label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="blusa_numero">Blusa Nº</Label>
            <Input
              id="blusa_numero"
              value={form.blusa_numero}
              onChange={(e) => setForm({ ...form, blusa_numero: e.target.value })}
              placeholder="Ex: M, G"
            />
          </div>
          <div>
            <Label htmlFor="calca_numero">Calça Nº</Label>
            <Input
              id="calca_numero"
              value={form.calca_numero}
              onChange={(e) => setForm({ ...form, calca_numero: e.target.value })}
              placeholder="Ex: 40, 42"
            />
          </div>
          <div>
            <Label htmlFor="calcado_numero">Calçado Nº</Label>
            <Input
              id="calcado_numero"
              value={form.calcado_numero}
              onChange={(e) => setForm({ ...form, calcado_numero: e.target.value })}
              placeholder="Ex: 40, 42"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Checkbox
          id="is_technician"
          checked={form.is_technician}
          onCheckedChange={(checked) => setForm({ ...form, is_technician: !!checked })}
        />
        <Label htmlFor="is_technician" className="cursor-pointer">
          Este colaborador é técnico de campo
        </Label>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Observações sobre o colaborador"
          rows={3}
        />
      </div>
    </div>
  );

  // Step 4: Bancário
  const step4Content = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="bank_name">Banco</Label>
        <Input
          id="bank_name"
          value={form.bank_name}
          onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
          placeholder="Nome do banco"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bank_agency">Agência</Label>
          <Input
            id="bank_agency"
            value={form.bank_agency}
            onChange={(e) => setForm({ ...form, bank_agency: e.target.value })}
            placeholder="Número da agência"
          />
        </div>
        <div>
          <Label htmlFor="bank_account">Conta</Label>
          <Input
            id="bank_account"
            value={form.bank_account}
            onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
            placeholder="Número da conta"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bank_account_type">Tipo de Conta</Label>
          <Select value={form.bank_account_type} onValueChange={(v) => setForm({ ...form, bank_account_type: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {BANK_ACCOUNT_TYPES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="pix_key">Chave PIX</Label>
          <Input
            id="pix_key"
            value={form.pix_key}
            onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
          />
        </div>
      </div>
    </div>
  );

  if (isMobile && open) {
    const steps: WizardStep[] = [
      { id: 'pessoal', title: 'Dados Pessoais', content: step1Content },
      { id: 'contato', title: 'Contato e Endereço', content: step2Content },
      { id: 'profissional', title: 'Dados Profissionais', content: step3Content },
      { id: 'bancario', title: 'Dados Bancários', content: step4Content },
    ];

    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
        <div className="bg-primary px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-foreground">
            {employee ? 'Editar Colaborador' : 'Novo Colaborador'}
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
          isSubmitting={isSubmitting}
          submitLabel={employee ? 'Salvar Alterações' : 'Cadastrar'}
        />
      </div>,
      document.body
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="bg-primary px-6 py-4 text-center rounded-t-xl flex-shrink-0">
          <DialogTitle className="text-primary-foreground text-center">{employee ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
          <DialogDescription className="text-primary-foreground/80 text-center">
            Preencha os dados do colaborador. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 flex-shrink-0">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
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
                    className={`w-12 h-1 mx-1 rounded ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mb-4">
            {steps[currentStep].title}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          {currentStep === 0 && step1Content}
          {currentStep === 1 && step2Content}
          {currentStep === 2 && step3Content}
          {currentStep === 3 && step4Content}
        </div>

        <div className="flex justify-between gap-2 p-6 border-t flex-shrink-0 bg-background">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 0) {
                onOpenChange(false);
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
          >
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => {
                if (currentStep === 0 && !form.name.trim()) {
                  return;
                }
                setCurrentStep(currentStep + 1);
              }}
              disabled={currentStep === 0 && !form.name.trim()}
            >
              Próximo
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !form.name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : employee ? 'Salvar Alterações' : 'Salvar'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
