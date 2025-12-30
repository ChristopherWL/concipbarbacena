import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Building2, ArrowRight, Sparkles, Menu, X,
  Package, Truck, Users, ClipboardList, BarChart3, FileText, Shield, Zap, Clock,
  Lightbulb, Wifi, Camera, Sun, Radio, Globe, MapPin, CheckCircle, Award, Phone, Mail, ArrowUpRight
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
  'lightbulb': Lightbulb,
  'wifi': Wifi,
  'camera': Camera,
  'sun': Sun,
  'radio': Radio,
  'globe': Globe,
};

export default function GenericLandingPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState<GenericContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for header effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const defaultModules = [
    { icon: 'lightbulb', title: 'Iluminação Pública', description: 'Instalação e manutenção de sistemas LED', color: 'from-amber-500 to-orange-600', bg: 'amber' },
    { icon: 'camera', title: 'Videomonitoramento', description: 'Sistemas de câmeras IP 24h', color: 'from-blue-500 to-indigo-600', bg: 'blue' },
    { icon: 'wifi', title: 'WiFi Público', description: 'Internet sem fio para espaços públicos', color: 'from-cyan-500 to-teal-600', bg: 'cyan' },
    { icon: 'sun', title: 'Usinas Fotovoltaicas', description: 'Energia solar limpa e sustentável', color: 'from-green-500 to-emerald-600', bg: 'green' },
    { icon: 'globe', title: 'Link Dedicado', description: 'Conexões de alta velocidade', color: 'from-purple-500 to-violet-600', bg: 'purple' },
    { icon: 'radio', title: 'Infraestrutura Telecom', description: 'Fibra óptica e telecomunicações', color: 'from-orange-500 to-red-600', bg: 'orange' },
  ];

  const getColorClasses = (bg: string) => {
    const colors: Record<string, { hover: string; border: string; text: string }> = {
      amber: { hover: 'hover:bg-amber-500/10', border: 'hover:border-amber-500/30', text: 'text-amber-400' },
      blue: { hover: 'hover:bg-blue-500/10', border: 'hover:border-blue-500/30', text: 'text-blue-400' },
      cyan: { hover: 'hover:bg-cyan-500/10', border: 'hover:border-cyan-500/30', text: 'text-cyan-400' },
      green: { hover: 'hover:bg-green-500/10', border: 'hover:border-green-500/30', text: 'text-green-400' },
      purple: { hover: 'hover:bg-purple-500/10', border: 'hover:border-purple-500/30', text: 'text-purple-400' },
      orange: { hover: 'hover:bg-orange-500/10', border: 'hover:border-orange-500/30', text: 'text-orange-400' },
    };
    return colors[bg] || colors.blue;
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{ background: `linear-gradient(180deg, ${content.backgroundGradientFrom} 0%, ${content.backgroundGradientTo} 100%)` }}
      />
      
      {/* Subtle grid overlay */}
      <div 
        className="fixed inset-0 -z-10 opacity-[0.02]"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }}
      />

      {/* Gradient orbs */}
      <div 
        className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full -z-10 blur-[150px] opacity-20"
        style={{ background: content.lightEffectColor }}
      />
      <div 
        className="fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full -z-10 blur-[150px] opacity-15"
        style={{ background: content.primaryButtonColor }}
      />

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/50 backdrop-blur-xl border-b border-white/10' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center">
              {content.logoUrl ? (
                <img src={content.logoUrl} alt="Logo" className="h-8 lg:h-10 object-contain" />
              ) : (
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-white"
                  style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                >
                  <Building2 className="w-5 h-5" />
                </div>
              )}
              {content.companyName && !content.logoUrl && (
                <span className="ml-3 font-semibold text-lg hidden sm:block">{content.companyName}</span>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {['Início', 'Serviços', 'Sobre', 'Contato'].map((item) => (
                <button 
                  key={item}
                  onClick={() => {
                    const id = item === 'Início' ? 'hero' : item === 'Serviços' ? 'modules' : item.toLowerCase();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  {item}
                </button>
              ))}
            </nav>

            {/* Desktop CTA */}
            <Button
              onClick={() => navigate('/auth')}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white border-0 transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
            >
              Acessar
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-xl border-b border-white/10">
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {['Início', 'Serviços', 'Sobre', 'Contato'].map((item) => (
                <button 
                  key={item}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    const id = item === 'Início' ? 'hero' : item === 'Serviços' ? 'modules' : item.toLowerCase();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                >
                  {item}
                </button>
              ))}
              <div className="pt-3 mt-2 border-t border-white/10">
                <Button
                  onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}
                  className="w-full text-white border-0"
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
      <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          {content.badge && (
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8 border"
              style={{ 
                background: `${content.primaryButtonColor}15`,
                borderColor: `${content.primaryButtonColor}30`,
                color: content.highlightColor
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>{content.badge}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="text-white">{content.heroTitle}</span>
            {content.heroTitleHighlight && (
              <span className="block mt-2" style={{ color: content.highlightColor }}>
                {content.heroTitleHighlight}
              </span>
            )}
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            {content.heroDescription}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto text-lg px-8 py-6 text-white border-0 shadow-2xl hover:scale-105 transition-all"
              style={{ 
                background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})`,
                boxShadow: `0 20px 40px -15px ${content.primaryButtonColor}60`
              }}
            >
              {content.ctaPrimary}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            {content.ctaSecondary && (
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8 py-6 bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                {content.ctaSecondary}
              </Button>
            )}
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {[
              { icon: Lightbulb, value: '+50K', label: 'Pontos de Luz', color: 'text-amber-400' },
              { icon: Camera, value: '+5K', label: 'Câmeras', color: 'text-blue-400' },
              { icon: Sun, value: '+10', label: 'Usinas UFV', color: 'text-green-400' },
              { icon: MapPin, value: '+30', label: 'Cidades', color: 'text-purple-400' },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center group hover:bg-white/10 transition-colors">
                <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color} group-hover:scale-110 transition-transform`} />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-6 mt-10">
            {[
              { icon: CheckCircle, label: 'ISO 9001', color: 'text-green-400' },
              { icon: Award, label: '+10 Anos', color: 'text-amber-400' },
              { icon: Shield, label: 'Garantia', color: 'text-blue-400' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-white/50 text-sm">
                <badge.icon className={`w-4 h-4 ${badge.color}`} />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {content.showStats && content.stats.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {content.stats.slice(0, 4).map((stat, index) => (
                <div 
                  key={stat.id || index} 
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors"
                >
                  <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-white/50 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services/Modules Section */}
      <section id="modules" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Nossos Serviços</h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Soluções completas em infraestrutura urbana e tecnologia
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(content.showModules && content.modules.length > 0 ? content.modules : defaultModules).map((module, index) => {
              const IconComponent = iconMap[(module as any).icon] || Package;
              const colorInfo = getColorClasses((module as any).bg || 'blue');
              
              return (
                <div 
                  key={(module as any).id || index} 
                  className={`group p-6 rounded-2xl bg-white/5 border border-white/10 ${colorInfo.hover} ${colorInfo.border} transition-all duration-300`}
                >
                  <div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${(module as any).color || `from-blue-500 to-indigo-600`} group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{module.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{module.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {content.showFeatures && content.features.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Por que nos escolher?</h2>
              <p className="text-lg text-white/50">Diferenciais que fazem a diferença</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              {content.features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon] || Shield;
                return (
                  <div key={feature.id || index} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ background: `${content.primaryButtonColor}20` }}
                    >
                      <IconComponent className="w-8 h-8" style={{ color: content.highlightColor }} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/50">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="sobre" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-white/5 border border-white/10">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                  >
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Sobre Nós</h2>
                </div>
                
                <p className="text-white/60 mb-4 leading-relaxed">
                  Somos especialistas em <span className="text-amber-400 font-medium">iluminação pública</span>, <span className="text-blue-400 font-medium">telecomunicações</span> e <span className="text-green-400 font-medium">energia solar fotovoltaica</span>.
                </p>
                <p className="text-white/60 mb-6 leading-relaxed">
                  Com mais de uma década de experiência, já instalamos milhares de pontos de luz LED, sistemas de videomonitoramento e usinas solares em dezenas de municípios.
                </p>

                <div className="flex flex-wrap gap-2">
                  {['Iluminação LED', 'CFTV', 'WiFi', 'Solar UFV', 'Fibra Óptica'].map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Award, title: 'Qualidade', desc: 'Equipamentos de primeira linha' },
                  { icon: Shield, title: 'Garantia', desc: 'Suporte técnico completo' },
                  { icon: Clock, title: 'Agilidade', desc: 'Cumprimento de prazos' },
                  { icon: Users, title: 'Experiência', desc: '+10 anos no mercado' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <item.icon className="w-6 h-6 text-white/70 mb-3" />
                    <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-white/50">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Entre em Contato</h2>
            <p className="text-lg text-white/50">Estamos prontos para ajudar sua empresa</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Mail, title: 'E-mail', value: 'contato@sistema.com.br' },
              { icon: Phone, title: 'Telefone', value: '(31) 9999-9999' },
              { icon: MapPin, title: 'Endereço', value: 'Belo Horizonte, MG' },
            ].map((contact, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors group"
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                >
                  <contact.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">{contact.title}</h3>
                <p className="text-sm text-white/50">{contact.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div 
            className="p-10 sm:p-16 rounded-3xl text-center border"
            style={{ 
              background: `linear-gradient(135deg, ${content.primaryButtonColor}15, ${content.highlightColor}10)`,
              borderColor: `${content.primaryButtonColor}25`
            }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{content.ctaTitle}</h2>
            <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">{content.ctaDescription}</p>
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-10 py-6 text-white border-0 shadow-2xl hover:scale-105 transition-all"
              style={{ 
                background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})`,
                boxShadow: `0 20px 40px -15px ${content.primaryButtonColor}60`
              }}
            >
              {content.ctaPrimary}
              <ArrowUpRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} {content.companyName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            {['Início', 'Serviços', 'Sobre', 'Contato'].map((item) => (
              <button 
                key={item}
                onClick={() => {
                  const id = item === 'Início' ? 'hero' : item === 'Serviços' ? 'modules' : item.toLowerCase();
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
