import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Building, Save, User, Phone, Mail, FileText, MapPin } from 'lucide-react';

interface CompanyData {
  name: string;
  proprietario: string;
  razao_social: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

const defaultData: CompanyData = {
  name: '',
  proprietario: '',
  razao_social: '',
  cnpj: '',
  email: '',
  phone: '',
  address: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zip_code: '',
};

export function CompanyDataPanel() {
  const { tenant } = useAuthContext();
  const [data, setData] = useState<CompanyData>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenant?.id) {
      fetchData();
    }
  }, [tenant?.id]);

  const fetchData = async () => {
    if (!tenant?.id) return;
    
    setIsLoading(true);
    try {
      const { data: tenantData, error } = await supabase
        .from('tenants')
        .select('name, proprietario, razao_social, cnpj, email, phone, address, number, complement, neighborhood, city, state, zip_code')
        .eq('id', tenant.id)
        .single();

      if (error) throw error;

      if (tenantData) {
        setData({
          name: tenantData.name || '',
          proprietario: (tenantData as any).proprietario || '',
          razao_social: tenantData.razao_social || '',
          cnpj: tenantData.cnpj || '',
          email: tenantData.email || '',
          phone: tenantData.phone || '',
          address: tenantData.address || '',
          number: tenantData.number || '',
          complement: tenantData.complement || '',
          neighborhood: tenantData.neighborhood || '',
          city: tenantData.city || '',
          state: tenantData.state || '',
          zip_code: tenantData.zip_code || '',
        });
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenant?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: data.name,
          proprietario: data.proprietario,
          razao_social: data.razao_social,
          cnpj: data.cnpj,
          email: data.email,
          phone: data.phone,
          address: data.address,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast.success('Dados salvos com sucesso!');
    } catch (error) {
      console.error('Error saving company data:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (key: keyof CompanyData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14);
    }
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const addressData = await response.json();
      
      if (!addressData.erro) {
        setData(prev => ({
          ...prev,
          address: addressData.logradouro || prev.address,
          neighborhood: addressData.bairro || prev.neighborhood,
          city: addressData.localidade || prev.city,
          state: addressData.uf || prev.state,
        }));
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Company Identity */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
                <Building className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Identificação</span>
              </CardTitle>
              <CardDescription className="text-white/50 text-xs hidden sm:block">
                Dados para contato e referência
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="flex-shrink-0">
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Salvar</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name" className="flex items-center gap-1.5 text-white/70 text-xs">
                <Building className="h-3 w-3" />
                Nome Fantasia
              </Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Nome da empresa"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="razao_social" className="flex items-center gap-1.5 text-white/70 text-xs">
                <FileText className="h-3 w-3" />
                Razão Social
              </Label>
              <Input
                id="razao_social"
                value={data.razao_social}
                onChange={(e) => updateField('razao_social', e.target.value)}
                placeholder="Razão social"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="proprietario" className="flex items-center gap-1.5 text-white/70 text-xs">
                <User className="h-3 w-3" />
                Proprietário
              </Label>
              <Input
                id="proprietario"
                value={data.proprietario}
                onChange={(e) => updateField('proprietario', e.target.value)}
                placeholder="Nome do proprietário"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cnpj" className="flex items-center gap-1.5 text-white/70 text-xs">
                <FileText className="h-3 w-3" />
                CNPJ
              </Label>
              <Input
                id="cnpj"
                value={data.cnpj}
                onChange={(e) => updateField('cnpj', formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
            <Phone className="h-4 w-4" />
            Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="phone" className="flex items-center gap-1.5 text-white/70 text-xs">
                <Phone className="h-3 w-3" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={data.phone}
                onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="flex items-center gap-1.5 text-white/70 text-xs">
                <Mail className="h-3 w-3" />
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="contato@empresa.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base">
            <MapPin className="h-4 w-4" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="zip_code" className="text-white/70 text-xs">CEP</Label>
              <Input
                id="zip_code"
                value={data.zip_code}
                onChange={(e) => {
                  const formatted = formatCEP(e.target.value);
                  updateField('zip_code', formatted);
                  if (formatted.replace(/\D/g, '').length === 8) {
                    fetchAddressByCEP(formatted);
                  }
                }}
                placeholder="00000-000"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label htmlFor="address" className="text-white/70 text-xs">Logradouro</Label>
              <Input
                id="address"
                value={data.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Rua, Avenida..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="number" className="text-white/70 text-xs">Número</Label>
              <Input
                id="number"
                value={data.number}
                onChange={(e) => updateField('number', e.target.value)}
                placeholder="123"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="complement" className="text-white/70 text-xs">Complemento</Label>
              <Input
                id="complement"
                value={data.complement}
                onChange={(e) => updateField('complement', e.target.value)}
                placeholder="Sala..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="neighborhood" className="text-white/70 text-xs">Bairro</Label>
              <Input
                id="neighborhood"
                value={data.neighborhood}
                onChange={(e) => updateField('neighborhood', e.target.value)}
                placeholder="Bairro"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city" className="text-white/70 text-xs">Cidade</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Cidade"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state" className="text-white/70 text-xs">UF</Label>
              <Input
                id="state"
                value={data.state}
                onChange={(e) => updateField('state', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="UF"
                maxLength={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
