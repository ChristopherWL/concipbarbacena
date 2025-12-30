import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, ArrowRight, Menu, X,
  Package, Truck, Users, ClipboardList, BarChart3, FileText, Shield, Zap, Clock,
  Lightbulb, Wifi, Camera, Sun, Radio, Globe, MapPin, CheckCircle, Award, Phone, Mail
} from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import barbacenaHero from '@/assets/barbacena-praca.jpg';

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
            ctaPrimary: generic.ctaPrimary || 'Iniciar Transformação',
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
            ctaPrimary: 'Iniciar Transformação',
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
          ctaPrimary: 'Iniciar Transformação',
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
    <div className="min-h-screen antialiased" style={{ backgroundColor: theme.darkBg, color: theme.white, fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 lg:px-16 py-6 sm:py-8 flex justify-between items-center"
        style={{ background: 'linear-gradient(to bottom, rgba(5,11,20,0.9), transparent)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {content.logoUrl ? (
            <img src={content.logoUrl} alt={content.companyName} className="h-8 sm:h-10 object-contain" />
          ) : (
            <>
              <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: theme.accentCyan }} />
              <span className="font-bold text-xl sm:text-2xl text-white tracking-wider">
                {content.companyName}
                <span className="font-light opacity-80 ml-1">PPP</span>
              </span>
            </>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-10">
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
          className="hidden lg:flex items-center px-6 sm:px-8 py-3 font-bold text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-lg"
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
          className="lg:hidden fixed inset-0 z-40 pt-20"
          style={{ backgroundColor: 'rgba(5,11,20,0.98)', backdropFilter: 'blur(10px)' }}
        >
          <nav className="flex flex-col items-center justify-center gap-8 h-full">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-xl font-medium uppercase tracking-widest text-white/80 hover:text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}
              className="mt-8 px-10 py-4 font-bold text-sm uppercase tracking-wider"
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
        className="relative w-full min-h-screen flex items-center justify-center text-center"
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
            background: `linear-gradient(135deg, rgba(10, 31, 61, 0.9) 0%, rgba(5, 11, 20, 0.7) 50%, rgba(108, 92, 231, 0.3) 100%)`,
          }}
        />
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, #050b14 120%)',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-20">
          {/* Tag */}
          <span 
            className="inline-block px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 sm:mb-8"
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
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 sm:mb-10"
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
          <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-10 sm:mb-14 leading-relaxed px-4">
            {content.heroDescription}
          </p>

          {/* CTA Button */}
          <button
            onClick={() => scrollToSection('contact')}
            className="inline-flex items-center gap-3 px-10 sm:px-14 py-5 sm:py-6 font-bold text-base sm:text-lg uppercase tracking-wide text-white transition-all duration-300 hover:-translate-y-1"
            style={{ 
              background: `linear-gradient(90deg, ${theme.neonPurple}, ${theme.neonBlue})`,
              clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
              boxShadow: '0 0 30px rgba(108, 92, 231, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 50px rgba(9, 132, 227, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(108, 92, 231, 0.4)';
            }}
          >
            {content.ctaPrimary}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div 
          className="absolute bottom-0 left-0 right-0 py-6 sm:py-8 flex flex-wrap justify-center gap-8 sm:gap-16 lg:gap-24 z-20"
          style={{ 
            backgroundColor: 'rgba(10, 31, 61, 0.8)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                {stat.value}
              </div>
              <div 
                className="text-xs sm:text-sm uppercase tracking-wider"
                style={{ color: theme.accentCyan }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-8 lg:px-16" style={{ backgroundColor: theme.darkBg }}>
        {/* Decorative glow */}
        <div 
          className="absolute top-1/4 right-0 w-72 h-96 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(9, 132, 227, 0.05) 0%, transparent 70%)' }}
        />
        
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 sm:mb-20">
            <span 
              className="text-sm font-bold uppercase tracking-widest mb-4 block"
              style={{ color: theme.neonPurple }}
            >
              Nossa Expertise
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              INFRAESTRUTURA INTEGRADA
            </h2>
          </div>

          {/* Services Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {(content.modules.length > 0 ? content.modules : defaultServices).map((service, i) => {
              const IconComponent = 'icon' in service && typeof service.icon === 'string' 
                ? iconMap[service.icon] || Building2 
                : ('icon' in service ? service.icon : Building2);
              
              return (
                <div 
                  key={i}
                  className="group relative p-8 sm:p-10 transition-all duration-400 overflow-hidden"
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
                    className="service-icon w-10 h-10 sm:w-12 sm:h-12 mb-6 transition-all duration-300"
                    style={{ color: theme.accentCyan }}
                  />
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                    {service.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed text-sm sm:text-base mb-6">
                    {service.description}
                  </p>
                  
                  <button 
                    className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide transition-colors"
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
                    <ArrowRight className="w-4 h-4 transition-all duration-300" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery/Projects Section */}
      <section id="projects" className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16" style={{ backgroundColor: theme.darkBg }}>
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 sm:mb-20">
            <span 
              className="text-sm font-bold uppercase tracking-widest mb-4 block"
              style={{ color: theme.neonPurple }}
            >
              Portfólio
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              VISUALIZAÇÃO DE PROJETOS
            </h2>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Large Image */}
            <div 
              className="col-span-2 row-span-2 relative overflow-hidden rounded-md group cursor-pointer"
              style={{ minHeight: '400px' }}
            >
              <img 
                src={barbacenaHero}
                alt="Centro de Barbacena"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div 
                className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 opacity-0 group-hover:opacity-100 translate-y-5 group-hover:translate-y-0 transition-all duration-300"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
              >
                <h4 className="text-lg sm:text-xl font-bold text-white mb-1">Centro de Barbacena</h4>
                <p style={{ color: theme.accentCyan }} className="text-sm">Transição LED Completa - 2023</p>
              </div>
            </div>

            {/* Tech Pattern 1 */}
            <div 
              className="col-span-1 aspect-square flex flex-col items-center justify-center rounded-md"
              style={{ 
                backgroundColor: '#0d121d',
                backgroundImage: `radial-gradient(circle at 10% 20%, rgba(108, 92, 231, 0.1) 0%, transparent 20%),
                  linear-gradient(45deg, rgba(255, 255, 255, 0.02) 25%, transparent 25%, transparent 75%, rgba(255, 255, 255, 0.02) 75%, rgba(255, 255, 255, 0.02))`,
                backgroundSize: '100% 100%, 20px 20px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-white/10 mb-4" />
              <h4 className="text-lg sm:text-xl font-bold mb-1" style={{ color: theme.neonBlue }}>Centro de Controle</h4>
              <p className="text-white/50 text-sm">Dados em Tempo Real</p>
            </div>

            {/* Tech Pattern 2 */}
            <div 
              className="col-span-1 aspect-square flex flex-col items-center justify-center rounded-md"
              style={{ 
                backgroundColor: '#0d121d',
                backgroundImage: `radial-gradient(circle at 80% 80%, rgba(9, 132, 227, 0.1) 0%, transparent 20%)`,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <Wifi className="w-12 h-12 sm:w-16 sm:h-16 text-white/10 mb-4" />
              <h4 className="text-lg sm:text-xl font-bold mb-1" style={{ color: theme.neonBlue }}>Conectividade</h4>
              <p className="text-white/50 text-sm">99.9% de Disponibilidade</p>
            </div>

            {/* Wide Tech Card */}
            <div 
              className="col-span-2 flex items-start justify-between p-6 sm:p-10 rounded-md"
              style={{ 
                background: `linear-gradient(90deg, ${theme.darkBgSecondary} 0%, #0d1a2f 100%)`,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Topologia da Rede Inteligente</h3>
                <p className="text-white/60 text-sm sm:text-base mb-6">Mapeamento otimizado da rede de distribuição de energia.</p>
                
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
              <MapPin className="w-10 h-10 sm:w-12 sm:h-12 ml-6 flex-shrink-0" style={{ color: theme.neonPurple }} />
            </div>
          </div>
        </div>
      </section>

      {/* Technology/About Section */}
      <section id="technology" className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16" style={{ backgroundColor: theme.darkBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image */}
            <div className="relative">
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
              {/* Decorative frame */}
              <div 
                className="absolute -inset-4 rounded-lg -z-10"
                style={{ 
                  border: `1px solid ${theme.neonBlue}30`,
                }}
              />
            </div>

            {/* Content */}
            <div>
              <span 
                className="text-sm font-bold uppercase tracking-widest mb-4 block"
                style={{ color: theme.neonPurple }}
              >
                Tecnologia
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
                INOVAÇÃO QUE<br />
                <span style={{ color: theme.accentCyan }}>TRANSFORMA</span>
              </h2>
              <p className="text-white/70 leading-relaxed text-base sm:text-lg mb-8">
                Utilizamos as tecnologias mais avançadas do mercado para criar soluções de infraestrutura urbana que não apenas atendem às necessidades de hoje, mas antecipam os desafios do futuro.
              </p>
              <p className="text-white/70 leading-relaxed text-base sm:text-lg mb-10">
                Nossos sistemas integram IoT, inteligência artificial e análise de dados em tempo real para otimizar o desempenho e garantir a máxima eficiência energética.
              </p>
              
              {/* Features list */}
              <div className="space-y-4">
                {['Telegestão Avançada', 'Manutenção Preditiva', 'Análise de Dados', 'Integração IoT'].map((feature, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${theme.neonBlue}20` }}
                    >
                      <CheckCircle className="w-4 h-4" style={{ color: theme.accentCyan }} />
                    </div>
                    <span className="text-white font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 sm:py-28 px-4 sm:px-8 lg:px-16" style={{ backgroundColor: theme.darkBgSecondary }}>
        <div className="max-w-6xl mx-auto text-center">
          <span 
            className="text-sm font-bold uppercase tracking-widest mb-4 block"
            style={{ color: theme.neonPurple }}
          >
            Quem Somos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8">
            LIDERANÇA EM CIDADES INTELIGENTES
          </h2>
          <p className="text-white/70 leading-relaxed text-base sm:text-lg max-w-4xl mx-auto mb-16">
            Nascemos com a missão de transformar a realidade das cidades brasileiras através da tecnologia e da eficiência. Somos especialistas em estruturar projetos complexos que unem o setor público e privado em prol do cidadão, sempre focados em transparência, inovação e sustentabilidade.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {[
              { value: '+50', label: 'Cidades Atendidas' },
              { value: '+200k', label: 'Pontos de Luz' },
              { value: '15', label: 'Anos de Experiência' },
              { value: '100%', label: 'Compromisso' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <h3 
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3"
                  style={{ color: theme.accentCyan }}
                >
                  {stat.value}
                </h3>
                <span className="text-white/60 text-sm uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section 
        id="contact" 
        className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-8 lg:px-16"
        style={{ background: `linear-gradient(180deg, ${theme.darkBg} 0%, ${theme.darkBgSecondary} 100%)` }}
      >
        {/* Decorative glow */}
        <div 
          className="absolute bottom-1/4 left-0 w-96 h-96 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(108, 92, 231, 0.05) 0%, transparent 70%)' }}
        />
        
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 sm:mb-20">
            <span 
              className="text-sm font-bold uppercase tracking-widest mb-4 block"
              style={{ color: theme.neonPurple }}
            >
              Fale Conosco
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              INICIE A CONVERSA
            </h2>
          </div>

          {/* Contact Form Container */}
          <div 
            className="relative p-8 sm:p-12 lg:p-16 rounded-2xl overflow-hidden"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Decorative purple glow */}
            <div 
              className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(108, 92, 231, 0.15) 0%, transparent 70%)' }}
            />

            <form className="relative z-10 grid sm:grid-cols-2 gap-8 sm:gap-10">
              {/* Name */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder=" "
                  className="w-full bg-transparent border-b py-4 text-white text-base focus:outline-none transition-colors peer"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.neonBlue}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                />
                <label 
                  className="absolute top-4 left-0 text-white/50 text-base pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#0984E3] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Nome Completo
                </label>
              </div>

              {/* Email */}
              <div className="relative">
                <input 
                  type="email" 
                  placeholder=" "
                  className="w-full bg-transparent border-b py-4 text-white text-base focus:outline-none transition-colors peer"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.neonBlue}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                />
                <label 
                  className="absolute top-4 left-0 text-white/50 text-base pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#0984E3] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Endereço de E-mail
                </label>
              </div>

              {/* Subject */}
              <div className="relative sm:col-span-2">
                <input 
                  type="text" 
                  placeholder=" "
                  className="w-full bg-transparent border-b py-4 text-white text-base focus:outline-none transition-colors peer"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.neonBlue}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                />
                <label 
                  className="absolute top-4 left-0 text-white/50 text-base pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#0984E3] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Assunto
                </label>
              </div>

              {/* Message */}
              <div className="relative sm:col-span-2">
                <input 
                  type="text" 
                  placeholder=" "
                  className="w-full bg-transparent border-b py-4 pb-12 text-white text-base focus:outline-none transition-colors peer"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.neonBlue}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                />
                <label 
                  className="absolute top-4 left-0 text-white/50 text-base pointer-events-none transition-all duration-300 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#0984E3] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Mensagem
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="sm:col-span-2 w-full py-5 font-bold text-base uppercase tracking-widest text-white transition-all duration-300 mt-6"
                style={{ 
                  backgroundColor: theme.neonBlue,
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
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
      </section>

      {/* Footer */}
      <footer 
        className="py-12 sm:py-16 px-4 sm:px-8 lg:px-16"
        style={{ 
          backgroundColor: '#020408',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-20 mb-12">
            {/* Brand */}
            <div className="max-w-xs">
              <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                {content.logoUrl ? (
                  <img src={content.logoUrl} alt={content.companyName} className="h-8 object-contain" />
                ) : (
                  <>
                    <Lightbulb className="w-6 h-6" style={{ color: theme.accentCyan }} />
                    {content.companyName} PPP
                  </>
                )}
              </h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Inovando espaços urbanos através da luz, tecnologia e parcerias sustentáveis.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-16">
              <div>
                <h4 className="font-bold text-white mb-5 text-sm">Soluções</h4>
                <ul className="space-y-3 text-white/50 text-sm">
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Iluminação Pública</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Smart City IoT</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Usinas de Energia</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Sistemas de Segurança</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-5 text-sm">Empresa</h4>
                <ul className="space-y-3 text-white/50 text-sm">
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Sobre Nós</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Projetos</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Notícias</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Contato</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-5 text-sm">Conecte-se</h4>
                <ul className="space-y-3 text-white/50 text-sm">
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">LinkedIn</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Instagram</a></li>
                  <li><a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div 
            className="text-center pt-8 text-white/30 text-xs"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}
          >
            &copy; 2023 {content.companyName} PPP Solutions. Todos os direitos reservados. Projetado para o Futuro.
          </div>
        </div>
      </footer>
    </div>
  );
}
