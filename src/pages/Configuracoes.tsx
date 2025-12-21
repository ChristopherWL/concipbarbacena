import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Building2, Save, Info, Globe, Users } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/settings/ImageUpload';
import { GenericLandingEditor } from '@/components/settings/GenericLandingEditor';
import { BranchUsersPanel } from '@/components/settings/BranchUsersPanel';
import { sanitizeErrorMessage } from '@/lib/errorUtils';
import { formatCNPJ, formatPhone, formatCEP } from '@/lib/formatters';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BranchData {
  id: string;
  name: string;
  is_main: boolean;
  logo_url: string | null;
  logo_dark_url: string | null;
  cnpj: string | null;
  razao_social: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const { user, profile, tenant, selectedBranch, isLoading: authLoading, refetchUserData } = useAuthContext();
  const [saving, setSaving] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<BranchData | null>(null);
  const [branchLogos, setBranchLogos] = useState({ logo_url: '', logo_dark_url: '' });
  const [branchForm, setBranchForm] = useState({
    name: '', razao_social: '', cnpj: '', email: '', phone: '',
    address: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '',
    inscricao_estadual: '', inscricao_municipal: ''
  });
  const [searchingBranchCep, setSearchingBranchCep] = useState(false);
  const [landingPageContent, setLandingPageContent] = useState<any>(null);
  
  const [companyForm, setCompanyForm] = useState({
    name: '', razao_social: '', cnpj: '', email: '', phone: '', 
    address: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '',
    logo_url: '', logo_dark_url: '', background_url: ''
  });

  // Determine if user is in matriz (main branch) or filial
  // User is in matriz if: no branch selected, OR branch is main, OR user has no selected_branch_id in profile
  const isMatriz = (!selectedBranch && !profile?.selected_branch_id) || currentBranch?.is_main === true;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth', { replace: true });
      } else if (!profile?.tenant_id && !tenant) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, tenant, authLoading, navigate]);

  // Load tenant data
  useEffect(() => {
    if (tenant) {
      setCompanyForm({
        name: tenant.name || '', 
        razao_social: tenant.razao_social || '', 
        cnpj: tenant.cnpj || '',
        email: tenant.email || '', 
        phone: tenant.phone || '', 
        address: tenant.address || '',
        number: (tenant as any).number || '',
        complement: (tenant as any).complement || '',
        neighborhood: (tenant as any).neighborhood || '',
        city: tenant.city || '', 
        state: tenant.state || '', 
        zip_code: tenant.zip_code || '',
        logo_url: tenant.logo_url || '',
        logo_dark_url: tenant.logo_dark_url || '',
        background_url: tenant.background_url || ''
      });
      setLandingPageContent(tenant.landing_page_content || null);
    }
  }, [tenant]);

  // Load current branch data
  useEffect(() => {
    const fetchBranchData = async () => {
      if (!selectedBranch?.id && !profile?.selected_branch_id) {
        // No branch selected - check if there's a main branch
        if (tenant?.id) {
          const { data: mainBranch } = await supabase
            .from('branches')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_main', true)
            .maybeSingle();
          
          if (mainBranch) {
            setCurrentBranch(mainBranch as BranchData);
            setBranchLogos({
              logo_url: mainBranch.logo_url || '',
              logo_dark_url: mainBranch.logo_dark_url || ''
            });
          }
        }
        return;
      }

      const branchId = selectedBranch?.id || profile?.selected_branch_id;
      if (!branchId) return;

      const { data: branch } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .maybeSingle();

      if (branch) {
        setCurrentBranch(branch as BranchData);
        setBranchLogos({
          logo_url: branch.logo_url || '',
          logo_dark_url: branch.logo_dark_url || ''
        });
        setBranchForm({
          name: branch.name || '',
          razao_social: branch.razao_social || '',
          cnpj: branch.cnpj || '',
          email: branch.email || '',
          phone: branch.phone || '',
          address: branch.address || '',
          number: branch.number || '',
          complement: branch.complement || '',
          neighborhood: branch.neighborhood || '',
          city: branch.city || '',
          state: branch.state || '',
          zip_code: branch.zip_code || '',
          inscricao_estadual: branch.inscricao_estadual || '',
          inscricao_municipal: branch.inscricao_municipal || ''
        });
      }
    };

    fetchBranchData();
  }, [selectedBranch, profile?.selected_branch_id, tenant?.id]);

  const searchCEP = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    if (!/^\d{8}$/.test(cleanCep)) return;
    
    setSearchingCep(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, { signal: controller.signal });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      
      setCompanyForm(prev => ({
        ...prev,
        address: typeof data.logradouro === 'string' ? data.logradouro : prev.address,
        neighborhood: typeof data.bairro === 'string' ? data.bairro : prev.neighborhood,
        city: typeof data.localidade === 'string' ? data.localidade : prev.city,
        state: typeof data.uf === 'string' ? data.uf : prev.state
      }));
      toast.success('Endereço preenchido automaticamente!');
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Tempo esgotado ao buscar CEP');
      } else {
        toast.error('Erro ao buscar CEP. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      setSearchingCep(false);
    }
  }, []);

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value);
    setCompanyForm({ ...companyForm, zip_code: formatted });
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      searchCEP(cleanCep);
    }
  };

  const handleBranchCepChange = useCallback(async (value: string) => {
    const formatted = formatCEP(value);
    setBranchForm(prev => ({ ...prev, zip_code: formatted }));
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setSearchingBranchCep(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, { signal: controller.signal });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (!data.erro) {
          setBranchForm(prev => ({
            ...prev,
            address: typeof data.logradouro === 'string' ? data.logradouro : prev.address,
            neighborhood: typeof data.bairro === 'string' ? data.bairro : prev.neighborhood,
            city: typeof data.localidade === 'string' ? data.localidade : prev.city,
            state: typeof data.uf === 'string' ? data.uf : prev.state
          }));
          toast.success('Endereço preenchido!');
        }
      } catch { } finally {
        clearTimeout(timeoutId);
        setSearchingBranchCep(false);
      }
    }
  }, []);

  if (authLoading) return <PageLoading text="Carregando configurações" />;
  if (!user) return null;

  const handleSaveCompany = async () => {
    if (!tenant) {
      toast.error('Tenant não encontrado');
      return;
    }
    setSaving(true);
    try {
      // Save tenant data (including matriz logos if user is in matriz)
      const tenantUpdate: any = {
        name: companyForm.name,
        razao_social: companyForm.razao_social,
        cnpj: companyForm.cnpj,
        email: companyForm.email,
        phone: companyForm.phone,
        address: companyForm.address,
        number: companyForm.number,
        complement: companyForm.complement,
        neighborhood: companyForm.neighborhood,
        city: companyForm.city,
        state: companyForm.state,
        zip_code: companyForm.zip_code,
        background_url: companyForm.background_url || null
      };

      // Only update tenant logos if user is in matriz
      if (isMatriz) {
        tenantUpdate.logo_url = companyForm.logo_url || null;
        tenantUpdate.logo_dark_url = companyForm.logo_dark_url || null;
      }

      const { error: tenantError } = await supabase
        .from('tenants')
        .update(tenantUpdate)
        .eq('id', tenant.id);
      
      if (tenantError) {
        console.error('Error saving company:', tenantError);
        toast.error(sanitizeErrorMessage(tenantError));
        return;
      }

      // Save branch logos if user is in a filial (non-main branch)
      if (!isMatriz && currentBranch?.id) {
        const { error: branchError } = await supabase
          .from('branches')
          .update({
            logo_url: branchLogos.logo_url || null,
            logo_dark_url: branchLogos.logo_dark_url || null
          })
          .eq('id', currentBranch.id);

        if (branchError) {
          console.error('Error saving branch logos:', branchError);
          toast.error('Erro ao salvar logos da filial');
          return;
        }
      }

      toast.success('Dados da empresa salvos com sucesso!');
      if (refetchUserData) await refetchUserData();
    } catch (err) {
      console.error('Exception saving company:', err);
      toast.error('Erro inesperado ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranch = async () => {
    if (!currentBranch?.id) {
      toast.error('Filial não encontrada');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('branches')
        .update({
          name: branchForm.name,
          razao_social: branchForm.razao_social,
          cnpj: branchForm.cnpj,
          email: branchForm.email,
          phone: branchForm.phone,
          address: branchForm.address,
          number: branchForm.number,
          complement: branchForm.complement,
          neighborhood: branchForm.neighborhood,
          city: branchForm.city,
          state: branchForm.state,
          zip_code: branchForm.zip_code,
          inscricao_estadual: branchForm.inscricao_estadual,
          inscricao_municipal: branchForm.inscricao_municipal,
          logo_url: branchLogos.logo_url || null,
          logo_dark_url: branchLogos.logo_dark_url || null
        })
        .eq('id', currentBranch.id);

      if (error) {
        console.error('Error saving branch:', error);
        toast.error(sanitizeErrorMessage(error));
        return;
      }

      toast.success('Dados da filial salvos com sucesso!');
      if (refetchUserData) await refetchUserData();
    } catch (err) {
      console.error('Exception saving branch:', err);
      toast.error('Erro inesperado ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshLandingContent = async () => {
    if (tenant?.id) {
      const { data } = await supabase
        .from('tenants')
        .select('landing_page_content')
        .eq('id', tenant.id)
        .single();
      if (data) {
        setLandingPageContent(data.landing_page_content);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in" data-tour="settings-content">
        {/* Page Header */}
        <div className="flex flex-col items-center text-center gap-1 sm:gap-2 sm:-mt-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            Configurações
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Gerencie os dados da empresa
          </p>
        </div>

        {isMatriz ? (
          <Tabs defaultValue="empresa" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="empresa" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
              </TabsTrigger>
              <TabsTrigger value="landing" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Landing Page
              </TabsTrigger>
            </TabsList>

            <TabsContent value="empresa" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Dados da Empresa
                  </CardTitle>
                  <CardDescription>Informações cadastrais da sua empresa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dados para Relatórios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome Fantasia</Label>
                      <Input 
                        value={companyForm.name} 
                        onChange={e => setCompanyForm({...companyForm, name: e.target.value})} 
                        placeholder="Nome fantasia da empresa"
                      />
                    </div>
                    <div>
                      <Label>Razão Social</Label>
                      <Input 
                        value={companyForm.razao_social} 
                        onChange={e => setCompanyForm({...companyForm, razao_social: e.target.value})} 
                        placeholder="Razão social"
                      />
                    </div>
                    <div>
                      <Label>CNPJ</Label>
                      <Input 
                        value={companyForm.cnpj} 
                        onChange={e => setCompanyForm({...companyForm, cnpj: formatCNPJ(e.target.value)})} 
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                      />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input 
                        type="email" 
                        value={companyForm.email} 
                        onChange={e => setCompanyForm({...companyForm, email: e.target.value})} 
                        placeholder="contato@empresa.com"
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input 
                        value={companyForm.phone} 
                        onChange={e => setCompanyForm({...companyForm, phone: formatPhone(e.target.value)})} 
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium mb-4">Endereço</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label>CEP</Label>
                        <div className="relative">
                          <Input 
                            value={companyForm.zip_code} 
                            onChange={e => handleCepChange(e.target.value)} 
                            placeholder="00000-000"
                            maxLength={9}
                          />
                          {searchingCep && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Logradouro</Label>
                        <Input 
                          value={companyForm.address} 
                          onChange={e => setCompanyForm({...companyForm, address: e.target.value})} 
                          placeholder="Rua, Avenida, etc."
                        />
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input 
                          value={companyForm.number} 
                          onChange={e => setCompanyForm({...companyForm, number: e.target.value})} 
                          placeholder="Nº"
                        />
                      </div>
                      <div>
                        <Label>Complemento</Label>
                        <Input 
                          value={companyForm.complement} 
                          onChange={e => setCompanyForm({...companyForm, complement: e.target.value})} 
                          placeholder="Sala, Andar, etc."
                        />
                      </div>
                      <div>
                        <Label>Bairro</Label>
                        <Input 
                          value={companyForm.neighborhood} 
                          onChange={e => setCompanyForm({...companyForm, neighborhood: e.target.value})} 
                          placeholder="Bairro"
                        />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input 
                          value={companyForm.city} 
                          onChange={e => setCompanyForm({...companyForm, city: e.target.value})} 
                          placeholder="Cidade"
                        />
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Input 
                          maxLength={2} 
                          value={companyForm.state} 
                          onChange={e => setCompanyForm({...companyForm, state: e.target.value.toUpperCase()})} 
                          placeholder="UF"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logos Section - Only for matriz */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-medium mb-2">Logos da Matriz (Principal)</h3>
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Estas logos são as principais da empresa e serão exibidas na <strong>Landing Page</strong> e na <strong>Tela de Login</strong>.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ImageUpload
                        label="Logo Principal (Fundo escuro)"
                        description="Usada na landing page, login e menus"
                        currentUrl={companyForm.logo_url}
                        tenantId={tenant?.id || ''}
                        folder="logos"
                        aspectRatio="square"
                        onUploadComplete={(url) => setCompanyForm({...companyForm, logo_url: url})}
                      />
                      <ImageUpload
                        label="Logo (Fundo claro)"
                        description="Usada em todos os relatórios PDF"
                        currentUrl={companyForm.logo_dark_url}
                        tenantId={tenant?.id || ''}
                        folder="logos"
                        aspectRatio="square"
                        onUploadComplete={(url) => setCompanyForm({...companyForm, logo_dark_url: url})}
                      />
                    </div>
                    <div className="mt-4">
                      <ImageUpload
                        label="Imagem de Fundo (Login)"
                        description="Imagem de fundo da tela de login"
                        currentUrl={companyForm.background_url}
                        tenantId={tenant?.id || ''}
                        folder="backgrounds"
                        aspectRatio="video"
                        onUploadComplete={(url) => setCompanyForm({...companyForm, background_url: url})}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveCompany} disabled={saving} className="mt-4">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Dados da Empresa
                  </Button>

                  <div className="p-4 bg-muted/50 rounded-lg border mt-6">
                    <p className="text-sm text-muted-foreground">
                      <strong>Nota:</strong> O gerenciamento de usuários e permissões está disponível no painel do SuperAdmin.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="landing" className="mt-6">
              <GenericLandingEditor 
                tenantId={tenant?.id || ''} 
                initialContent={landingPageContent}
                onSave={handleRefreshLandingContent}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="dados" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Dados da Filial
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Dados da Filial: {currentBranch?.name}
                  </CardTitle>
                  <CardDescription>Configure os dados e logos específicas desta filial para uso em relatórios</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Dados da Filial */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Informações Cadastrais</h3>
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Estes dados serão utilizados nos <strong>relatórios e documentos</strong> gerados para esta filial.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome Fantasia</Label>
                        <Input 
                          value={branchForm.name} 
                          onChange={e => setBranchForm({...branchForm, name: e.target.value})} 
                          placeholder="Nome fantasia da filial"
                        />
                      </div>
                      <div>
                        <Label>Razão Social</Label>
                        <Input 
                          value={branchForm.razao_social} 
                          onChange={e => setBranchForm({...branchForm, razao_social: e.target.value})} 
                          placeholder="Razão social"
                        />
                      </div>
                      <div>
                        <Label>CNPJ</Label>
                        <Input 
                          value={branchForm.cnpj} 
                          onChange={e => setBranchForm({...branchForm, cnpj: formatCNPJ(e.target.value)})} 
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                        />
                      </div>
                      <div>
                        <Label>Inscrição Estadual</Label>
                        <Input 
                          value={branchForm.inscricao_estadual} 
                          onChange={e => setBranchForm({...branchForm, inscricao_estadual: e.target.value})} 
                          placeholder="Inscrição estadual"
                        />
                      </div>
                      <div>
                        <Label>Inscrição Municipal</Label>
                        <Input 
                          value={branchForm.inscricao_municipal} 
                          onChange={e => setBranchForm({...branchForm, inscricao_municipal: e.target.value})} 
                          placeholder="Inscrição municipal"
                        />
                      </div>
                      <div>
                        <Label>E-mail</Label>
                        <Input 
                          type="email" 
                          value={branchForm.email} 
                          onChange={e => setBranchForm({...branchForm, email: e.target.value})} 
                          placeholder="contato@filial.com"
                        />
                      </div>
                      <div>
                        <Label>Telefone</Label>
                        <Input 
                          value={branchForm.phone} 
                          onChange={e => setBranchForm({...branchForm, phone: formatPhone(e.target.value)})} 
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Endereço</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label>CEP</Label>
                        <div className="relative">
                          <Input 
                            value={branchForm.zip_code} 
                            onChange={e => handleBranchCepChange(e.target.value)} 
                            placeholder="00000-000"
                            maxLength={9}
                          />
                          {searchingBranchCep && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Logradouro</Label>
                        <Input 
                          value={branchForm.address} 
                          onChange={e => setBranchForm({...branchForm, address: e.target.value})} 
                          placeholder="Rua, Avenida, etc."
                        />
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input 
                          value={branchForm.number} 
                          onChange={e => setBranchForm({...branchForm, number: e.target.value})} 
                          placeholder="Nº"
                        />
                      </div>
                      <div>
                        <Label>Complemento</Label>
                        <Input 
                          value={branchForm.complement} 
                          onChange={e => setBranchForm({...branchForm, complement: e.target.value})} 
                          placeholder="Sala, Andar, etc."
                        />
                      </div>
                      <div>
                        <Label>Bairro</Label>
                        <Input 
                          value={branchForm.neighborhood} 
                          onChange={e => setBranchForm({...branchForm, neighborhood: e.target.value})} 
                          placeholder="Bairro"
                        />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input 
                          value={branchForm.city} 
                          onChange={e => setBranchForm({...branchForm, city: e.target.value})} 
                          placeholder="Cidade"
                        />
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Input 
                          maxLength={2} 
                          value={branchForm.state} 
                          onChange={e => setBranchForm({...branchForm, state: e.target.value.toUpperCase()})} 
                          placeholder="UF"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logos */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-2">Logos da Filial</h3>
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Estas logos são específicas desta filial e serão exibidas nos <strong>relatórios da filial</strong>.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ImageUpload
                        label="Logo da Filial (Fundo escuro)"
                        description="Para cabeçalhos e menus com fundo escuro"
                        currentUrl={branchLogos.logo_url}
                        tenantId={tenant?.id || ''}
                        folder={`branches/${currentBranch?.id}/logos`}
                        aspectRatio="square"
                        onUploadComplete={(url) => setBranchLogos({...branchLogos, logo_url: url})}
                      />
                      <ImageUpload
                        label="Logo da Filial (Fundo claro)"
                        description="Usada em relatórios PDF da filial"
                        currentUrl={branchLogos.logo_dark_url}
                        tenantId={tenant?.id || ''}
                        folder={`branches/${currentBranch?.id}/logos`}
                        aspectRatio="square"
                        onUploadComplete={(url) => setBranchLogos({...branchLogos, logo_dark_url: url})}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveBranch} disabled={saving} className="mt-4">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Dados da Filial
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usuarios" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários da Filial
                  </CardTitle>
                  <CardDescription>Gerencie os usuários que têm acesso a esta filial</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentBranch?.id && (
                    <BranchUsersPanel branchId={currentBranch.id} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
