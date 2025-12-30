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

// Theme colors from template
const theme = {
  primaryBlue: '#002B49',
  secondaryBlue: '#004e80',
  accentGold: '#C5A059',
  accentGoldHover: '#b08d4b',
  textDark: '#1A1A1A',
  textGray: '#666666',
  bgLight: '#F8F9FA',
  white: '#FFFFFF',
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
            primaryColor: data.primary_color || generic.primaryColor || theme.primaryBlue,
            secondaryColor: data.secondary_color || generic.secondaryColor || theme.secondaryBlue,
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
            primaryColor: theme.primaryBlue,
            secondaryColor: theme.secondaryBlue,
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
          primaryColor: theme.primaryBlue,
          secondaryColor: theme.secondaryBlue,
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
    { label: 'Projetos', id: 'gallery' },
    { label: 'Sobre', id: 'about' },
  ];

  const defaultServices = [
    { icon: Lightbulb, title: 'Iluminação Pública', description: 'Modernização do parque de iluminação com tecnologia LED de alta eficiência, reduzindo custos operacionais e aumentando a luminosidade das vias.' },
    { icon: Building2, title: 'Gestão de PPP', description: 'Estruturação e gestão completa de Parcerias Público-Privadas, garantindo viabilidade econômica, jurídica e técnica para o município.' },
    { icon: Camera, title: 'Câmeras Wi-Fi', description: 'Sistemas de monitoramento urbano integrados à rede de iluminação, promovendo segurança pública inteligente e em tempo real.' },
    { icon: Globe, title: 'Link Dedicado', description: 'Infraestrutura de conectividade robusta para órgãos públicos e serviços municipais, com alta disponibilidade e velocidade.' },
    { icon: Sun, title: 'Usina Fotovoltaica (UFV)', description: 'Implantação de usinas solares para geração de energia limpa, abastecendo prédios públicos e reduzindo a pegada de carbono.' },
    { icon: Radio, title: 'Iluminação Inteligente', description: 'Telegestão e sensores IoT integrados às luminárias, permitindo controle remoto, dimerização e manutenção preditiva.' },
  ];

  const stats = [
    { value: '+50', label: 'Cidades Atendidas' },
    { value: '+200k', label: 'Pontos de Luz' },
    { value: '15', label: 'Anos de Experiência' },
  ];

  const galleryItems = [
    { image: 'https://images.unsplash.com/photo-1617150119111-09bbb85611df?q=80&w=600&auto=format&fit=crop', title: 'Modernização LED', location: 'São Paulo, SP' },
    { image: 'https://images.unsplash.com/photo-1495539406979-bf61750d38ad?q=80&w=600&auto=format&fit=crop', title: 'Iluminação Viária', location: 'Curitiba, PR' },
    { image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop', title: 'Smart City Hub', location: 'Florianópolis, SC' },
    { image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop', title: 'Centro de Controle', location: 'Belo Horizonte, MG' },
    { image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=600&auto=format&fit=crop', title: 'Parque Solar', location: 'Recife, PE' },
    { image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=600&auto=format&fit=crop', title: 'Revitalização Urbana', location: 'Porto Alegre, RS' },
  ];

  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: theme.white, color: theme.textDark, fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'py-3 shadow-lg' 
            : 'py-4'
        }`}
        style={{ backgroundColor: theme.white }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {content.logoUrl ? (
                <img src={content.logoUrl} alt={content.companyName} className="h-10 object-contain" />
              ) : (
                <>
                  <Lightbulb className="w-8 h-8" style={{ color: theme.accentGold }} />
                  <span className="font-bold text-2xl" style={{ color: theme.primaryBlue }}>{content.companyName}</span>
                </>
              )}
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-sm font-bold uppercase tracking-wide transition-colors hover:opacity-70"
                  style={{ color: theme.primaryBlue }}
                >
                  {item.label}
                </button>
              ))}
              <Button
                onClick={() => scrollToSection('contact')}
                className="text-sm font-bold uppercase tracking-wide px-6"
                style={{ backgroundColor: theme.accentGold, color: theme.white }}
              >
                Fale Conosco
              </Button>
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg"
              style={{ color: theme.primaryBlue }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden absolute top-full left-0 right-0 shadow-lg border-t"
            style={{ backgroundColor: theme.white }}
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left px-4 py-3 text-sm font-bold uppercase rounded-lg transition-colors hover:bg-gray-100"
                  style={{ color: theme.primaryBlue }}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4">
                <Button
                  onClick={() => { setMobileMenuOpen(false); scrollToSection('contact'); }}
                  className="w-full font-bold uppercase"
                  style={{ backgroundColor: theme.accentGold, color: theme.white }}
                >
                  Fale Conosco
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section 
        id="hero" 
        ref={heroRef} 
        className="relative min-h-[700px] flex items-center pt-24"
        style={{
          background: `linear-gradient(90deg, rgba(0, 43, 73, 0.9) 0%, rgba(0, 43, 73, 0.6) 100%), url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1920&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient overlay at bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-36"
          style={{ background: `linear-gradient(to top, ${theme.white}, transparent)` }}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Badge */}
            {content.badge && (
              <span 
                className="inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border"
                style={{ 
                  backgroundColor: 'rgba(197, 160, 89, 0.2)', 
                  borderColor: theme.accentGold,
                  color: theme.accentGold 
                }}
              >
                {content.badge}
              </span>
            )}

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white">
              {content.heroTitle}
              {content.heroTitleHighlight && (
                <span className="block">{content.heroTitleHighlight}</span>
              )}
            </h1>

            {/* Description */}
            <p className="text-xl text-white/90 leading-relaxed mb-10 max-w-2xl">
              {content.heroDescription}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="text-base font-bold uppercase tracking-wide px-10 py-6"
                style={{ backgroundColor: theme.accentGold, color: theme.white }}
              >
                {content.ctaPrimary}
              </Button>
              {content.ctaSecondary && (
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base font-bold uppercase tracking-wide px-10 py-6 border-2 text-white hover:bg-white/10"
                  style={{ borderColor: theme.white }}
                >
                  {content.ctaSecondary}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: theme.white }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: theme.primaryBlue }}>
              Soluções Completas
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: theme.textGray }}>
              Oferecemos um ecossistema de infraestrutura para modernizar a gestão pública e melhorar a qualidade de vida urbana.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {(content.modules.length > 0 ? content.modules : defaultServices).map((service, i) => {
              const IconComponent = 'icon' in service && typeof service.icon === 'string' 
                ? iconMap[service.icon] || Building2 
                : ('icon' in service ? service.icon : Building2);
              
              return (
                <div 
                  key={i}
                  className="group rounded-lg p-10 border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl relative overflow-hidden"
                  style={{ 
                    backgroundColor: theme.white,
                    borderColor: '#E5E5E5',
                  }}
                >
                  {/* Bottom accent bar */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                    style={{ backgroundColor: theme.accentGold }}
                  />
                  
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-8 transition-all group-hover:text-white"
                    style={{ 
                      backgroundColor: `${theme.primaryBlue}10`,
                      color: theme.primaryBlue,
                    }}
                  >
                    <IconComponent className="w-9 h-9 transition-colors group-hover:text-white" />
                  </div>
                  <style>{`
                    .group:hover .service-icon-bg {
                      background-color: ${theme.primaryBlue} !important;
                    }
                  `}</style>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: theme.primaryBlue }}>
                    {service.title}
                  </h3>
                  <p className="leading-relaxed" style={{ color: theme.textGray }}>
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: theme.bgLight }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Content */}
            <div>
              <span 
                className="text-sm font-bold uppercase tracking-widest mb-3 block"
                style={{ color: theme.accentGold }}
              >
                Quem Somos
              </span>
              <h2 className="text-4xl font-bold mb-8 leading-tight" style={{ color: theme.primaryBlue }}>
                Liderança em Infraestrutura Urbana Sustentável
              </h2>
              <p className="text-lg leading-relaxed mb-6" style={{ color: theme.textGray }}>
                Nascemos com a missão de transformar a realidade das cidades brasileiras através da tecnologia e da eficiência. Somos especialistas em estruturar projetos complexos que unem o setor público e privado em prol do cidadão.
              </p>
              <p className="text-lg leading-relaxed mb-10" style={{ color: theme.textGray }}>
                Com um corpo técnico altamente qualificado, atuamos desde o estudo de viabilidade até a operação e manutenção de ativos de iluminação e conectividade, sempre focados em transparência, inovação e sustentabilidade.
              </p>
              
              {/* Stats Row */}
              <div className="flex flex-wrap gap-12 pt-10 border-t" style={{ borderColor: '#ddd' }}>
                {stats.map((stat, i) => (
                  <div key={i}>
                    <h4 className="text-4xl font-bold mb-2" style={{ color: theme.accentGold }}>
                      {stat.value}
                    </h4>
                    <span className="text-sm font-bold uppercase" style={{ color: theme.primaryBlue }}>
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              <div 
                className="relative rounded-lg overflow-hidden shadow-2xl"
                style={{ height: '600px' }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop" 
                  alt="Edifícios corporativos modernos"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative border */}
              <div 
                className="absolute -top-5 -left-5 w-full h-full rounded-lg border-4 -z-10"
                style={{ borderColor: theme.accentGold }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: theme.white }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
            <div>
              <h2 className="text-4xl font-bold mb-4" style={{ color: theme.primaryBlue }}>
                Nossos Projetos
              </h2>
              <p className="text-xl" style={{ color: theme.textGray }}>
                Veja como estamos iluminando o futuro das cidades.
              </p>
            </div>
            <Button
              variant="outline"
              className="font-bold uppercase tracking-wide border-2"
              style={{ borderColor: theme.accentGold, color: theme.accentGold }}
            >
              Ver Galeria Completa
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleryItems.map((item, i) => (
              <div 
                key={i} 
                className="group relative h-[350px] rounded-lg overflow-hidden cursor-pointer"
              >
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay */}
                <div 
                  className="absolute bottom-0 left-0 right-0 p-8 text-white opacity-0 translate-y-5 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
                >
                  <h4 className="text-xl font-bold">{item.title}</h4>
                  <p className="text-white/80">{item.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: theme.primaryBlue }}>
        {/* Decorative circle */}
        <div 
          className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full"
          style={{ background: `radial-gradient(circle, ${theme.accentGold}20 0%, transparent 70%)` }}
        />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[400px_1fr] gap-16 lg:gap-24">
            {/* Contact Info */}
            <div className="text-white">
              <h2 className="text-4xl font-bold mb-6">
                Vamos Transformar Sua Cidade?
              </h2>
              <p className="text-lg opacity-80 leading-relaxed mb-12">
                Entre em contato com nossa equipe de especialistas para discutir como podemos implementar soluções de iluminação e tecnologia no seu município.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Phone className="w-6 h-6" style={{ color: theme.accentGold }} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Ligue para nós</p>
                    <span className="text-lg font-bold">(11) 3000-0000</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-5">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Mail className="w-6 h-6" style={{ color: theme.accentGold }} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Envie um e-mail</p>
                    <span className="text-lg font-bold">contato@empresa.com.br</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-5">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: theme.accentGold }} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-60 mb-1">Sede Corporativa</p>
                    <span className="text-lg font-bold">Av. Paulista, 1000 - São Paulo, SP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="rounded-xl p-8 sm:p-12 relative z-10" style={{ backgroundColor: theme.white }}>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase" style={{ color: theme.primaryBlue }}>
                      Nome Completo
                    </label>
                    <Input 
                      placeholder="Digite seu nome"
                      className="h-12 border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase" style={{ color: theme.primaryBlue }}>
                      E-mail Corporativo
                    </label>
                    <Input 
                      type="email"
                      placeholder="nome@empresa.com"
                      className="h-12 border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-500"
                    />
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase" style={{ color: theme.primaryBlue }}>
                      Telefone
                    </label>
                    <Input 
                      placeholder="(00) 00000-0000"
                      className="h-12 border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold uppercase" style={{ color: theme.primaryBlue }}>
                      Assunto
                    </label>
                    <Input 
                      placeholder="Motivo do contato"
                      className="h-12 border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase" style={{ color: theme.primaryBlue }}>
                    Mensagem
                  </label>
                  <Textarea 
                    placeholder="Descreva sua necessidade..."
                    className="min-h-[150px] border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-500 resize-none"
                  />
                </div>
                
                <Button
                  type="button"
                  className="w-full h-14 font-bold uppercase tracking-wide"
                  style={{ backgroundColor: theme.primaryBlue, color: theme.white }}
                >
                  Enviar Mensagem
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t" style={{ backgroundColor: '#001f35', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between gap-12 mb-12">
            {/* Brand */}
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-6">
                {content.logoUrl ? (
                  <img src={content.logoUrl} alt={content.companyName} className="h-8 object-contain brightness-200" />
                ) : (
                  <>
                    <Lightbulb className="w-7 h-7" style={{ color: theme.accentGold }} />
                    <span className="font-bold text-2xl text-white">{content.companyName}</span>
                  </>
                )}
              </div>
              <p className="text-white/60 leading-relaxed">
                Líder em concessões de iluminação pública e soluções smart city. Compromisso com a eficiência, transparência e o desenvolvimento urbano sustentável.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-12 lg:gap-20">
              <div>
                <h4 className="font-bold text-white mb-6">Empresa</h4>
                <ul className="space-y-3 text-white/60">
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Sobre Nós</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Carreiras</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Imprensa</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Compliance</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-6">Soluções</h4>
                <ul className="space-y-3 text-white/60">
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Iluminação Pública</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Cidades Inteligentes</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Energia Solar</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Consultoria PPP</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-6">Legal</h4>
                <ul className="space-y-3 text-white/60">
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Termos de Uso</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Privacidade</a></li>
                  <li><a href="#" className="hover:text-amber-400 transition-colors">Política de Cookies</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} {content.companyName}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
