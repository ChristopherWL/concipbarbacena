import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, ArrowRight, Menu, X,
  Package, Truck, Users, ClipboardList, BarChart3, FileText, Shield, Zap, Clock,
  Lightbulb, Wifi, Camera, Sun, Radio, Globe, MapPin, CheckCircle, Award, Phone, Mail, AlertCircle
} from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import barbacenaHero from '@/assets/barbacena-praca.jpg';
import TicketForm from '@/components/landing/TicketForm';

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

// Futuristic theme colors
const theme = {
  neonBlue: '#0984E3',
  neonPurple: '#6C5CE7',
  accentCyan: '#00d2ff',
  darkBg: '#050b14',
  darkBgSecondary: '#0A1F3D',
  glassBg: 'rgba(255, 255, 255, 0.05)',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  white: '#FFFFFF',
};

export default function GenericLandingPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState<GenericContent | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
        
        // Store tenant and branch IDs for ticket form
        if (result?.tenantId) {
          setTenantId(result.tenantId);
        }
        if (result?.branchId) {
          setBranchId(result.branchId);
        }

        if (data) {
          const lp = (data.landing_page_content as any) || {};
          const generic = lp.generic || {};

          setContent({
            companyName: generic.companyName || data.name || 'Sistema ERP',
            companySubtitle: generic.companySubtitle || '',
            logoUrl: data.logo_url || generic.logoUrl || '',
            logoDarkUrl: generic.logoDarkUrl || '',
            badge: generic.badge || 'Soluções em Tecnologia',
            heroTitle: generic.heroTitle || 'ILUMINANDO O',
            heroTitleHighlight: generic.heroTitleHighlight || 'FUTURO DE BARBACENA',
            heroDescription: generic.heroDescription || 'Parceria Público-Privada avançada entregando iluminação urbana de última geração, conectividade e infraestrutura de monitoramento inteligente para um amanhã mais seguro e brilhante.',
            ctaPrimary: generic.ctaPrimary || 'Fale Conosco',
            ctaSecondary: generic.ctaSecondary || '',
            stats: generic.stats || [],
            showStats: generic.showStats !== false,
            modules: generic.modules || [],
            features: generic.features || [],
            showModules: generic.showModules !== false,
            showFeatures: generic.showFeatures !== false,
            ctaTitle: generic.ctaTitle || 'Pronto para transformar sua gestão?',
            ctaDescription: generic.ctaDescription || 'Acesse agora e descubra como podemos ajudar seu negócio a crescer.',
            primaryColor: data.primary_color || generic.primaryColor || theme.neonBlue,
            secondaryColor: data.secondary_color || generic.secondaryColor || theme.neonPurple,
          });
        } else {
          setContent({
            companyName: 'Sistema ERP',
            companySubtitle: '',
            logoUrl: '',
            logoDarkUrl: '',
            badge: 'Soluções para Cidades Inteligentes',
            heroTitle: 'ILUMINANDO O',
            heroTitleHighlight: 'FUTURO DE BARBACENA',
            heroDescription: 'Parceria Público-Privada avançada entregando iluminação urbana de última geração, conectividade e infraestrutura de monitoramento inteligente para um amanhã mais seguro e brilhante.',
            ctaPrimary: 'Fale Conosco',
            ctaSecondary: '',
            stats: [],
            showStats: true,
            modules: [],
            features: [],
            showModules: true,
            showFeatures: false,
            ctaTitle: '',
            ctaDescription: '',
            primaryColor: theme.neonBlue,
            secondaryColor: theme.neonPurple,
          });
        }
      } catch (error) {
        console.error('Error fetching landing page content:', error);
        setContent({
          companyName: 'LUMINA PPP',
          companySubtitle: '',
          logoUrl: '',
          logoDarkUrl: '',
          badge: 'Soluções para Cidades Inteligentes',
          heroTitle: 'ILUMINANDO O',
          heroTitleHighlight: 'FUTURO DE BARBACENA',
          heroDescription: 'Parceria Público-Privada avançada entregando iluminação urbana de última geração, conectividade e infraestrutura de monitoramento inteligente para um amanhã mais seguro e brilhante.',
          ctaPrimary: 'Fale Conosco',
          ctaSecondary: '',
          stats: [],
          showStats: true,
          modules: [],
          features: [],
          showModules: true,
          showFeatures: false,
          ctaTitle: '',
          ctaDescription: '',
          primaryColor: theme.neonBlue,
          secondaryColor: theme.neonPurple,
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
    { label: 'Serviços', id: 'services' },
    { label: 'Projetos', id: 'projects' },
    { label: 'Tecnologia', id: 'technology' },
    { label: 'Sobre', id: 'about' },
  ];

  const defaultServices = [
    { icon: Lightbulb, title: 'Iluminação Pública', description: 'Sistemas de iluminação LED de alta eficiência com capacidades de gerenciamento remoto para garantir brilho e segurança ideais.' },
    { icon: Building2, title: 'Gestão de PPP', description: 'Modelos sustentáveis de Parceria Público-Privada garantindo manutenção de longo prazo, modernização e eficiência operacional.' },
    { icon: Camera, title: 'Câmeras Wi-Fi', description: 'Rede de câmeras de segurança integrada utilizando postes de iluminação para vigilância urbana aprimorada e monitoramento de tráfego.' },
    { icon: Globe, title: 'Link Dedicado', description: 'Links de fibra óptica dedicados de alta velocidade conectando infraestrutura pública e permitindo transmissão de dados para cidades inteligentes.' },
    { icon: Sun, title: 'Usina UFV', description: 'Integração de Usinas Fotovoltaicas para compensar o consumo de energia e promover o uso de energia renovável.' },
    { icon: Radio, title: 'Iluminação Inteligente', description: 'Sensores inteligentes habilitados para IoT para iluminação adaptativa, monitoramento ambiental e alertas de manutenção preditiva.' },
  ];

  const stats = [
    { value: '12.000+', label: 'Pontos LED Inteligentes' },
    { value: '24/7', label: 'Centro de Monitoramento' },
    { value: '45%', label: 'Economia de Energia' },
    { value: '100%', label: 'Cobertura da Cidade' },
  ];

  const galleryItems = [
    { 
      type: 'image', 
      image: barbacenaHero, 
      title: 'Centro de Barbacena', 
      description: 'Transição LED Completa - 2023',
      large: true 
    },
    { 
      type: 'tech', 
      icon: BarChart3, 
      title: 'Centro de Controle', 
      description: 'Dados em Tempo Real' 
    },
    { 
      type: 'tech', 
      icon: Wifi, 
      title: 'Conectividade', 
      description: '99.9% de Disponibilidade' 
    },
    { 
      type: 'wide', 
      icon: MapPin, 
      title: 'Topologia da Rede Inteligente', 
      description: 'Mapeamento otimizado da rede de distribuição de energia.',
      progress: 75 
    },
  ];

  return (
    <div className="min-h-screen antialiased overflow-x-hidden" style={{ backgroundColor: theme.darkBg, color: theme.white, fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-16 py-4 sm:py-6 flex justify-between items-center"
        style={{ background: 'linear-gradient(to bottom, rgba(5,11,20,0.95), transparent)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          {content.logoUrl ? (
            <img src={content.logoUrl} alt={content.companyName} className="h-7 sm:h-10 object-contain" />
          ) : (
            <>
              <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: theme.accentCyan }} />
              <span className="font-bold text-lg sm:text-2xl text-white tracking-wider">
                {content.companyName}
                <span className="font-light opacity-80 ml-1 hidden sm:inline">PPP</span>
              </span>
            </>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-sm font-medium uppercase tracking-widest transition-colors text-white/80 hover:text-white relative group"
            >
              {item.label}
              <span 
                className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full"
                style={{ backgroundColor: theme.accentCyan }}
              />
            </button>
          ))}
        </nav>

        {/* CTA Button Desktop */}
        <button
          onClick={() => navigate('/auth')}
          className="hidden lg:flex items-center px-5 xl:px-8 py-2.5 font-bold text-xs xl:text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-lg"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: `1px solid ${theme.accentCyan}`,
            color: theme.accentCyan,
            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.accentCyan;
            e.currentTarget.style.color = '#000';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 210, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = theme.accentCyan;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Portal do Parceiro
        </button>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 pt-16"
          style={{ backgroundColor: 'rgba(5,11,20,0.98)', backdropFilter: 'blur(10px)' }}
        >
          <nav className="flex flex-col items-center justify-center gap-6 h-full px-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-lg font-medium uppercase tracking-widest text-white/80 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}
              className="mt-6 px-8 py-3 font-bold text-sm uppercase tracking-wider"
              style={{ 
                backgroundColor: theme.accentCyan,
                color: '#000',
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              }}
            >
              Portal do Parceiro
            </button>
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <section 
        id="hero" 
        className="relative w-full min-h-screen flex items-center justify-center text-center pb-24 sm:pb-28"
        style={{
          backgroundImage: `url(${barbacenaHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(135deg, rgba(10, 31, 61, 0.92) 0%, rgba(5, 11, 20, 0.75) 50%, rgba(108, 92, 231, 0.3) 100%)`,
          }}
        />
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, #050b14 120%)',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24">
          {/* Tag */}
          <span 
            className="inline-block px-3 sm:px-5 py-1.5 sm:py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6"
            style={{ 
              backgroundColor: 'rgba(9, 132, 227, 0.2)',
              border: `1px solid ${theme.neonBlue}`,
              color: theme.accentCyan,
              backdropFilter: 'blur(5px)',
            }}
          >
            {content.badge}
          </span>

          {/* Headline */}
          <h1 
            className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-4 sm:mb-8"
            style={{ 
              background: 'linear-gradient(180deg, #FFFFFF 0%, #A0A0A0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            {content.heroTitle}
            <br />
            <span 
              className="text-xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl"
              style={{ 
                color: theme.neonBlue,
                WebkitTextFillColor: theme.neonBlue,
                textShadow: `0 0 40px rgba(9, 132, 227, 0.6)`,
              }}
            >
              {content.heroTitleHighlight}
            </span>
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 max-w-3xl mx-auto mb-6 sm:mb-10 leading-relaxed px-2">
            {content.heroDescription}
          </p>

          {/* CTA Button */}
          <button
            onClick={() => scrollToSection('ticket-form')}
            className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-10 lg:px-14 py-3 sm:py-4 lg:py-5 font-bold text-sm sm:text-base lg:text-lg uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-1"
            style={{ 
              background: `linear-gradient(90deg, ${theme.neonPurple}, ${theme.neonBlue})`,
              clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
              boxShadow: '0 0 30px rgba(108, 92, 231, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 50px rgba(9, 132, 227, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(108, 92, 231, 0.4)';
            }}
          >
            Abrir Chamado
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div 
          className="absolute bottom-0 left-0 right-0 py-4 sm:py-6 lg:py-8 grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-8 lg:gap-16 xl:gap-24 z-20 px-4"
          style={{ 
            backgroundColor: 'rgba(10, 31, 61, 0.85)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-0.5 sm:mb-1">
                {stat.value}
              </div>
              <div 
                className="text-[10px] sm:text-xs uppercase tracking-wider leading-tight"
                style={{ color: theme.accentCyan }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative py-12 sm:py-20 lg:py-28 px-3 sm:px-6 lg:px-16" style={{ backgroundColor: theme.darkBg }}>
        {/* Decorative glow */}
        <div 
          className="absolute top-1/4 right-0 w-48 sm:w-72 h-64 sm:h-96 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(9, 132, 227, 0.05) 0%, transparent 70%)' }}
        />
        
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-16 lg:mb-20">
            <span 
              className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-4 block"
              style={{ color: theme.neonPurple }}
            >
              Nossa Expertise
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">
              INFRAESTRUTURA INTEGRADA
            </h2>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {(content.modules.length > 0 ? content.modules : defaultServices).map((service, i) => {
              const IconComponent = 'icon' in service && typeof service.icon === 'string' 
                ? iconMap[service.icon] || Building2 
                : ('icon' in service ? service.icon : Building2);
              
              return (
                <div 
                  key={i}
                  className="group relative p-5 sm:p-8 lg:p-10 transition-all duration-400 overflow-hidden"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(9, 132, 227, 0.3)';
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
                    const bar = e.currentTarget.querySelector('.gradient-bar') as HTMLElement;
                    if (bar) bar.style.opacity = '1';
                    const icon = e.currentTarget.querySelector('.service-icon') as HTMLElement;
                    if (icon) {
                      icon.style.transform = 'scale(1.1)';
                      icon.style.color = '#fff';
                      icon.style.textShadow = `0 0 20px ${theme.neonBlue}`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.boxShadow = 'none';
                    const bar = e.currentTarget.querySelector('.gradient-bar') as HTMLElement;
                    if (bar) bar.style.opacity = '0';
                    const icon = e.currentTarget.querySelector('.service-icon') as HTMLElement;
                    if (icon) {
                      icon.style.transform = 'scale(1)';
                      icon.style.color = theme.accentCyan;
                      icon.style.textShadow = 'none';
                    }
                  }}
                >
                  {/* Top gradient bar */}
                  <div 
                    className="gradient-bar absolute top-0 left-0 right-0 h-1 transition-opacity duration-300"
                    style={{ 
                      background: `linear-gradient(90deg, ${theme.neonPurple}, ${theme.neonBlue})`,
                      opacity: 0,
                    }}
                  />
                  
                  <IconComponent 
                    className="service-icon w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-4 sm:mb-6 transition-all duration-300"
                    style={{ color: theme.accentCyan }}
                  />
                  
                  <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-4">
                    {service.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed text-xs sm:text-sm lg:text-base mb-4 sm:mb-6">
                    {service.description}
                  </p>
                  
                  <button 
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wide transition-colors"
                    style={{ color: theme.neonPurple }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = theme.accentCyan;
                      const arrow = e.currentTarget.querySelector('svg');
                      if (arrow) arrow.style.marginLeft = '10px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme.neonPurple;
                      const arrow = e.currentTarget.querySelector('svg');
                      if (arrow) arrow.style.marginLeft = '0';
                    }}
                  >
                    Saiba Mais
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-all duration-300" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery/Projects Section */}
      <section id="projects" className="py-12 sm:py-20 lg:py-28 px-3 sm:px-6 lg:px-16" style={{ backgroundColor: theme.darkBg }}>
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-16 lg:mb-20">
            <span 
              className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-4 block"
              style={{ color: theme.neonPurple }}
            >
              Portfólio
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">
              VISUALIZAÇÃO DE PROJETOS
            </h2>
          </div>

          {/* Gallery Grid - Mobile: stack, Desktop: complex grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {/* Large Image */}
            <div 
              className="sm:col-span-2 sm:row-span-2 relative overflow-hidden rounded-md group cursor-pointer"
              style={{ minHeight: '250px' }}
            >
              <img 
                src={barbacenaHero}
                alt="Centro de Barbacena"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ minHeight: '250px' }}
              />
              <div 
                className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-0 sm:translate-y-5 sm:group-hover:translate-y-0 transition-all duration-300"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
              >
                <h4 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-1">Centro de Barbacena</h4>
                <p style={{ color: theme.accentCyan }} className="text-xs sm:text-sm">Transição LED Completa - 2023</p>
              </div>
            </div>

            {/* Tech Pattern 1 */}
            <div 
              className="aspect-[16/9] sm:aspect-square flex flex-col items-center justify-center rounded-md p-4"
              style={{ 
                backgroundColor: '#0d121d',
                backgroundImage: `radial-gradient(circle at 10% 20%, rgba(108, 92, 231, 0.1) 0%, transparent 20%),
                  linear-gradient(45deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.02) 75%, rgba(255, 255, 255, 0.02))`,
                backgroundSize: '100% 100%, 20px 20px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white/10 mb-2 sm:mb-4" />
              <h4 className="text-sm sm:text-lg lg:text-xl font-bold mb-1" style={{ color: theme.neonBlue }}>Centro de Controle</h4>
              <p className="text-white/50 text-xs sm:text-sm">Dados em Tempo Real</p>
            </div>

            {/* Tech Pattern 2 */}
            <div 
              className="aspect-[16/9] sm:aspect-square flex flex-col items-center justify-center rounded-md p-4"
              style={{ 
                backgroundColor: '#0d121d',
                backgroundImage: `radial-gradient(circle at 80% 80%, rgba(9, 132, 227, 0.1) 0%, transparent 20%)`,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <Wifi className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white/10 mb-2 sm:mb-4" />
              <h4 className="text-sm sm:text-lg lg:text-xl font-bold mb-1" style={{ color: theme.neonBlue }}>Conectividade</h4>
              <p className="text-white/50 text-xs sm:text-sm">99.9% de Disponibilidade</p>
            </div>

            {/* Wide Tech Card */}
            <div 
              className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-start justify-between p-4 sm:p-6 lg:p-10 rounded-md gap-4"
              style={{ 
                background: `linear-gradient(90deg, ${theme.darkBgSecondary} 0%, #0d1a2f 100%)`,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex-1">
                <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-white mb-2">Topologia da Rede Inteligente</h3>
                <p className="text-white/60 text-xs sm:text-sm lg:text-base mb-4 sm:mb-6">Mapeamento otimizado da rede de distribuição de energia.</p>
                
                {/* Progress bar */}
                <div 
                  className="w-full h-1 rounded-full relative"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div 
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ 
                      width: '75%', 
                      backgroundColor: theme.neonBlue,
                      boxShadow: `0 0 10px ${theme.neonBlue}`,
                    }}
                  />
                </div>
              </div>
              <MapPin className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex-shrink-0" style={{ color: theme.neonPurple }} />
            </div>
          </div>
        </div>
      </section>

      {/* Technology/About Section */}
      <section id="technology" className="py-12 sm:py-20 lg:py-28 px-3 sm:px-6 lg:px-16" style={{ backgroundColor: theme.darkBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-20 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div 
                className="relative overflow-hidden rounded-lg"
                style={{ aspectRatio: '4/3' }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop" 
                  alt="Tecnologia Smart City"
                  className="w-full h-full object-cover"
                />
                {/* Overlay effect */}
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: `linear-gradient(135deg, ${theme.neonBlue}20 0%, transparent 50%, ${theme.neonPurple}20 100%)`,
                  }}
                />
              </div>
              {/* Decorative frame - hidden on mobile */}
              <div 
                className="absolute -inset-3 sm:-inset-4 rounded-lg -z-10 hidden sm:block"
                style={{ 
                  border: `1px solid ${theme.neonBlue}30`,
                }}
              />
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <span 
                className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-4 block"
                style={{ color: theme.neonPurple }}
              >
                Tecnologia
              </span>
              <h2 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-8 leading-tight">
                INOVAÇÃO QUE<br />
                <span style={{ color: theme.accentCyan }}>TRANSFORMA</span>
              </h2>
              <p className="text-white/70 leading-relaxed text-sm sm:text-base lg:text-lg mb-4 sm:mb-8">
                Utilizamos as tecnologias mais avançadas do mercado para criar soluções de infraestrutura urbana que não apenas atendem às necessidades de hoje, mas antecipam os desafios do futuro.
              </p>
              <p className="text-white/70 leading-relaxed text-sm sm:text-base lg:text-lg mb-6 sm:mb-10 hidden sm:block">
                Nossos sistemas integram IoT, inteligência artificial e análise de dados em tempo real para otimizar o desempenho e garantir a máxima eficiência energética.
              </p>
              
              {/* Features list */}
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:space-y-4">
                {['Telegestão Avançada', 'Manutenção Preditiva', 'Análise de Dados', 'Integração IoT'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-4">
                    <div 
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${theme.neonBlue}20` }}
                    >
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: theme.accentCyan }} />
                    </div>
                    <span className="text-white font-medium text-xs sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 sm:py-20 lg:py-28 px-3 sm:px-6 lg:px-16" style={{ backgroundColor: theme.darkBgSecondary }}>
        <div className="max-w-6xl mx-auto text-center">
          <span 
            className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-4 block"
            style={{ color: theme.neonPurple }}
          >
            Quem Somos
          </span>
          <h2 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-8">
            LIDERANÇA EM CIDADES INTELIGENTES
          </h2>
          <p className="text-white/70 leading-relaxed text-sm sm:text-base lg:text-lg max-w-4xl mx-auto mb-10 sm:mb-16 px-2">
            Nascemos com a missão de transformar a realidade das cidades brasileiras através da tecnologia e da eficiência. Somos especialistas em estruturar projetos complexos que unem o setor público e privado em prol do cidadão.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
            {[
              { value: '+50', label: 'Cidades Atendidas' },
              { value: '+200k', label: 'Pontos de Luz' },
              { value: '15', label: 'Anos de Experiência' },
              { value: '100%', label: 'Compromisso' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <h3 
                  className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-1 sm:mb-3"
                  style={{ color: theme.accentCyan }}
                >
                  {stat.value}
                </h3>
                <span className="text-white/60 text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ticket/Chamado Section */}
      <section 
        id="chamado" 
        className="relative py-12 sm:py-20 lg:py-28 px-3 sm:px-6 lg:px-16"
        style={{ backgroundColor: theme.darkBg }}
      >
        {/* Decorative elements */}
        <div 
          className="absolute top-1/4 right-0 w-48 sm:w-96 h-48 sm:h-96 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(9, 132, 227, 0.08) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-1/4 left-0 w-48 sm:w-96 h-48 sm:h-96 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(108, 92, 231, 0.05) 0%, transparent 70%)' }}
        />

        <div className="max-w-6xl mx-auto">
          {/* Section Header with Call Center Info */}
          <div className="text-center mb-8 sm:mb-12">
            <span 
              className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-4 block"
              style={{ color: theme.neonPurple }}
            >
              Registrar Ocorrência
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4">
              ABRA SEU <span style={{ color: theme.accentCyan }}>CHAMADO</span>
            </h2>
            <p className="text-white/70 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto mb-6">
              Identificou um problema na iluminação pública? Registre sua ocorrência ou ligue para nosso Call Center.
            </p>

            {/* Compact Call Center Banner */}
            <div 
              className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-6 p-4 sm:p-5 rounded-xl"
              style={{ 
                backgroundColor: 'rgba(9, 132, 227, 0.1)',
                border: `1px solid ${theme.neonBlue}30`,
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.neonBlue}30` }}
                >
                  <Phone className="w-5 h-5" style={{ color: theme.accentCyan }} />
                </div>
                <div className="text-left">
                  <p className="text-white/60 text-xs uppercase tracking-wider">Ligue Grátis</p>
                  <p className="text-lg sm:text-xl font-bold" style={{ color: theme.accentCyan }}>
                    0800-006-1737
                  </p>
                </div>
              </div>
              
              <div className="hidden sm:block w-px h-10 bg-white/10" />
              
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: theme.neonPurple }} />
                  <span className="text-white/70">Seg-Sex: <span className="text-white">7:30-23:00</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: theme.neonPurple }} />
                  <span className="text-white/70">Sáb: <span className="text-white">8:00-20:00</span></span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-10 bg-white/10" />

              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Globe className="w-4 h-4" style={{ color: theme.neonPurple }} />
                <span className="text-white/70">App <span className="text-white">Cidade Iluminada</span></span>
              </div>
            </div>
          </div>

          {/* Compact Info Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
            <div 
              className="p-3 sm:p-4 rounded-lg sm:rounded-xl text-center"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" style={{ color: theme.neonBlue }} />
              <h4 className="text-white font-semibold text-xs sm:text-sm">Localize no Mapa</h4>
            </div>

            <div 
              className="p-3 sm:p-4 rounded-lg sm:rounded-xl text-center"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" style={{ color: theme.neonPurple }} />
              <h4 className="text-white font-semibold text-xs sm:text-sm">Informe a Plaqueta</h4>
            </div>

            <div 
              className="p-3 sm:p-4 rounded-lg sm:rounded-xl text-center"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" style={{ color: theme.accentCyan }} />
              <h4 className="text-white font-semibold text-xs sm:text-sm">Atendimento Rápido</h4>
            </div>
          </div>

          {/* Ticket Form */}
          <div 
            id="ticket-form"
            className="relative p-5 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl overflow-hidden"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <TicketForm accentColor={theme.neonBlue} tenantId={tenantId || undefined} branchId={branchId || undefined} />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        id="contact" 
        className="relative py-12 sm:py-20 lg:py-28 px-3 sm:px-6 lg:px-16"
        style={{ background: `linear-gradient(180deg, ${theme.darkBg} 0%, ${theme.darkBgSecondary} 100%)` }}
      >
        {/* Decorative glow */}
        <div 
          className="absolute bottom-1/4 left-0 w-48 sm:w-96 h-48 sm:h-96 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(108, 92, 231, 0.05) 0%, transparent 70%)' }}
        />
        
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-16 lg:mb-20">
            <span 
              className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-4 block"
              style={{ color: theme.neonPurple }}
            >
              Fale Conosco
            </span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">
              INICIE A CONVERSA
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Call Center Info */}
            <div 
              className="relative p-5 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl overflow-hidden"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Decorative glow */}
              <div 
                className="absolute -top-1/2 -left-1/4 w-[300px] h-[300px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(0, 210, 255, 0.1) 0%, transparent 70%)' }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${theme.neonBlue}20`, border: `1px solid ${theme.neonBlue}30` }}
                  >
                    <Phone className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: theme.accentCyan }} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Call Center</h3>
                    <p className="text-white/60 text-sm">Central de Atendimento</p>
                  </div>
                </div>

                {/* Phone Number */}
                <div 
                  className="p-4 sm:p-5 rounded-xl mb-6"
                  style={{ backgroundColor: 'rgba(9, 132, 227, 0.1)', border: `1px solid ${theme.neonBlue}30` }}
                >
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Ligue Grátis</p>
                  <p 
                    className="text-2xl sm:text-3xl font-bold"
                    style={{ color: theme.accentCyan }}
                  >
                    0800-006-1737
                  </p>
                </div>

                {/* Schedule */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: theme.neonPurple }} />
                    <div>
                      <p className="text-white font-medium text-sm sm:text-base">Segunda à Sexta</p>
                      <p className="text-white/60 text-sm">7:30 às 23:00</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: theme.neonPurple }} />
                    <div>
                      <p className="text-white font-medium text-sm sm:text-base">Sábados</p>
                      <p className="text-white/60 text-sm">8:00 às 20:00</p>
                    </div>
                  </div>
                </div>

                {/* App Info */}
                <div 
                  className="p-4 rounded-xl mb-6"
                  style={{ backgroundColor: 'rgba(108, 92, 231, 0.1)', border: `1px solid ${theme.neonPurple}30` }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-5 h-5" style={{ color: theme.neonPurple }} />
                    <p className="text-white font-medium text-sm sm:text-base">Aplicativo Cidade Iluminada</p>
                  </div>
                  <p className="text-white/60 text-xs sm:text-sm">
                    Registre solicitações também pelo nosso aplicativo disponível para download.
                  </p>
                </div>

                {/* Description */}
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-4">
                  Para registros, solicitações e reparos que envolvam a iluminação pública de Barbacena, os munícipes têm à disposição nosso Call Center. Todos os registros informados pelos usuários são gerenciados e armazenados pelo software de gestão fornecido pela CONCIP, que permite acompanhamento em tempo integral do andamento das atividades.
                </p>

                <div 
                  className="p-3 rounded-lg text-xs"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
                >
                  <p className="text-white/40">
                    <strong className="text-white/60">Início das Atividades:</strong> A CONCIP recebeu formalmente a OS no dia 09/03/2022 para início das atividades no dia 20/03/2023, conforme alinhado com o poder concedente.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form Container */}
            <div 
              className="relative p-5 sm:p-8 lg:p-10 rounded-xl sm:rounded-2xl overflow-hidden"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Decorative purple glow */}
              <div 
                className="absolute -top-1/2 -right-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(108, 92, 231, 0.15) 0%, transparent 70%)' }}
              />

              <div className="relative z-10 mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${theme.neonPurple}20`, border: `1px solid ${theme.neonPurple}30` }}
                  >
                    <Mail className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: theme.neonPurple }} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Envie uma Mensagem</h3>
                    <p className="text-white/60 text-sm">Responderemos em breve</p>
                  </div>
                </div>
              </div>

              <form className="relative z-10 space-y-6">
                {/* Name */}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder=" "
                    className="w-full bg-transparent border-b py-3 sm:py-4 text-white text-sm sm:text-base focus:outline-none transition-colors peer"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.neonBlue}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                  />
                  <label 
                    className="absolute top-3 sm:top-4 left-0 text-white/50 text-sm sm:text-base pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#0984E3] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    Nome Completo
                  </label>
                </div>

                {/* Email */}
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder=" "
                    className="w-full bg-transparent border-b py-3 sm:py-4 text-white text-sm sm:text-base focus:outline-none transition-colors peer"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.neonBlue}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                  />
                  <label 
                    className="absolute top-3 sm:top-4 left-0 text-white/50 text-sm sm:text-base pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#0984E3] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    E-mail
                  </label>
                </div>

                {/* Subject */}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder=" "
                    className="w-full bg-transparent border-b py-3 sm:py-4 text-white text-sm sm:text-base focus:outline-none transition-colors peer"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.neonBlue}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                  />
                  <label 
                    className="absolute top-3 sm:top-4 left-0 text-white/50 text-sm sm:text-base pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#0984E3] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    Assunto
                  </label>
                </div>

                {/* Message */}
                <div className="relative">
                  <textarea 
                    placeholder=" "
                    rows={3}
                    className="w-full bg-transparent border-b py-3 sm:py-4 text-white text-sm sm:text-base focus:outline-none transition-colors peer resize-none"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.neonBlue}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                  />
                  <label 
                    className="absolute top-3 sm:top-4 left-0 text-white/50 text-sm sm:text-base pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#0984E3] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                  >
                    Mensagem
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-4 sm:py-5 font-bold text-sm sm:text-base uppercase tracking-widest text-white transition-all duration-300 mt-2"
                  style={{ 
                    backgroundColor: theme.neonBlue,
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.neonPurple;
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(108, 92, 231, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.neonBlue;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Enviar Mensagem
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-8 sm:py-12 lg:py-16 px-3 sm:px-6 lg:px-16"
        style={{ 
          backgroundColor: '#020408',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-20 mb-8 sm:mb-12">
            {/* Brand */}
            <div className="max-w-xs">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                {content.logoUrl ? (
                  <img src={content.logoUrl} alt={content.companyName} className="h-6 sm:h-8 object-contain" />
                ) : (
                  <>
                    <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.accentCyan }} />
                    {content.companyName} PPP
                  </>
                )}
              </h2>
              <p className="text-white/40 text-xs sm:text-sm leading-relaxed">
                Inovando espaços urbanos através da luz, tecnologia e parcerias sustentáveis.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-16">
              <div>
                <h4 className="font-bold text-white mb-3 sm:mb-5 text-xs sm:text-sm">Soluções</h4>
                <ul className="space-y-2 sm:space-y-3 text-white/50 text-xs sm:text-sm">
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Iluminação Pública</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Smart City IoT</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Usinas de Energia</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Sistemas de Segurança</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-3 sm:mb-5 text-xs sm:text-sm">Empresa</h4>
                <ul className="space-y-2 sm:space-y-3 text-white/50 text-xs sm:text-sm">
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Sobre Nós</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Projetos</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Notícias</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Contato</a></li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <h4 className="font-bold text-white mb-3 sm:mb-5 text-xs sm:text-sm">Conecte-se</h4>
                <ul className="space-y-2 sm:space-y-3 text-white/50 text-xs sm:text-sm">
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Instagram</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div 
            className="text-center pt-6 sm:pt-8 text-white/30 text-[10px] sm:text-xs"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
          >
            &copy; 2023 {content.companyName} PPP Solutions. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
