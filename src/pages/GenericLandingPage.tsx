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

      {/* Moving Light Focus Effects */}
      <div 
        className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] sm:w-[35vw] sm:h-[35vw] rounded-full blur-[80px] sm:blur-[120px] light-move-1 z-[1]"
        style={{ background: content.lightEffectColor, opacity: 0.25 }}
      />
      <div 
        className="absolute top-[5%] right-[8%] w-[38vw] h-[38vw] sm:w-[32vw] sm:h-[32vw] rounded-full blur-[80px] sm:blur-[120px] light-move-3 z-[1]"
        style={{ background: content.lightEffectColor, opacity: 0.2 }}
      />
      <div 
        className="absolute bottom-[10%] right-[5%] w-[45vw] h-[45vw] sm:w-[40vw] sm:h-[40vw] rounded-full blur-[80px] sm:blur-[120px] light-move-2 z-[1]"
        style={{ background: content.lightEffectColor, opacity: 0.25 }}
      />
      <div 
        className="absolute top-[50%] left-[40%] w-[50vw] h-[50vw] sm:w-[45vw] sm:h-[45vw] rounded-full blur-[100px] sm:blur-[150px] light-move-3 z-[1]"
        style={{ background: content.lightEffectColor, opacity: 0.15 }}
      />
      <div 
        className="absolute top-[30%] right-[20%] w-[35vw] h-[35vw] sm:w-[30vw] sm:h-[30vw] rounded-full blur-[70px] sm:blur-[100px] light-move-4 z-[1]"
        style={{ background: content.lightEffectColor, opacity: 0.2 }}
      />

      {/* Drifting Particles - Visible on all devices */}
      <div className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-white/30 drift z-[2]" />
      <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 rounded-full bg-white/25 drift z-[2]" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[45%] left-[8%] w-1 h-1 rounded-full bg-white/30 drift z-[2]" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[60%] right-[12%] w-2 h-2 rounded-full bg-white/20 drift z-[2]" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[75%] left-[20%] w-1.5 h-1.5 rounded-full bg-white/25 drift z-[2]" style={{ animationDelay: '4s' }} />
      <div className="absolute top-[35%] right-[30%] w-1 h-1 rounded-full bg-white/20 drift z-[2]" style={{ animationDelay: '5s' }} />
      <div className="absolute top-[85%] right-[25%] w-1.5 h-1.5 rounded-full bg-white/15 drift z-[2]" style={{ animationDelay: '6s' }} />
      <div className="absolute top-[50%] left-[25%] w-2 h-2 rounded-full bg-white/20 drift z-[2]" style={{ animationDelay: '7s' }} />
      
      {/* Floating geometric shapes for mobile */}
      <div 
        className="absolute top-[20%] right-[8%] w-8 h-8 sm:w-12 sm:h-12 rounded-lg rotate-45 float z-[2] opacity-20"
        style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, transparent)`, animationDelay: '0s' }}
      />
      <div 
        className="absolute top-[55%] left-[5%] w-6 h-6 sm:w-10 sm:h-10 rounded-full float z-[2] opacity-15"
        style={{ background: `radial-gradient(circle, ${content.highlightColor}, transparent)`, animationDelay: '2s' }}
      />
      <div 
        className="absolute top-[70%] right-[18%] w-4 h-4 sm:w-8 sm:h-8 rounded-lg rotate-12 float z-[2] opacity-20"
        style={{ background: `linear-gradient(45deg, ${content.accentColor}, transparent)`, animationDelay: '4s' }}
      />
      <div 
        className="absolute top-[40%] left-[15%] w-3 h-3 sm:w-6 sm:h-6 rounded-full float z-[2] opacity-25"
        style={{ background: content.lightEffectColor, animationDelay: '1s' }}
      />
      <div 
        className="absolute top-[30%] left-[80%] w-5 h-5 sm:w-8 sm:h-8 rounded-lg rotate-[-20deg] float z-[2] opacity-15"
        style={{ background: `linear-gradient(135deg, ${content.secondaryButtonColor}, transparent)`, animationDelay: '3s' }}
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

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center pt-16 sm:pt-20 pb-16 sm:pb-32 px-4">
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Decorative Icons - Industry themed */}
            <Lightbulb className="absolute -top-4 sm:top-0 right-[15%] sm:right-1/4 w-5 h-5 sm:w-6 sm:h-6 float" style={{ color: `${content.accentColor}80` }} />
            <Sun className="absolute top-16 sm:top-20 left-[10%] sm:left-1/4 w-4 h-4 sm:w-5 sm:h-5 float" style={{ color: '#fbbf24', animationDelay: '1s' }} />
            <Wifi className="absolute top-8 left-[20%] sm:left-[15%] w-4 h-4 sm:w-5 sm:h-5 float" style={{ color: `${content.primaryButtonColor}60`, animationDelay: '2s' }} />
            <Camera className="absolute top-24 right-[12%] sm:right-[18%] w-4 h-4 sm:w-5 sm:h-5 float" style={{ color: `${content.highlightColor}50`, animationDelay: '1.5s' }} />
            <Radio className="absolute top-4 sm:top-8 right-[35%] w-4 h-4 sm:w-5 sm:h-5 float hidden sm:block" style={{ color: `${content.accentColor}40`, animationDelay: '3s' }} />
            <Globe className="absolute top-32 left-[8%] w-4 h-4 sm:w-5 sm:h-5 float hidden sm:block" style={{ color: `${content.primaryButtonColor}50`, animationDelay: '2.5s' }} />

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass text-white/90 text-xs sm:text-sm mb-5 sm:mb-8 hero-animate">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#fbbf24' }} />
              <span className="line-clamp-1">{content.badge || 'Soluções em Infraestrutura e Energia'}</span>
            </div>

            {/* Title */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-3 sm:mb-6 leading-[1.1] hero-animate text-white"
              style={{ animationDelay: '0.1s' }}
            >
              {content.heroTitle || 'Iluminando o Futuro'}
              {(content.heroTitleHighlight || !content.heroTitle) && (
                <span className="block mt-1 sm:mt-2" style={{ color: content.highlightColor }}>
                  {content.heroTitleHighlight || 'Conectando Pessoas'}
                </span>
              )}
            </h1>

            {/* Description */}
            <p
              className="text-sm sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed hero-animate px-2"
              style={{ animationDelay: '0.2s' }}
            >
              {content.heroDescription || 'Especialistas em iluminação pública, telecomunicações e energia solar fotovoltaica. Transformamos cidades com tecnologia e sustentabilidade.'}
            </p>

            {/* Quick Features - Industry themed */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 hero-animate" style={{ animationDelay: '0.25s' }}>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-amber-500/20 text-white/90 text-xs sm:text-sm hover:bg-amber-500/30 transition-colors cursor-default border border-amber-500/30">
                <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                <span>Iluminação Pública</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-500/20 text-white/90 text-xs sm:text-sm hover:bg-blue-500/30 transition-colors cursor-default border border-blue-500/30">
                <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                <span>Câmeras</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-cyan-500/20 text-white/90 text-xs sm:text-sm hover:bg-cyan-500/30 transition-colors cursor-default border border-cyan-500/30">
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                <span>WiFi</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-green-500/20 text-white/90 text-xs sm:text-sm hover:bg-green-500/30 transition-colors cursor-default border border-green-500/30">
                <Sun className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                <span>Usina UFV</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-white/90 text-sm hover:bg-purple-500/30 transition-colors cursor-default border border-purple-500/30">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>Link Dedicado</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-white/90 text-sm hover:bg-orange-500/30 transition-colors cursor-default border border-orange-500/30">
                <Radio className="w-4 h-4 text-orange-400" />
                <span>Telecom</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 hero-animate"
              style={{ animationDelay: '0.3s' }}
            >
              <Button
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 shadow-2xl hover:scale-105 transition-all duration-300 text-white border-0"
                style={{ 
                  background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})`,
                  boxShadow: `0 10px 40px -10px ${content.primaryButtonColor}80`
                }}
                onClick={() => navigate('/auth')}
              >
                <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {content.ctaPrimary}
              </Button>
              {content.ctaSecondary && (
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-7 text-white hover:scale-105 transition-all duration-300"
                  style={{ 
                    background: `${content.secondaryButtonColor}20`,
                    borderColor: `${content.secondaryButtonColor}40`,
                    borderWidth: '1px'
                  }}
                >
                  {content.ctaSecondary}
                  <ChevronDown className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>

            {/* Stats Preview - Industry themed */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-12 hero-animate max-w-2xl mx-auto" style={{ animationDelay: '0.4s' }}>
              <div className="glass rounded-xl p-3 sm:p-4 text-center hover:bg-white/15 transition-colors group">
                <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">+50K</div>
                <div className="text-[9px] sm:text-xs text-white/60 uppercase tracking-wide">Pontos de Luz</div>
              </div>
              <div className="glass rounded-xl p-3 sm:p-4 text-center hover:bg-white/15 transition-colors group">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">+5K</div>
                <div className="text-[9px] sm:text-xs text-white/60 uppercase tracking-wide">Câmeras</div>
              </div>
              <div className="glass rounded-xl p-3 sm:p-4 text-center hover:bg-white/15 transition-colors group">
                <Sun className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-green-400 group-hover:scale-110 transition-transform" />
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">+10</div>
                <div className="text-[9px] sm:text-xs text-white/60 uppercase tracking-wide">Usinas UFV</div>
              </div>
              <div className="glass rounded-xl p-3 sm:p-4 text-center hover:bg-white/15 transition-colors hidden sm:block group">
                <MapPin className="w-6 h-6 mx-auto mb-1 text-purple-400 group-hover:scale-110 transition-transform" />
                <div className="text-xl md:text-2xl font-bold text-white">+30</div>
                <div className="text-xs text-white/60 uppercase tracking-wide">Cidades</div>
              </div>
            </div>

            {/* Trust Badges - Industry themed */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8 hero-animate" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-1.5 sm:gap-2 text-white/50 text-xs sm:text-sm">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                <span>ISO 9001</span>
              </div>
              <div className="w-px h-3 sm:h-4 bg-white/20" />
              <div className="flex items-center gap-1.5 sm:gap-2 text-white/50 text-xs sm:text-sm">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>+10 Anos</span>
              </div>
              <div className="w-px h-3 sm:h-4 bg-white/20 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2 text-white/50 text-sm">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Garantia Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div 
          className="absolute inset-x-0 bottom-4 sm:bottom-12 flex justify-center hero-animate"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2 text-white/40">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-medium">Scroll</span>
            <ChevronDown className="w-5 h-5 sm:w-5 sm:h-5 animate-bounce" />
          </div>
        </div>

        {/* Floating Icons Background - Industry themed */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[3]">
          <Lightbulb 
            className="absolute top-[35%] left-[5%] sm:left-[8%] w-6 h-6 sm:w-8 sm:h-8 opacity-15 float" 
            style={{ color: '#fbbf24', animationDelay: '0s' }} 
          />
          <Camera 
            className="absolute top-[50%] right-[8%] sm:right-[10%] w-5 h-5 sm:w-7 sm:h-7 opacity-10 float" 
            style={{ color: '#60a5fa', animationDelay: '1.5s' }} 
          />
          <Wifi 
            className="absolute top-[65%] left-[12%] sm:left-[15%] w-5 h-5 sm:w-6 sm:h-6 opacity-10 float" 
            style={{ color: '#22d3d1', animationDelay: '3s' }} 
          />
          <Sun 
            className="absolute top-[75%] right-[15%] sm:right-[12%] w-6 h-6 sm:w-8 sm:h-8 opacity-15 float" 
            style={{ color: '#4ade80', animationDelay: '2s' }} 
          />
          <Radio 
            className="absolute top-[40%] right-[5%] sm:right-[6%] w-5 h-5 sm:w-7 sm:h-7 opacity-10 float hidden sm:block" 
            style={{ color: '#f97316', animationDelay: '4s' }} 
          />
          <Globe 
            className="absolute top-[60%] left-[6%] w-6 h-6 sm:w-8 sm:h-8 opacity-10 float hidden sm:block" 
            style={{ color: '#a855f7', animationDelay: '5s' }} 
          />
          <Wrench 
            className="absolute top-[25%] right-[25%] w-5 h-5 sm:w-6 sm:h-6 opacity-8 float hidden sm:block" 
            style={{ color: content.highlightColor, animationDelay: '2.5s' }} 
          />
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

      {/* Modules Section */}
      <section id="modules" className="relative z-10 py-16 sm:py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Nossos Serviços
            </h2>
            <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto">
              Soluções completas em iluminação pública, telecomunicações e energia solar
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {content.showModules && content.modules.length > 0 ? (
              content.modules.map((module, index) => {
                const IconComponent = iconMap[module.icon] || Package;
                return (
                  <div 
                    key={module.id || index} 
                    className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-white/15 transition-all duration-300 group"
                  >
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform"
                      style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                    >
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">{module.title}</h3>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{module.description}</p>
                  </div>
                );
              })
            ) : (
              <>
                {/* Iluminação Pública */}
                <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-amber-500/10 transition-all duration-300 group border border-transparent hover:border-amber-500/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform bg-gradient-to-br from-amber-500 to-orange-600">
                    <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Iluminação Pública</h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">Instalação, manutenção e modernização de sistemas de iluminação urbana com tecnologia LED</p>
                </div>
                
                {/* Câmeras de Segurança */}
                <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-blue-500/10 transition-all duration-300 group border border-transparent hover:border-blue-500/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Videomonitoramento</h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">Sistemas de câmeras IP para segurança pública e privada com monitoramento 24h</p>
                </div>
                
                {/* WiFi e Internet */}
                <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-cyan-500/10 transition-all duration-300 group border border-transparent hover:border-cyan-500/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform bg-gradient-to-br from-cyan-500 to-teal-600">
                    <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">WiFi Público</h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">Infraestrutura de internet sem fio para praças, parques e espaços públicos</p>
                </div>
                
                {/* Usina Solar */}
                <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-green-500/10 transition-all duration-300 group border border-transparent hover:border-green-500/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform bg-gradient-to-br from-green-500 to-emerald-600">
                    <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Usinas Fotovoltaicas</h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">Projetos e instalação de usinas solares UFV para geração de energia limpa e sustentável</p>
                </div>
                
                {/* Link Dedicado */}
                <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-purple-500/10 transition-all duration-300 group border border-transparent hover:border-purple-500/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform bg-gradient-to-br from-purple-500 to-violet-600">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Link Dedicado</h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">Conexões de internet dedicadas com alta disponibilidade e velocidade garantida</p>
                </div>
                
                {/* Infraestrutura Telecom */}
                <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-orange-500/10 transition-all duration-300 group border border-transparent hover:border-orange-500/30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform bg-gradient-to-br from-orange-500 to-red-600">
                    <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">Infraestrutura Telecom</h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">Redes de fibra óptica, torres e equipamentos de telecomunicações</p>
                </div>
              </>
            )}
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

      {/* About Section */}
      <section id="about" className="relative z-10 py-16 sm:py-24 px-4">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Sobre Nós
              </h2>
              <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto">
                Transformando cidades com tecnologia e sustentabilidade
              </p>
            </div>
            <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-amber-400" />
                    Nossa Missão
                  </h3>
                  <p className="text-sm sm:text-base text-white/70 mb-4 leading-relaxed">
                    Somos especialistas em <span className="text-amber-400 font-medium">iluminação pública</span>, <span className="text-blue-400 font-medium">telecomunicações</span> e <span className="text-green-400 font-medium">energia solar fotovoltaica</span>. Levamos tecnologia de ponta para cidades e empresas, promovendo eficiência energética e conectividade.
                  </p>
                  <p className="text-sm sm:text-base text-white/70 mb-6 leading-relaxed">
                    Com mais de uma década de experiência, já instalamos milhares de pontos de luz LED, sistemas de videomonitoramento, redes WiFi públicas e usinas solares em dezenas de municípios.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30">Iluminação LED</span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs border border-blue-500/30">CFTV</span>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs border border-cyan-500/30">WiFi</span>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs border border-green-500/30">Solar UFV</span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs border border-purple-500/30">Fibra Óptica</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-xl p-4 text-center group hover:bg-amber-500/10 transition-colors">
                    <Lightbulb className="w-6 h-6 mx-auto mb-2 text-amber-400 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">+50K</div>
                    <div className="text-xs sm:text-sm text-white/60">Pontos de Luz</div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center group hover:bg-blue-500/10 transition-colors">
                    <Camera className="w-6 h-6 mx-auto mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">+5K</div>
                    <div className="text-xs sm:text-sm text-white/60">Câmeras</div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center group hover:bg-green-500/10 transition-colors">
                    <Sun className="w-6 h-6 mx-auto mb-2 text-green-400 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">+10</div>
                    <div className="text-xs sm:text-sm text-white/60">Usinas UFV</div>
                  </div>
                  <div className="glass rounded-xl p-4 text-center group hover:bg-purple-500/10 transition-colors">
                    <MapPin className="w-6 h-6 mx-auto mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">+30</div>
                    <div className="text-xs sm:text-sm text-white/60">Cidades Atendidas</div>
                  </div>
                </div>
              </div>
              
              {/* Values */}
              <div className="grid sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Qualidade</h4>
                    <p className="text-xs text-white/60">Equipamentos de primeira linha e mão de obra qualificada</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Garantia</h4>
                    <p className="text-xs text-white/60">Suporte técnico e garantia em todos os serviços</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Agilidade</h4>
                    <p className="text-xs text-white/60">Atendimento rápido e cumprimento de prazos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-16 sm:py-24 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                Entre em Contato
              </h2>
              <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto">
                Estamos prontos para ajudar sua empresa
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center hover:bg-white/15 transition-all duration-300">
                <div 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                  style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">E-mail</h3>
                <p className="text-xs sm:text-sm text-white/60">contato@sistema.com.br</p>
              </div>
              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center hover:bg-white/15 transition-all duration-300">
                <div 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                  style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Telefone</h3>
                <p className="text-xs sm:text-sm text-white/60">(31) 9999-9999</p>
              </div>
              <div className="glass rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center hover:bg-white/15 transition-all duration-300">
                <div 
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
                  style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Endereço</h3>
                <p className="text-xs sm:text-sm text-white/60">Belo Horizonte, MG</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 sm:py-24 px-4">
        <div className="container mx-auto">
          <div 
            className="glass rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto"
            style={{ 
              background: `linear-gradient(135deg, ${content.primaryButtonColor}20, ${content.highlightColor}10)`,
              borderColor: `${content.primaryButtonColor}30`
            }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              {content.ctaTitle}
            </h2>
            <p className="text-sm sm:text-base text-white/70 mb-6 sm:mb-8 max-w-xl mx-auto">
              {content.ctaDescription}
            </p>
            <Button
              size="lg"
              className="text-base sm:text-lg px-8 sm:px-12 py-5 sm:py-7 shadow-2xl hover:scale-105 transition-all duration-300 text-white border-0"
              style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
              onClick={() => navigate('/auth')}
            >
              <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {content.ctaPrimary}
            </Button>
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
