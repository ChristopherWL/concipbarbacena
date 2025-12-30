import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Building2, ArrowRight, Menu, X, ChevronRight,
  Package, Truck, Users, ClipboardList, BarChart3, FileText, Shield, Zap, Clock,
  Lightbulb, Wifi, Camera, Sun, Radio, Globe, MapPin, CheckCircle, Award, Phone, Mail
} from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { useEffect, useState, useRef } from 'react';
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
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            heroTitle: generic.heroTitle || 'Gestão Inteligente',
            heroTitleHighlight: generic.heroTitleHighlight || 'para sua Empresa',
            heroDescription: generic.heroDescription || 'Plataforma completa de gestão empresarial com tecnologia de ponta para impulsionar seus resultados.',
            ctaPrimary: generic.ctaPrimary || 'Acessar Sistema',
            ctaSecondary: generic.ctaSecondary || '',
            stats: generic.stats || [],
            showStats: generic.showStats !== false,
            modules: generic.modules || [],
            features: generic.features || [],
            showModules: generic.showModules !== false,
            showFeatures: generic.showFeatures !== false,
            ctaTitle: generic.ctaTitle || 'Pronto para transformar sua gestão?',
            ctaDescription: generic.ctaDescription || 'Acesse agora e descubra como podemos ajudar seu negócio a crescer.',
            primaryButtonColor: generic.primaryButtonColor || '#3b82f6',
            secondaryButtonColor: generic.secondaryButtonColor || '#1e40af',
            highlightColor: generic.highlightColor || '#60a5fa',
            accentColor: generic.accentColor || '#3b82f6',
            backgroundGradientFrom: generic.backgroundGradientFrom || '#0a0a0f',
            backgroundGradientTo: generic.backgroundGradientTo || '#111827',
            lightEffectColor: generic.lightEffectColor || '#3b82f6',
          });
        } else {
          setContent({
            companyName: 'Sistema ERP',
            companySubtitle: '',
            logoUrl: '',
            logoDarkUrl: '',
            badge: 'Plataforma de Gestão',
            heroTitle: 'Gestão Inteligente',
            heroTitleHighlight: 'para sua Empresa',
            heroDescription: 'Plataforma completa de gestão empresarial com tecnologia de ponta para impulsionar seus resultados.',
            ctaPrimary: 'Acessar Sistema',
            ctaSecondary: '',
            stats: [],
            showStats: false,
            modules: [],
            features: [],
            showModules: false,
            showFeatures: false,
            ctaTitle: 'Pronto para transformar sua gestão?',
            ctaDescription: 'Acesse agora e descubra como podemos ajudar.',
            primaryButtonColor: '#3b82f6',
            secondaryButtonColor: '#1e40af',
            highlightColor: '#60a5fa',
            accentColor: '#3b82f6',
            backgroundGradientFrom: '#0a0a0f',
            backgroundGradientTo: '#111827',
            lightEffectColor: '#3b82f6',
          });
        }
      } catch (error) {
        console.error('Error fetching landing page content:', error);
        setContent({
          companyName: 'Sistema ERP',
          companySubtitle: '',
          logoUrl: '',
          logoDarkUrl: '',
          badge: 'Plataforma de Gestão',
          heroTitle: 'Gestão Inteligente',
          heroTitleHighlight: 'para sua Empresa',
          heroDescription: 'Plataforma completa de gestão empresarial com tecnologia de ponta para impulsionar seus resultados.',
          ctaPrimary: 'Acessar Sistema',
          ctaSecondary: '',
          stats: [],
          showStats: false,
          modules: [],
          features: [],
          showModules: false,
          showFeatures: false,
          ctaTitle: 'Pronto para transformar sua gestão?',
          ctaDescription: 'Acesse agora e descubra como podemos ajudar.',
          primaryButtonColor: '#3b82f6',
          secondaryButtonColor: '#1e40af',
          highlightColor: '#60a5fa',
          accentColor: '#3b82f6',
          backgroundGradientFrom: '#0a0a0f',
          backgroundGradientTo: '#111827',
          lightEffectColor: '#3b82f6',
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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Início', id: 'hero' },
    { label: 'Serviços', id: 'services' },
    { label: 'Sobre', id: 'about' },
    { label: 'Contato', id: 'contact' },
  ];

  const defaultServices = [
    { icon: Lightbulb, title: 'Iluminação Pública', description: 'Modernização e manutenção de sistemas LED para cidades inteligentes', gradient: 'from-amber-500 to-orange-500' },
    { icon: Camera, title: 'Videomonitoramento', description: 'Sistemas de CFTV com tecnologia IP e monitoramento 24 horas', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Wifi, title: 'Conectividade WiFi', description: 'Infraestrutura de internet sem fio para espaços públicos e privados', gradient: 'from-cyan-500 to-teal-500' },
    { icon: Sun, title: 'Energia Solar', description: 'Projetos de usinas fotovoltaicas para geração de energia limpa', gradient: 'from-green-500 to-emerald-500' },
    { icon: Globe, title: 'Link Dedicado', description: 'Conexões de alta velocidade com disponibilidade garantida', gradient: 'from-violet-500 to-purple-500' },
    { icon: Radio, title: 'Telecomunicações', description: 'Infraestrutura de fibra óptica e equipamentos de comunicação', gradient: 'from-rose-500 to-pink-500' },
  ];

  const stats = [
    { value: '50K+', label: 'Pontos de Luz', icon: Lightbulb },
    { value: '5K+', label: 'Câmeras Instaladas', icon: Camera },
    { value: '30+', label: 'Cidades Atendidas', icon: MapPin },
    { value: '10+', label: 'Anos de Experiência', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      {/* CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .animate-fade-in-delay-1 { animation: fadeIn 0.8s ease-out 0.1s forwards; opacity: 0; }
        .animate-fade-in-delay-2 { animation: fadeIn 0.8s ease-out 0.2s forwards; opacity: 0; }
        .animate-fade-in-delay-3 { animation: fadeIn 0.8s ease-out 0.3s forwards; opacity: 0; }
        .animate-glow { animation: glow 4s ease-in-out infinite; }
        .gradient-text {
          background: linear-gradient(135deg, ${content.highlightColor}, ${content.primaryButtonColor});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${content.lightEffectColor}15, transparent)` }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] animate-glow"
          style={{ background: `radial-gradient(circle, ${content.primaryButtonColor}08, transparent 70%)` }}
        />
      </div>

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'py-3 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5' 
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {content.logoUrl ? (
                <img src={content.logoUrl} alt={content.companyName} className="h-9 object-contain" />
              ) : (
                <>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                  >
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-lg tracking-tight hidden sm:block">{content.companyName}</span>
                </>
              )}
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="text-sm font-medium text-white/70 hover:text-white hover:bg-white/5"
              >
                Entrar
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                className="text-sm font-medium px-5 text-white border-0"
                style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
              >
                {content.ctaPrimary}
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
            <nav className="max-w-7xl mx-auto px-6 py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t border-white/10">
                <Button
                  onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}
                  className="w-full text-white border-0"
                  style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                >
                  {content.ctaPrimary}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center pt-24 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="max-w-4xl">
            {/* Badge */}
            {content.badge && (
              <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 mb-8">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: content.highlightColor }} />
                {content.badge}
              </div>
            )}

            {/* Headline */}
            <h1 className="animate-fade-in-delay-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8">
              {content.heroTitle}
              {content.heroTitleHighlight && (
                <span className="block gradient-text mt-2">
                  {content.heroTitleHighlight}
                </span>
              )}
            </h1>

            {/* Description */}
            <p className="animate-fade-in-delay-2 text-lg sm:text-xl text-white/50 max-w-2xl leading-relaxed mb-10">
              {content.heroDescription}
            </p>

            {/* CTAs */}
            <div className="animate-fade-in-delay-3 flex flex-col sm:flex-row items-start gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="group text-base px-8 py-6 text-white border-0 transition-all duration-300 hover:scale-[1.02]"
                style={{ 
                  background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})`,
                  boxShadow: `0 0 40px ${content.primaryButtonColor}30`
                }}
              >
                {content.ctaPrimary}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              {content.ctaSecondary && (
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-base px-8 py-6 text-white/70 hover:text-white border border-white/10 hover:bg-white/5"
                >
                  {content.ctaSecondary}
                </Button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-20 pt-10 border-t border-white/5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <stat.icon className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" />
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{stat.value}</span>
                  </div>
                  <p className="text-sm text-white/40 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section (Custom) */}
      {content.showStats && content.stats.length > 0 && (
        <section className="py-20 px-6 lg:px-8 border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {content.stats.slice(0, 4).map((stat, i) => (
                <div key={stat.id || i} className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <p className="text-sm text-white/40 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      <section id="services" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: content.highlightColor }}>
              Nossos Serviços
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Soluções completas em infraestrutura
            </h2>
            <p className="text-lg text-white/50">
              Oferecemos um portfólio diversificado de serviços para atender todas as suas necessidades.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(content.showModules && content.modules.length > 0 ? content.modules : defaultServices).map((service, i) => {
              const IconComponent = 'icon' in service && typeof service.icon === 'string' 
                ? iconMap[service.icon] || Package 
                : (service as any).icon || Package;
              const gradient = (service as any).gradient || 'from-blue-500 to-cyan-500';
              
              return (
                <div 
                  key={i}
                  className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{service.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{service.description}</p>
                  <ChevronRight className="absolute top-8 right-8 w-5 h-5 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {content.showFeatures && content.features.length > 0 && (
        <section className="py-24 px-6 lg:px-8 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: content.highlightColor }}>
                Diferenciais
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Por que nos escolher?
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              {content.features.map((feature, i) => {
                const IconComponent = iconMap[feature.icon] || Shield;
                return (
                  <div key={feature.id || i} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                      style={{ background: `${content.primaryButtonColor}15` }}
                    >
                      <IconComponent className="w-8 h-8" style={{ color: content.highlightColor }} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div>
              <p className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: content.highlightColor }}>
                Sobre Nós
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Transformando cidades com tecnologia
              </h2>
              <p className="text-lg text-white/50 mb-6 leading-relaxed">
                Com mais de uma década de experiência, somos referência em soluções de infraestrutura urbana, telecomunicações e energia renovável.
              </p>
              <p className="text-white/50 mb-8 leading-relaxed">
                Nossa equipe altamente qualificada atua em todas as etapas do projeto, desde o planejamento até a execução e manutenção, garantindo excelência em cada entrega.
              </p>

              <div className="flex flex-wrap gap-3">
                {['ISO 9001', 'Garantia Total', 'Suporte 24h', 'Equipe Certificada'].map((tag, i) => (
                  <span 
                    key={i}
                    className="px-4 py-2 rounded-full text-sm border border-white/10 text-white/60 bg-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Award, title: 'Qualidade', desc: 'Equipamentos de primeira linha e processos certificados' },
                { icon: Shield, title: 'Segurança', desc: 'Protocolos rigorosos em todas as operações' },
                { icon: Clock, title: 'Pontualidade', desc: 'Compromisso absoluto com prazos de entrega' },
                { icon: Users, title: 'Experiência', desc: 'Equipe técnica com anos de mercado' },
              ].map((item, i) => (
                <div 
                  key={i}
                  className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <item.icon className="w-8 h-8 text-white/30 mb-4" />
                  <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 lg:px-8 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: content.highlightColor }}>
              Contato
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Fale conosco
            </h2>
            <p className="text-lg text-white/50">
              Estamos prontos para atender sua demanda
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Mail, title: 'E-mail', value: 'contato@empresa.com.br', link: 'mailto:contato@empresa.com.br' },
              { icon: Phone, title: 'Telefone', value: '(31) 9999-9999', link: 'tel:+553199999999' },
              { icon: MapPin, title: 'Localização', value: 'Belo Horizonte, MG', link: '#' },
            ].map((contact, i) => (
              <a 
                key={i}
                href={contact.link}
                className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all text-center"
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                >
                  <contact.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{contact.title}</h3>
                <p className="text-sm text-white/50">{contact.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div 
            className="relative overflow-hidden rounded-3xl p-12 sm:p-16 text-center"
            style={{ 
              background: `linear-gradient(135deg, ${content.primaryButtonColor}10, ${content.highlightColor}05)`,
              border: `1px solid ${content.primaryButtonColor}20`
            }}
          >
            {/* Glow Effect */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 blur-[100px]"
              style={{ background: content.primaryButtonColor }}
            />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{content.ctaTitle}</h2>
              <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">{content.ctaDescription}</p>
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="group text-base px-10 py-6 text-white border-0 transition-all hover:scale-[1.02]"
                style={{ 
                  background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})`,
                  boxShadow: `0 0 50px ${content.primaryButtonColor}40`
                }}
              >
                {content.ctaPrimary}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-4">
              {content.logoUrl ? (
                <img src={content.logoUrl} alt={content.companyName} className="h-8 object-contain opacity-60" />
              ) : (
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center opacity-60"
                    style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor}, ${content.highlightColor})` }}
                  >
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white/40">{content.companyName}</span>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <nav className="flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Copyright */}
            <p className="text-sm text-white/30">
              © {new Date().getFullYear()} Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
