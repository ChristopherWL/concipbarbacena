import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Palette, Save, RotateCcw, Home, Globe, Plus, Trash2, Eye, Building2, Shield, Zap, Sparkles } from 'lucide-react';
import { ImageUpload } from '@/components/settings/ImageUpload';

interface ThemeSettings {
  primary_color: string;
  primary_opacity: number;
  secondary_color: string;
  secondary_opacity: number;
  menu_color: string;
  theme: string;
}

interface LoginFeature {
  icon: string;
  text: string;
}

interface LoginSettings {
  logo_url: string;
  background_url: string;
  title: string;
  subtitle: string;
  description: string;
  features: LoginFeature[];
}

interface LandingSettings {
  companyName: string;
  logoUrl: string;
  logoDarkUrl: string;
  badge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
  primaryButtonColor: string;
  secondaryButtonColor: string;
  highlightColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  accentColor: string;
  lightEffectColor: string;
}

const defaultTheme: ThemeSettings = {
  primary_color: '#3b82f6',
  primary_opacity: 100,
  secondary_color: '#f0f4f8',
  secondary_opacity: 100,
  menu_color: '#1e3a5f',
  theme: 'light',
};

const defaultLogin: LoginSettings = {
  logo_url: '',
  background_url: '',
  title: 'Gestão Empresarial',
  subtitle: 'Simplificada',
  description: 'Controle completo do seu negócio em uma única plataforma inteligente.',
  features: [
    { icon: 'shield', text: 'Segurança de dados garantida' },
    { icon: 'zap', text: 'Performance otimizada' },
    { icon: 'sparkles', text: 'Interface intuitiva' },
  ],
};

const defaultLanding: LandingSettings = {
  companyName: 'Sistema ERP',
  logoUrl: '',
  logoDarkUrl: '',
  badge: 'Plataforma completa de gestão empresarial',
  heroTitle: 'Transforme sua',
  heroTitleHighlight: 'Gestão Empresarial',
  heroDescription: 'Estoque, ordens de serviço, frota, equipes, notas fiscais e relatórios.',
  ctaPrimary: 'Acessar Sistema',
  ctaSecondary: 'Conhecer Módulos',
  primaryButtonColor: '#3b82f6',
  secondaryButtonColor: '#1e40af',
  highlightColor: '#60a5fa',
  backgroundGradientFrom: '#020617',
  backgroundGradientTo: '#0f172a',
  accentColor: '#3b82f6',
  lightEffectColor: '#8b5cf6',
};

const hexToHSL = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 207, s: 50, l: 50 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const applyPrimaryColor = (color: string, opacity: number) => {
  const hsl = hexToHSL(color);
  document.documentElement.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  document.documentElement.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  document.documentElement.style.setProperty('--brand', `${hsl.h} ${Math.round(hsl.s * 0.9)}% ${Math.round(hsl.l * 0.85)}%`);
  document.documentElement.style.setProperty('--accent', `${hsl.h} ${Math.round(hsl.s * 0.6)}% ${93}%`);
  document.documentElement.style.setProperty('--accent-foreground', `${hsl.h} ${Math.round(hsl.s * 0.9)}% ${Math.round(hsl.l * 0.85)}%`);
};

const applySecondaryColor = (color: string, opacity: number) => {
  const hsl = hexToHSL(color);
  const opacityFactor = opacity / 100;
  const adjustedL = Math.round(hsl.l + ((100 - hsl.l) * (1 - opacityFactor)));

  // Increase contrast between background and "surface" components (tabs, inputs, cards)
  document.documentElement.style.setProperty('--background', `${hsl.h} ${Math.round(hsl.s * 0.2)}% ${adjustedL}%`);
  document.documentElement.style.setProperty('--muted', `${hsl.h} ${Math.round(hsl.s * 0.15)}% ${Math.max(adjustedL - 10, 0)}%`);
  document.documentElement.style.setProperty('--secondary', `${hsl.h} ${Math.round(hsl.s * 0.15)}% ${Math.max(adjustedL - 7, 0)}%`);
};

const applyMenuColor = (color: string) => {
  const hsl = hexToHSL(color);
  const isLight = hsl.l >= 70;
  const bgL = hsl.l;
  const fg = isLight ? `${hsl.h} 15% 14%` : `${hsl.h} 20% 98%`;
  const accentL = isLight ? Math.max(bgL - 8, 0) : Math.min(bgL + 6, 100);
  const borderL = isLight ? Math.max(bgL - 14, 0) : Math.min(bgL + 10, 100);

  document.documentElement.style.setProperty('--custom-menu-bg', `${hsl.h} ${hsl.s}% ${bgL}%`);
  document.documentElement.style.setProperty('--custom-menu-fg', fg);
  document.documentElement.style.setProperty('--custom-menu-accent', `${hsl.h} ${Math.max(hsl.s - 5, 0)}% ${accentL}%`);
  document.documentElement.style.setProperty('--custom-menu-border', `${hsl.h} ${Math.max(hsl.s - 10, 0)}% ${borderL}%`);
  document.documentElement.style.setProperty('--sidebar-background', `${hsl.h} ${hsl.s}% ${bgL}%`);
  document.documentElement.style.setProperty('--sidebar-foreground', fg);
  document.documentElement.style.setProperty('--sidebar-accent', `${hsl.h} ${Math.max(hsl.s - 5, 0)}% ${accentL}%`);
  document.documentElement.style.setProperty('--sidebar-border', `${hsl.h} ${Math.max(hsl.s - 10, 0)}% ${borderL}%`);
  document.documentElement.style.setProperty('--header-background', `${hsl.h} ${Math.max(hsl.s - 5, 0)}% ${Math.max(bgL - 2, 0)}%`);
};

const iconOptions = [
  { value: 'shield', label: 'Escudo', Icon: Shield },
  { value: 'zap', label: 'Raio', Icon: Zap },
  { value: 'sparkles', label: 'Brilho', Icon: Sparkles },
];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'shield': return Shield;
    case 'zap': return Zap;
    case 'sparkles': return Sparkles;
    default: return Shield;
  }
};

export function ThemePanel() {
  const { tenant, refetchUserData } = useAuthContext();
  const [themeForm, setThemeForm] = useState<ThemeSettings>(defaultTheme);
  const [loginForm, setLoginForm] = useState<LoginSettings>(defaultLogin);
  const [landingForm, setLandingForm] = useState<LandingSettings>(defaultLanding);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenant?.id) {
      fetchAllSettings();
    }
  }, [tenant?.id]);

  useEffect(() => {
    applyPrimaryColor(themeForm.primary_color, themeForm.primary_opacity);
  }, [themeForm.primary_color, themeForm.primary_opacity]);

  useEffect(() => {
    applySecondaryColor(themeForm.secondary_color, themeForm.secondary_opacity);
  }, [themeForm.secondary_color, themeForm.secondary_opacity]);

  useEffect(() => {
    applyMenuColor(themeForm.menu_color);
    document.documentElement.classList.forEach(cls => {
      if (cls.startsWith('menu-theme-')) document.documentElement.classList.remove(cls);
    });
    document.documentElement.classList.add('menu-theme-custom');
  }, [themeForm.menu_color]);

  const fetchAllSettings = async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('primary_color, secondary_color, theme, menu_color, primary_opacity, secondary_opacity, logo_url, background_url, landing_page_content')
        .eq('id', tenant.id)
        .single();

      if (error) throw error;

      if (data) {
        setThemeForm({
          primary_color: data.primary_color || '#3b82f6',
          primary_opacity: (data as any).primary_opacity ?? 100,
          secondary_color: data.secondary_color || '#f0f4f8',
          secondary_opacity: (data as any).secondary_opacity ?? 100,
          menu_color: (data as any).menu_color || '#1e3a5f',
          theme: data.theme || 'light',
        });

        const loginContent = (data.landing_page_content as any)?.login;
        setLoginForm({
          logo_url: data.logo_url || '',
          background_url: data.background_url || '',
          title: loginContent?.title || 'Gestão Empresarial',
          subtitle: loginContent?.subtitle || 'Simplificada',
          description: loginContent?.description || 'Controle completo do seu negócio em uma única plataforma inteligente.',
          features: loginContent?.features || defaultLogin.features,
        });

        const landingContent = (data.landing_page_content as any)?.generic;
        if (landingContent) {
          setLandingForm({ ...defaultLanding, ...landingContent });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!tenant?.id) {
      toast.error('Empresa não identificada');
      return;
    }

    setIsSaving(true);
    try {
      const existingContent = tenant.landing_page_content || {};
      const updatedContent = {
        ...(existingContent as object),
        login: {
          title: loginForm.title,
          subtitle: loginForm.subtitle,
          description: loginForm.description,
          features: loginForm.features,
        },
        generic: {
          companyName: landingForm.companyName,
          logoUrl: landingForm.logoUrl,
          logoDarkUrl: landingForm.logoDarkUrl,
          badge: landingForm.badge,
          heroTitle: landingForm.heroTitle,
          heroTitleHighlight: landingForm.heroTitleHighlight,
          heroDescription: landingForm.heroDescription,
          ctaPrimary: landingForm.ctaPrimary,
          ctaSecondary: landingForm.ctaSecondary,
          primaryButtonColor: landingForm.primaryButtonColor,
          secondaryButtonColor: landingForm.secondaryButtonColor,
          highlightColor: landingForm.highlightColor,
          backgroundGradientFrom: landingForm.backgroundGradientFrom,
          backgroundGradientTo: landingForm.backgroundGradientTo,
          accentColor: landingForm.accentColor,
          lightEffectColor: landingForm.lightEffectColor,
          // Preserve existing arrays
          ...((existingContent as any)?.generic?.modules && { modules: (existingContent as any).generic.modules }),
          ...((existingContent as any)?.generic?.features && { features: (existingContent as any).generic.features }),
          ...((existingContent as any)?.generic?.stats && { stats: (existingContent as any).generic.stats }),
          showModules: (existingContent as any)?.generic?.showModules ?? true,
          showFeatures: (existingContent as any)?.generic?.showFeatures ?? true,
          showStats: (existingContent as any)?.generic?.showStats ?? true,
        },
      };

      const { error } = await supabase
        .from('tenants')
        .update({
          primary_color: themeForm.primary_color,
          secondary_color: themeForm.secondary_color,
          theme: themeForm.theme,
          menu_color: themeForm.menu_color,
          primary_opacity: themeForm.primary_opacity,
          secondary_opacity: themeForm.secondary_opacity,
          logo_url: loginForm.logo_url || null,
          background_url: loginForm.background_url || null,
          landing_page_content: JSON.parse(JSON.stringify(updatedContent)),
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      refetchUserData?.();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetTheme = () => {
    setThemeForm(defaultTheme);
    toast.info('Tema restaurado para o padrão. Clique em Salvar para aplicar.');
  };

  const updateLoginFeature = (index: number, field: 'icon' | 'text', value: string) => {
    setLoginForm(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? { ...f, [field]: value } : f)
    }));
  };

  const addLoginFeature = () => {
    if (loginForm.features.length >= 5) {
      toast.error('Máximo de 5 recursos');
      return;
    }
    setLoginForm(prev => ({
      ...prev,
      features: [...prev.features, { icon: 'shield', text: '' }]
    }));
  };

  const removeLoginFeature = (index: number) => {
    setLoginForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
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
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="p-3 sm:p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-white text-sm">
                <Palette className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Personalização</span>
              </CardTitle>
              <CardDescription className="text-white/50 text-xs hidden sm:block">
                Cores, login e landing page
              </CardDescription>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="outline" onClick={handleResetTheme} size="sm" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white px-2">
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button onClick={handleSaveAll} disabled={isSaving} size="sm">
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
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <Tabs defaultValue="theme" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4 bg-white/10 h-8">
              <TabsTrigger value="theme" className="text-[10px] sm:text-xs data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 px-1 sm:px-2">
                <Palette className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Cores</span>
              </TabsTrigger>
              <TabsTrigger value="login" className="text-[10px] sm:text-xs data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 px-1 sm:px-2">
                <Home className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Login</span>
              </TabsTrigger>
              <TabsTrigger value="landing" className="text-[10px] sm:text-xs data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 px-1 sm:px-2">
                <Globe className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Landing</span>
              </TabsTrigger>
            </TabsList>

            {/* Theme Colors Tab */}
            <TabsContent value="theme" className="space-y-3">
              {/* Primary Color */}
              <div className="space-y-2 p-3 border border-white/10 rounded-lg bg-white/5">
                <div>
                  <Label className="text-xs font-semibold text-white">Cor Primária</Label>
                  <p className="text-[10px] text-white/50">Botões e destaques</p>
                </div>
                <div className="grid gap-2 grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-white/70 text-[10px]">Cor</Label>
                    <div className="flex gap-1">
                      <Input type="color" value={themeForm.primary_color} onChange={e => setThemeForm({...themeForm, primary_color: e.target.value})} className="w-10 h-8 p-1 cursor-pointer bg-transparent border border-white/20 rounded-md" />
                      <Input value={themeForm.primary_color} onChange={e => setThemeForm({...themeForm, primary_color: e.target.value})} className="flex-1 bg-white/5 border-white/10 text-white h-8 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/70 text-[10px]">Intensidade: {themeForm.primary_opacity}%</Label>
                    <Slider value={[themeForm.primary_opacity]} onValueChange={([v]) => setThemeForm({...themeForm, primary_opacity: v})} min={20} max={100} step={5} className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Secondary Color */}
              <div className="space-y-2 p-3 border border-white/10 rounded-lg bg-white/5">
                <div>
                  <Label className="text-xs font-semibold text-white">Cor Secundária</Label>
                  <p className="text-[10px] text-white/50">Fundo das páginas</p>
                </div>
                <div className="grid gap-2 grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-white/70 text-[10px]">Cor</Label>
                    <div className="flex gap-1">
                      <Input type="color" value={themeForm.secondary_color} onChange={e => setThemeForm({...themeForm, secondary_color: e.target.value})} className="w-10 h-8 p-1 cursor-pointer bg-transparent border border-white/20 rounded-md" />
                      <Input value={themeForm.secondary_color} onChange={e => setThemeForm({...themeForm, secondary_color: e.target.value})} className="flex-1 bg-white/5 border-white/10 text-white h-8 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white/70 text-[10px]">Intensidade: {themeForm.secondary_opacity}%</Label>
                    <Slider value={[themeForm.secondary_opacity]} onValueChange={([v]) => setThemeForm({...themeForm, secondary_opacity: v})} min={20} max={100} step={5} className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Menu Color */}
              <div className="space-y-2 p-3 border border-white/10 rounded-lg bg-white/5">
                <div>
                  <Label className="text-xs font-semibold text-white">Cor do Menu</Label>
                  <p className="text-[10px] text-white/50">Menu lateral</p>
                </div>
                <div className="flex gap-1">
                  <Input type="color" value={themeForm.menu_color} onChange={e => setThemeForm({...themeForm, menu_color: e.target.value})} className="w-10 h-8 p-1 cursor-pointer bg-transparent border border-white/20 rounded-md" />
                  <Input value={themeForm.menu_color} onChange={e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) setThemeForm({...themeForm, menu_color: e.target.value}); }} className="flex-1 bg-white/5 border-white/10 text-white h-8 text-xs" />
                </div>
              </div>

              {/* Theme Mode */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <Label className="text-xs font-semibold text-white">Modo do Tema</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setThemeForm({...themeForm, theme: 'light'}); document.documentElement.classList.remove('dark'); }}
                    className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${themeForm.theme === 'light' ? 'border-primary bg-primary/20' : 'border-white/10 hover:border-white/30'}`}>
                    <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white text-xs">Claro</p>
                    </div>
                  </button>
                  <button type="button" onClick={() => { setThemeForm({...themeForm, theme: 'dark'}); document.documentElement.classList.add('dark'); }}
                    className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${themeForm.theme === 'dark' ? 'border-primary bg-primary/20' : 'border-white/10 hover:border-white/30'}`}>
                    <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white text-xs">Escuro</p>
                    </div>
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-6">
              {/* Preview */}
              <div className="relative h-40 rounded-lg overflow-hidden" style={{
                backgroundImage: loginForm.background_url ? `url(${loginForm.background_url})` : `linear-gradient(135deg, ${themeForm.primary_color} 0%, ${themeForm.menu_color} 100%)`,
                backgroundSize: 'cover', backgroundPosition: 'center'
              }}>
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 h-full flex items-center justify-between p-4">
                  <div className="hidden sm:block max-w-[200px]">
                    {loginForm.logo_url && <img src={loginForm.logo_url} alt="Logo" className="h-8 mb-2" />}
                    <h3 className="text-sm font-bold text-white">{loginForm.title}</h3>
                    <p className="text-xs text-white/70">{loginForm.subtitle}</p>
                  </div>
                  <div className="w-32 bg-white/10 backdrop-blur rounded p-2 text-center">
                    <p className="text-[8px] text-white font-medium">Login Card</p>
                    <div className="h-3 bg-black/30 rounded mt-1" />
                    <div className="h-3 bg-black/30 rounded mt-1" />
                    <div className="h-3 bg-primary rounded mt-1" />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUpload label="Logo (Fundo escuro)" description="Exibida na tela de login" currentUrl={loginForm.logo_url} tenantId={tenant?.id || ''} folder="logos" aspectRatio="square" onUploadComplete={url => setLoginForm({...loginForm, logo_url: url})} />
                <ImageUpload label="Imagem de Fundo" description="Fundo da tela de login" currentUrl={loginForm.background_url} tenantId={tenant?.id || ''} folder="backgrounds" aspectRatio="wide" onUploadComplete={url => setLoginForm({...loginForm, background_url: url})} />
              </div>

              {/* Texts */}
              <div className="space-y-4 p-4 border border-white/10 rounded-lg bg-white/5">
                <Label className="text-base font-semibold text-white">Textos Laterais (Desktop)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/70">Título</Label>
                    <Input value={loginForm.title} onChange={e => setLoginForm({...loginForm, title: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-white/70">Subtítulo</Label>
                    <Input value={loginForm.subtitle} onChange={e => setLoginForm({...loginForm, subtitle: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
                <div>
                  <Label className="text-white/70">Descrição</Label>
                  <Textarea value={loginForm.description} onChange={e => setLoginForm({...loginForm, description: e.target.value})} rows={2} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 p-4 border border-white/10 rounded-lg bg-white/5">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-white">Cards de Recursos</Label>
                  <Button variant="outline" size="sm" onClick={addLoginFeature} disabled={loginForm.features.length >= 5} className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {loginForm.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 border border-white/10 rounded bg-white/5">
                      <select value={f.icon} onChange={e => updateLoginFeature(i, 'icon', e.target.value)} className="h-9 px-2 border border-white/10 rounded bg-slate-800 text-white text-sm [&>option]:bg-slate-800 [&>option]:text-white">
                        {iconOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">{opt.label}</option>)}
                      </select>
                      <Input value={f.text} onChange={e => updateLoginFeature(i, 'text', e.target.value)} placeholder="Texto" className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                      <Button variant="ghost" size="icon" onClick={() => removeLoginFeature(i)} className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/20">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Landing Tab */}
            <TabsContent value="landing" className="space-y-6">
              {/* Preview */}
              <div className="relative h-40 rounded-lg overflow-hidden" style={{
                background: `linear-gradient(135deg, ${landingForm.backgroundGradientFrom} 0%, ${landingForm.backgroundGradientTo} 100%)`
              }}>
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-4">
                  <p className="text-[8px] px-2 py-0.5 bg-white/10 rounded text-white/80">{landingForm.badge}</p>
                  <h3 className="text-sm font-bold text-white mt-1">{landingForm.heroTitle} <span style={{ color: landingForm.highlightColor }}>{landingForm.heroTitleHighlight}</span></h3>
                  <p className="text-[8px] text-white/70 mt-1 max-w-[200px]">{landingForm.heroDescription}</p>
                  <div className="flex gap-2 mt-2">
                    <div className="px-2 py-1 rounded text-[8px] text-white" style={{ background: `linear-gradient(135deg, ${landingForm.primaryButtonColor}, ${landingForm.highlightColor})` }}>{landingForm.ctaPrimary}</div>
                    <div className="px-2 py-1 rounded text-[8px] border border-white/20 text-white">{landingForm.ctaSecondary}</div>
                  </div>
                </div>
              </div>

              {/* Logo Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUpload label="Logo (Fundo escuro)" description="Header da landing page" currentUrl={landingForm.logoUrl} tenantId={tenant?.id || ''} folder="logos" aspectRatio="square" onUploadComplete={url => setLandingForm({...landingForm, logoUrl: url})} />
                <ImageUpload label="Logo (Fundo claro)" description="Alternativa para fundos claros" currentUrl={landingForm.logoDarkUrl} tenantId={tenant?.id || ''} folder="logos" aspectRatio="square" onUploadComplete={url => setLandingForm({...landingForm, logoDarkUrl: url})} />
              </div>

              {/* Hero Texts */}
              <div className="space-y-4 p-4 border border-white/10 rounded-lg bg-white/5">
                <Label className="text-base font-semibold text-white">Textos do Hero</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/70">Nome da Empresa</Label>
                    <Input value={landingForm.companyName} onChange={e => setLandingForm({...landingForm, companyName: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-white/70">Badge</Label>
                    <Input value={landingForm.badge} onChange={e => setLandingForm({...landingForm, badge: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/70">Título</Label>
                    <Input value={landingForm.heroTitle} onChange={e => setLandingForm({...landingForm, heroTitle: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-white/70">Destaque</Label>
                    <Input value={landingForm.heroTitleHighlight} onChange={e => setLandingForm({...landingForm, heroTitleHighlight: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
                <div>
                  <Label className="text-white/70">Descrição</Label>
                  <Textarea value={landingForm.heroDescription} onChange={e => setLandingForm({...landingForm, heroDescription: e.target.value})} rows={2} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/70">Botão Primário</Label>
                    <Input value={landingForm.ctaPrimary} onChange={e => setLandingForm({...landingForm, ctaPrimary: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-white/70">Botão Secundário</Label>
                    <Input value={landingForm.ctaSecondary} onChange={e => setLandingForm({...landingForm, ctaSecondary: e.target.value})} className="bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-4 p-4 border border-white/10 rounded-lg bg-white/5">
                <Label className="text-base font-semibold text-white">Cores da Landing Page</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-white/70">Botão Primário</Label>
                    <div className="flex gap-1 mt-1">
                      <Input type="color" value={landingForm.primaryButtonColor} onChange={e => setLandingForm({...landingForm, primaryButtonColor: e.target.value})} className="w-10 h-8 p-0.5 bg-transparent border border-white/20 rounded-md cursor-pointer" />
                      <Input value={landingForm.primaryButtonColor} onChange={e => setLandingForm({...landingForm, primaryButtonColor: e.target.value})} className="flex-1 h-8 text-xs bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/70">Botão Secundário</Label>
                    <div className="flex gap-1 mt-1">
                      <Input type="color" value={landingForm.secondaryButtonColor} onChange={e => setLandingForm({...landingForm, secondaryButtonColor: e.target.value})} className="w-10 h-8 p-0.5 bg-transparent border border-white/20 rounded-md cursor-pointer" />
                      <Input value={landingForm.secondaryButtonColor} onChange={e => setLandingForm({...landingForm, secondaryButtonColor: e.target.value})} className="flex-1 h-8 text-xs bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/70">Destaque</Label>
                    <div className="flex gap-1 mt-1">
                      <Input type="color" value={landingForm.highlightColor} onChange={e => setLandingForm({...landingForm, highlightColor: e.target.value})} className="w-10 h-8 p-0.5 bg-transparent border border-white/20 rounded-md cursor-pointer" />
                      <Input value={landingForm.highlightColor} onChange={e => setLandingForm({...landingForm, highlightColor: e.target.value})} className="flex-1 h-8 text-xs bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/70">Gradiente (De)</Label>
                    <div className="flex gap-1 mt-1">
                      <Input type="color" value={landingForm.backgroundGradientFrom} onChange={e => setLandingForm({...landingForm, backgroundGradientFrom: e.target.value})} className="w-10 h-8 p-0.5 bg-transparent border border-white/20 rounded-md cursor-pointer" />
                      <Input value={landingForm.backgroundGradientFrom} onChange={e => setLandingForm({...landingForm, backgroundGradientFrom: e.target.value})} className="flex-1 h-8 text-xs bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/70">Gradiente (Para)</Label>
                    <div className="flex gap-1 mt-1">
                      <Input type="color" value={landingForm.backgroundGradientTo} onChange={e => setLandingForm({...landingForm, backgroundGradientTo: e.target.value})} className="w-10 h-8 p-0.5 bg-transparent border border-white/20 rounded-md cursor-pointer" />
                      <Input value={landingForm.backgroundGradientTo} onChange={e => setLandingForm({...landingForm, backgroundGradientTo: e.target.value})} className="flex-1 h-8 text-xs bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-white/70">Efeitos de Luz</Label>
                    <div className="flex gap-1 mt-1">
                      <Input type="color" value={landingForm.lightEffectColor} onChange={e => setLandingForm({...landingForm, lightEffectColor: e.target.value})} className="w-10 h-8 p-0.5 bg-transparent border border-white/20 rounded-md cursor-pointer" />
                      <Input value={landingForm.lightEffectColor} onChange={e => setLandingForm({...landingForm, lightEffectColor: e.target.value})} className="flex-1 h-8 text-xs bg-white/5 border-white/10 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/50">
                  Para configurar módulos, features e estatísticas, acesse Configurações → Landing Page.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
