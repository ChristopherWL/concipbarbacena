import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Building2, ArrowRight, Menu, X,
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
  primaryColor: string;
  secondaryColor: string;
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
            primaryColor: data.primary_color || generic.primaryColor || '#3b82f6',
            secondaryColor: data.secondary_color || generic.secondaryColor || '#1e40af',
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
            primaryColor: '#3b82f6',
            secondaryColor: '#1e40af',
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
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
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
    { icon: Lightbulb, title: 'Iluminação Pública', description: 'Modernização e manutenção de sistemas LED para cidades inteligentes' },
    { icon: Camera, title: 'Videomonitoramento', description: 'Sistemas de CFTV com tecnologia IP e monitoramento 24 horas' },
    { icon: Wifi, title: 'Conectividade WiFi', description: 'Infraestrutura de internet sem fio para espaços públicos e privados' },
    { icon: Sun, title: 'Energia Solar', description: 'Projetos de usinas fotovoltaicas para geração de energia limpa' },
    { icon: Globe, title: 'Link Dedicado', description: 'Conexões de alta velocidade com disponibilidade garantida' },
    { icon: Radio, title: 'Telecomunicações', description: 'Infraestrutura de fibra óptica e equipamentos de comunicação' },
  ];

  const stats = [
    { value: '50K+', label: 'Pontos de Luz', icon: Lightbulb },
    { value: '5K+', label: 'Câmeras Instaladas', icon: Camera },
    { value: '30+', label: 'Cidades Atendidas', icon: MapPin },
    { value: '10+', label: 'Anos de Experiência', icon: Award },
  ];

  // Dark blue theme colors
  const bgPrimary = '#0f172a'; // slate-900
  const bgSecondary = '#1e293b'; // slate-800
  const bgCard = '#1e293b';

  return (
    <div className="min-h-screen antialiased text-white" style={{ backgroundColor: bgPrimary }}>
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Main light orbs */}
        <div 
          className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-30 blur-[150px] animate-pulse"
          style={{ background: `radial-gradient(circle, ${content.primaryColor} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-25 blur-[130px] animate-pulse"
          style={{ background: `radial-gradient(circle, ${content.secondaryColor} 0%, transparent 70%)`, animationDelay: '1s' }}
        />
        
        {/* Floating light spots */}
        <div 
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-20 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${content.primaryColor} 0%, transparent 60%)`, animation: 'pulse 4s ease-in-out infinite' }}
        />
        <div 
          className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] rounded-full opacity-15 blur-[90px]"
          style={{ background: `radial-gradient(circle, #60a5fa 0%, transparent 60%)`, animation: 'pulse 5s ease-in-out infinite 0.5s' }}
        />
        
        {/* Central glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] rounded-full opacity-10 blur-[120px]"
          style={{ background: `linear-gradient(90deg, ${content.primaryColor}, ${content.secondaryColor}, ${content.primaryColor})` }}
        />
        
        {/* Light beams */}
        <div 
          className="absolute top-0 left-1/3 w-[2px] h-[60%] opacity-10"
          style={{ background: `linear-gradient(to bottom, ${content.primaryColor}, transparent)` }}
        />
        <div 
          className="absolute top-0 right-1/4 w-[1px] h-[40%] opacity-5"
          style={{ background: `linear-gradient(to bottom, ${content.secondaryColor}, transparent)` }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
        
        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'py-3 backdrop-blur-xl border-b border-white/10' 
            : 'py-5'
        }`}
        style={{ backgroundColor: scrolled ? `${bgPrimary}ee` : 'transparent' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {content.logoUrl ? (
                <img src={content.logoUrl} alt={content.companyName} className="h-10 object-contain" />
              ) : (
                <>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${content.primaryColor}, ${content.secondaryColor})` }}
                  >
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-xl hidden sm:block">{content.companyName}</span>
                </>
              )}
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
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
                className="text-sm font-medium text-white/70 hover:text-white hover:bg-white/10"
              >
                Entrar
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                className="text-sm font-medium px-6 text-white border-0"
                style={{ background: `linear-gradient(135deg, ${content.primaryColor}, ${content.secondaryColor})` }}
              >
                {content.ctaPrimary}
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden absolute top-full left-0 right-0 backdrop-blur-xl border-b border-white/10"
            style={{ backgroundColor: `${bgPrimary}f5` }}
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
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
                  style={{ background: `linear-gradient(135deg, ${content.primaryColor}, ${content.secondaryColor})` }}
                >
                  {content.ctaPrimary}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" ref={heroRef} className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            {/* Badge */}
            {content.badge && (
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/10"
                style={{ backgroundColor: `${content.primaryColor}20` }}
              >
                <span 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: content.primaryColor }}
                />
                <span className="text-white/90">{content.badge}</span>
              </div>
            )}

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              <span className="text-white">{content.heroTitle}</span>
              {content.heroTitleHighlight && (
                <span 
                  className="block mt-2 bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(135deg, ${content.primaryColor}, #60a5fa)` }}
                >
                  {content.heroTitleHighlight}
                </span>
              )}
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-white/60 leading-relaxed mb-10 max-w-2xl">
              {content.heroDescription}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="group text-base px-8 h-14 text-white border-0 shadow-lg transition-all hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${content.primaryColor}, ${content.secondaryColor})`,
                  boxShadow: `0 10px 40px ${content.primaryColor}40`
                }}
              >
                {content.ctaPrimary}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              {content.ctaSecondary && (
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 h-14 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                >
                  {content.ctaSecondary}
                </Button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-20 pt-10 border-t border-white/10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {stats.map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${content.primaryColor}20` }}
                    >
                      <stat.icon className="w-5 h-5" style={{ color: content.primaryColor }} />
                    </div>
                    <span className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-sm text-white/50 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: bgSecondary }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Nossos Serviços
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Soluções completas para transformar e modernizar sua infraestrutura
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(content.modules.length > 0 ? content.modules : defaultServices).map((service, i) => {
              const IconComponent = 'icon' in service && typeof service.icon === 'string' 
                ? iconMap[service.icon] || Building2 
                : ('icon' in service ? service.icon : Building2);
              
              return (
                <div 
                  key={i}
                  className="group rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                  style={{ backgroundColor: bgPrimary }}
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${content.primaryColor}30, ${content.secondaryColor}20)` }}
                  >
                    <IconComponent className="w-7 h-7" style={{ color: content.primaryColor }} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {service.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Por que escolher nossa plataforma?
              </h2>
              <p className="text-lg text-white/60 mb-8 leading-relaxed">
                Oferecemos uma solução completa e integrada para gestão empresarial, 
                desenvolvida com as melhores práticas do mercado e tecnologia de ponta.
              </p>
              
              <div className="space-y-5">
                {[
                  { icon: Shield, title: 'Segurança Garantida', desc: 'Dados protegidos com criptografia de ponta' },
                  { icon: Zap, title: 'Alta Performance', desc: 'Sistema rápido e responsivo em qualquer dispositivo' },
                  { icon: Users, title: 'Suporte Dedicado', desc: 'Equipe especializada pronta para ajudar' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${content.primaryColor}30, ${content.secondaryColor}20)` }}
                    >
                      <item.icon className="w-6 h-6" style={{ color: content.primaryColor }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                      <p className="text-white/60 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div 
                className="aspect-square rounded-3xl border border-white/10"
                style={{ backgroundColor: bgSecondary }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div 
                      className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6"
                      style={{ background: `linear-gradient(135deg, ${content.primaryColor}, ${content.secondaryColor})` }}
                    >
                      <Building2 className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-white">{content.companyName}</p>
                    {content.companySubtitle && (
                      <p className="text-white/60 mt-2">{content.companySubtitle}</p>
                    )}
                  </div>
                </div>
                {/* Decorative elements */}
                <div 
                  className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-50 blur-2xl"
                  style={{ background: content.primaryColor }}
                />
                <div 
                  className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full opacity-30 blur-2xl"
                  style={{ background: content.secondaryColor }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {content.showFeatures && content.features.length > 0 && (
        <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: bgSecondary }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Recursos do Sistema
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Funcionalidades pensadas para otimizar sua operação
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.features.map((feature, i) => {
                const IconComponent = iconMap[feature.icon] || CheckCircle;
                return (
                  <div 
                    key={i} 
                    className="rounded-xl p-6 border border-white/10"
                    style={{ backgroundColor: bgPrimary }}
                  >
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${content.primaryColor}20` }}
                    >
                      <IconComponent className="w-6 h-6" style={{ color: content.primaryColor }} />
                    </div>
                    <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                    <p className="text-sm text-white/60">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Entre em Contato
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Estamos prontos para atender você
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Phone, label: 'Telefone', value: '(11) 9999-9999', href: 'tel:+5511999999999' },
              { icon: Mail, label: 'E-mail', value: 'contato@empresa.com', href: 'mailto:contato@empresa.com' },
              { icon: MapPin, label: 'Endereço', value: 'São Paulo, SP', href: null },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `linear-gradient(135deg, ${content.primaryColor}30, ${content.secondaryColor}20)` }}
                >
                  <item.icon className="w-7 h-7" style={{ color: content.primaryColor }} />
                </div>
                <p className="text-sm text-white/50 mb-1">{item.label}</p>
                {item.href ? (
                  <a 
                    href={item.href}
                    className="font-semibold text-white hover:underline"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="font-semibold text-white">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div 
            className="rounded-3xl p-12 sm:p-16 text-center text-white relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${content.primaryColor}, ${content.secondaryColor})` 
            }}
          >
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {content.ctaTitle}
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                {content.ctaDescription}
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-white hover:bg-white/90 text-base px-8 h-14 shadow-lg"
                style={{ color: content.primaryColor }}
              >
                {content.ctaPrimary}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {content.logoUrl ? (
                <img src={content.logoUrl} alt={content.companyName} className="h-8 object-contain" />
              ) : (
                <>
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${content.primaryColor}, ${content.secondaryColor})` }}
                  >
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-white">{content.companyName}</span>
                </>
              )}
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Copyright */}
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} {content.companyName}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
