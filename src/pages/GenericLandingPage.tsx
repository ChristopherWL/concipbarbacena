import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Building2, Play, ChevronDown, Sparkles, Star, Menu, X,
  Package, Truck, Users, ClipboardList, BarChart3, FileText, Shield, Zap, Clock,
  Lightbulb, Wifi, Camera, Sun, Radio, Globe, Wrench, MapPin, CheckCircle, Award
} from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Stat {
  id?: string;
  value: string;
  label: string;
}

interface Module {
  id?: string;
  title: string;
  description: string;
  icon: string;
}

interface Feature {
  id?: string;
  title: string;
  description: string;
  icon: string;
}

interface GenericContent {
  companyName: string;
  companySubtitle: string;
  logoUrl: string;
  logoDarkUrl: string;
  badge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
  stats: Stat[];
  showStats: boolean;
  modules: Module[];
  features: Feature[];
  showModules: boolean;
  showFeatures: boolean;
  ctaTitle: string;
  ctaDescription: string;
  primaryButtonColor: string;
  secondaryButtonColor: string;
  highlightColor: string;
  accentColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  lightEffectColor: string;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  'package': Package,
  'truck': Truck,
  'users': Users,
  'clipboard-list': ClipboardList,
  'bar-chart': BarChart3,
  'file-text': FileText,
  'shield': Shield,
  'zap': Zap,
  'clock': Clock,
};

export default function GenericLandingPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState<GenericContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sign out user when they return to the landing page
  useEffect(() => {
    const signOutUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }
    };
    signOutUser();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Use edge function to fetch public branding (bypasses RLS)
        const { data: result, error } = await supabase.functions.invoke('get-public-branding');
        if (error) throw error;
        
        const data = result?.branding;

        if (data) {
          const lp = (data.landing_page_content as any) || {};
          const generic = lp.generic || {};

          setContent({
            companyName: generic.companyName || data.name || 'Sistema ERP',
            companySubtitle: generic.companySubtitle || '',
            logoUrl: data.logo_url || generic.logoUrl || '',
            logoDarkUrl: generic.logoDarkUrl || '',
            badge: generic.badge || '',
            heroTitle: generic.heroTitle || 'Bem-vindo',
            heroTitleHighlight: generic.heroTitleHighlight || '',
            heroDescription: generic.heroDescription || 'Sistema de gestão empresarial',
            ctaPrimary: generic.ctaPrimary || 'Acessar Sistema',
            ctaSecondary: generic.ctaSecondary || '',
            stats: generic.stats || [],
            showStats: generic.showStats !== false,
            modules: generic.modules || [],
            features: generic.features || [],
            showModules: generic.showModules !== false,
            showFeatures: generic.showFeatures !== false,
            ctaTitle: generic.ctaTitle || 'Pronto para começar?',
            ctaDescription: generic.ctaDescription || 'Acesse o sistema e transforme sua gestão.',
            primaryButtonColor: generic.primaryButtonColor || '#3b82f6',
            secondaryButtonColor: generic.secondaryButtonColor || '#1e40af',
            highlightColor: generic.highlightColor || '#60a5fa',
            accentColor: generic.accentColor || '#3b82f6',
            backgroundGradientFrom: generic.backgroundGradientFrom || '#020617',
            backgroundGradientTo: generic.backgroundGradientTo || '#0f172a',
            lightEffectColor: generic.lightEffectColor || '#8b5cf6',
          });
        } else {
          // Set default content when no data exists
          setContent({
            companyName: 'Sistema ERP',
            companySubtitle: '',
            logoUrl: '',
            logoDarkUrl: '',
            badge: '',
            heroTitle: 'Bem-vindo',
            heroTitleHighlight: 'ao Sistema',
            heroDescription: 'Sistema de gestão empresarial completo',
            ctaPrimary: 'Acessar Sistema',
            ctaSecondary: '',
            stats: [],
            showStats: false,
            modules: [],
            features: [],
            showModules: false,
            showFeatures: false,
            ctaTitle: 'Pronto para começar?',
            ctaDescription: 'Acesse o sistema e transforme sua gestão.',
            primaryButtonColor: '#3b82f6',
            secondaryButtonColor: '#1e40af',
            highlightColor: '#60a5fa',
            accentColor: '#3b82f6',
            backgroundGradientFrom: '#020617',
            backgroundGradientTo: '#0f172a',
            lightEffectColor: '#8b5cf6',
          });
        }
      } catch (error) {
        console.error('Error fetching landing page content:', error);
        // Set default content on error
        setContent({
          companyName: 'Sistema ERP',
          companySubtitle: '',
          logoUrl: '',
          logoDarkUrl: '',
          badge: '',
          heroTitle: 'Bem-vindo',
          heroTitleHighlight: 'ao Sistema',
          heroDescription: 'Sistema de gestão empresarial completo',
          ctaPrimary: 'Acessar Sistema',
          ctaSecondary: '',
          stats: [],
          showStats: false,
          modules: [],
          features: [],
          showModules: false,
          showFeatures: false,
          ctaTitle: 'Pronto para começar?',
          ctaDescription: 'Acesse o sistema e transforme sua gestão.',
          primaryButtonColor: '#3b82f6',
          secondaryButtonColor: '#1e40af',
          highlightColor: '#60a5fa',
          accentColor: '#3b82f6',
          backgroundGradientFrom: '#020617',
          backgroundGradientTo: '#0f172a',
          lightEffectColor: '#8b5cf6',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (isLoading) {
    return <PageLoading text="Carregando" />;
  }

  if (!content) {
    return null;
  }

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes lightMove1 {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(15%, -10%) scale(1.1); }
          50% { transform: translate(-10%, 15%) scale(0.95); }
          75% { transform: translate(-15%, -5%) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes lightMove2 {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-20%, 12%) scale(1.15); }
          50% { transform: translate(10%, -15%) scale(0.9); }
          75% { transform: translate(18%, 8%) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes lightMove3 {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(12%, 18%) scale(1.12); }
          50% { transform: translate(-18%, -8%) scale(0.92); }
          75% { transform: translate(-8%, 12%) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes lightMove4 {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-15%, -15%) scale(1.08); }
          50% { transform: translate(15%, 10%) scale(0.95); }
          75% { transform: translate(8%, -12%) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes drift {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(20px) translateY(-15px); }
          50% { transform: translateX(0) translateY(-25px); }
          75% { transform: translateX(-20px) translateY(-10px); }
          100% { transform: translateX(0) translateY(0); }
        }
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .hero-animate { 
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .float { animation: float 6s ease-in-out infinite; }
        .light-move-1 { 
          animation: lightMove1 5s linear infinite; 
          will-change: transform;
        }
        .light-move-2 { 
          animation: lightMove2 6s linear infinite; 
          will-change: transform;
        }
        .light-move-3 { 
          animation: lightMove3 4s linear infinite; 
          will-change: transform;
        }
        .light-move-4 { 
          animation: lightMove4 5.5s linear infinite; 
          will-change: transform;
        }
        .drift { animation: drift 3s ease-in-out infinite; }
        .glass {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .mobile-menu-enter {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>

      {/* Background Gradient */}
      <div 
        className="absolute inset-0 z-0"
        style={{ 
          background: `linear-gradient(135deg, ${content.backgroundGradientFrom} 0%, ${content.backgroundGradientTo} 100%)` 
        }}
      />

      {/* Subtle Light Effect - Minimalist */}
      <div 
        className="absolute top-[20%] left-[30%] w-[50vw] h-[50vw] rounded-full blur-[150px] z-[1]"
        style={{ background: content.lightEffectColor, opacity: 0.08 }}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[100]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center shrink-0">
              {content.logoUrl ? (
                <img
                  src={content.logoUrl}
                  alt="Logo"
                  className="h-8 sm:h-10 lg:h-12 max-w-[120px] sm:max-w-[150px] lg:max-w-[180px] object-contain"
                />
              ) : (
                <div 
                  className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-white"
                  style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                >
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-4">
              <button 
                onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 lg:px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-all rounded-lg hover:bg-white/10"
              >
                Início
              </button>
              <button 
                onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 lg:px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-all rounded-lg hover:bg-white/10"
              >
                Módulos
              </button>
              <button 
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 lg:px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-all rounded-lg hover:bg-white/10"
              >
                Sobre
              </button>
              <button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-3 lg:px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-all rounded-lg hover:bg-white/10"
              >
                Contato
              </button>
            </nav>

            {/* Desktop Login Button */}
            <Button
              onClick={() => navigate('/auth')}
              className="hidden md:flex shadow-lg transition-all duration-300 hover:scale-105 text-white border-0 text-sm px-4 lg:px-6"
              style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
            >
              Login
              <ChevronDown className="ml-1 lg:ml-2 h-4 w-4 rotate-[-90deg]" />
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Compact Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mx-4 mb-2 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl mobile-menu-enter overflow-hidden">
            <nav className="flex flex-col p-2">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left"
              >
                Início
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left"
              >
                Módulos
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left"
              >
                Sobre
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all text-left"
              >
                Contato
              </button>
              <div className="border-t border-white/10 mt-2 pt-2">
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/auth');
                  }}
                  className="w-full h-10 shadow-lg text-white border-0 text-sm font-medium"
                  style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                >
                  Acessar Sistema
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section - Minimalist */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-20 px-4">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            {/* Title */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] hero-animate text-white tracking-tight"
              style={{ animationDelay: '0.1s' }}
            >
              {content.heroTitle || 'Iluminação'}
              <span className="block" style={{ color: content.highlightColor }}>
                {content.heroTitleHighlight || 'Telecom & Energia'}
              </span>
            </h1>

            {/* Description */}
            <p
              className="text-base sm:text-lg text-white/60 max-w-xl mx-auto mb-10 leading-relaxed hero-animate"
              style={{ animationDelay: '0.2s' }}
            >
              {content.heroDescription || 'Iluminação pública, videomonitoramento, redes WiFi, link dedicado e usinas solares fotovoltaicas.'}
            </p>

            {/* CTA Button - Minimalist */}
            <div className="hero-animate" style={{ animationDelay: '0.3s' }}>
              <Button
                size="lg"
                className="text-base px-8 py-6 hover:scale-105 transition-all duration-300 text-white border-0"
                style={{ 
                  background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})`
                }}
                onClick={() => navigate('/auth')}
              >
                {content.ctaPrimary}
              </Button>
            </div>

            {/* Simple Service Tags */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mt-16 hero-animate" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Lightbulb className="w-4 h-4" />
                <span>Iluminação</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Camera className="w-4 h-4" />
                <span>Câmeras</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Wifi className="w-4 h-4" />
                <span>WiFi</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Sun className="w-4 h-4" />
                <span>Solar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center">
          <ChevronDown className="w-5 h-5 text-white/30 animate-bounce" />
        </div>
      </section>

      {/* Stats Section */}
      {content.showStats && content.stats.length > 0 && (
        <section className="relative z-10 py-12 sm:py-16 px-4">
          <div className="container mx-auto">
            <div
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-5xl mx-auto"
            >
              {content.stats.slice(0, 4).map((stat, index) => (
                <div key={stat.id || index} className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-white/60 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Section - Minimalist */}
      <section id="modules" className="relative z-10 py-20 sm:py-32 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Serviços</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Lightbulb className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-sm text-white/60">Iluminação</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Camera className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-sm text-white/60">Câmeras</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Wifi className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-sm text-white/60">WiFi</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Sun className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-sm text-white/60">Solar</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Globe className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-sm text-white/60">Link Dedicado</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Radio className="w-5 h-5 text-white/70" />
              </div>
              <p className="text-sm text-white/60">Telecom</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {content.showFeatures && content.features.length > 0 && (
        <section className="relative z-10 py-16 sm:py-24 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Por que nos escolher?
              </h2>
              <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto">
                Diferenciais que fazem a diferença no seu dia a dia
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto">
              {content.features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon] || Shield;
                return (
                  <div key={feature.id || index} className="text-center">
                    <div 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                      style={{ background: `${content.primaryButtonColor}20` }}
                    >
                      <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: content.highlightColor }} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-white/60">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* About Section - Minimalist */}
      <section id="about" className="relative z-10 py-20 sm:py-32 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Sobre</h2>
            <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-12">
              Especialistas em iluminação pública, telecomunicações e energia solar. 
              Com mais de uma década de experiência, transformamos cidades com tecnologia e sustentabilidade.
            </p>
            
            {/* Stats - Minimalist */}
            <div className="grid grid-cols-4 gap-8 max-w-xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">+50K</div>
                <div className="text-xs text-white/40 mt-1">Luzes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">+5K</div>
                <div className="text-xs text-white/40 mt-1">Câmeras</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">+10</div>
                <div className="text-xs text-white/40 mt-1">Usinas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">+30</div>
                <div className="text-xs text-white/40 mt-1">Cidades</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Minimalist */}
      <section id="contact" className="relative z-10 py-20 sm:py-32 px-4">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">Contato</h2>
            <div className="space-y-4">
              <p className="text-white/60">contato@sistema.com.br</p>
              <p className="text-white/60">(31) 9999-9999</p>
            </div>
            <div className="mt-12">
              <Button
                size="lg"
                className="text-base px-8 py-6 hover:scale-105 transition-all duration-300 text-white border-0"
                style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                onClick={() => navigate('/auth')}
              >
                {content.ctaPrimary}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6 sm:py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs sm:text-sm text-white/40">
            © {new Date().getFullYear()} {content.companyName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
