import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Building2, ArrowRight, Menu, X,
  Package, Truck, Users, ClipboardList, BarChart3, FileText, Shield, Zap, Clock,
  Lightbulb, Wifi, Camera, Sun, Radio, Globe, MapPin, CheckCircle, Award, Phone, Mail, AlertCircle,
  ChevronDown, Sparkles
} from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { useEffect, useState } from 'react';
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

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    const elements = document.querySelectorAll('.lp-animate');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [content]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data: result, error } = await supabase.functions.invoke('get-public-branding');
        if (error) throw error;
        
        const data = result?.branding;
        if (result?.tenantId) setTenantId(result.tenantId);
        if (result?.branchId) setBranchId(result.branchId);

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
            primaryColor: data.primary_color || generic.primaryColor || '#0984E3',
            secondaryColor: data.secondary_color || generic.secondaryColor || '#6C5CE7',
          });
        } else {
          setContent({
            companyName: 'Sistema ERP', companySubtitle: '', logoUrl: '', logoDarkUrl: '',
            badge: 'Soluções para Cidades Inteligentes',
            heroTitle: 'ILUMINANDO O', heroTitleHighlight: 'FUTURO DE BARBACENA',
            heroDescription: 'Parceria Público-Privada avançada entregando iluminação urbana de última geração, conectividade e infraestrutura de monitoramento inteligente para um amanhã mais seguro e brilhante.',
            ctaPrimary: 'Fale Conosco', ctaSecondary: '',
            stats: [], showStats: true, modules: [], features: [],
            showModules: true, showFeatures: false,
            ctaTitle: '', ctaDescription: '',
            primaryColor: '#0984E3', secondaryColor: '#6C5CE7',
          });
        }
      } catch (error) {
        console.error('Error fetching landing page content:', error);
        setContent({
          companyName: 'LUMINA PPP', companySubtitle: '', logoUrl: '', logoDarkUrl: '',
          badge: 'Soluções para Cidades Inteligentes',
          heroTitle: 'ILUMINANDO O', heroTitleHighlight: 'FUTURO DE BARBACENA',
          heroDescription: 'Parceria Público-Privada avançada entregando iluminação urbana de última geração, conectividade e infraestrutura de monitoramento inteligente para um amanhã mais seguro e brilhante.',
          ctaPrimary: 'Fale Conosco', ctaSecondary: '',
          stats: [], showStats: true, modules: [], features: [],
          showModules: true, showFeatures: false,
          ctaTitle: '', ctaDescription: '',
          primaryColor: '#0984E3', secondaryColor: '#6C5CE7',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (isLoading) return <PageLoading text="Carregando" />;
  if (!content) return null;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Serviços', id: 'services' },
    { label: 'Projetos', id: 'projects' },
    { label: 'Tecnologia', id: 'technology' },
    { label: 'Chamado', id: 'chamado' },
    { label: 'Contato', id: 'contact' },
  ];

  const defaultServices = [
    { icon: Lightbulb, title: 'Iluminação Pública', description: 'Sistemas de iluminação LED de alta eficiência com gerenciamento remoto para brilho e segurança ideais.' },
    { icon: Building2, title: 'Gestão de PPP', description: 'Modelos sustentáveis de Parceria Público-Privada garantindo manutenção e modernização de longo prazo.' },
    { icon: Camera, title: 'Câmeras Wi-Fi', description: 'Rede de câmeras de segurança integrada para vigilância urbana e monitoramento de tráfego.' },
    { icon: Globe, title: 'Link Dedicado', description: 'Links de fibra óptica de alta velocidade conectando infraestrutura pública e transmissão de dados.' },
    { icon: Sun, title: 'Usina UFV', description: 'Integração de Usinas Fotovoltaicas para compensar consumo e promover energia renovável.' },
    { icon: Radio, title: 'Iluminação Inteligente', description: 'Sensores IoT para iluminação adaptativa, monitoramento ambiental e manutenção preditiva.' },
  ];

  const stats = [
    { value: '12.000+', label: 'Pontos LED Inteligentes' },
    { value: '24/7', label: 'Centro de Monitoramento' },
    { value: '45%', label: 'Economia de Energia' },
    { value: '100%', label: 'Cobertura da Cidade' },
  ];

  const pc = content.primaryColor;
  const sc = content.secondaryColor;

  return (
    <div className="min-h-screen antialiased overflow-x-hidden bg-[#060c18] text-white" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>

      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-[#060c18]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/20' 
          : 'bg-gradient-to-b from-[#060c18]/80 to-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            {content.logoUrl ? (
              <img src={content.logoUrl} alt={content.companyName} className="h-7 sm:h-9 object-contain" />
            ) : (
              <>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${pc}, ${sc})` }}>
                  <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="font-bold text-lg sm:text-xl tracking-tight text-white">
                  {content.companyName}
                </span>
              </>
            )}
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="px-4 py-2 text-[13px] font-medium text-white/60 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, ${pc}, ${sc})` }}
            >
              Acessar
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#060c18]/98 backdrop-blur-2xl border-t border-white/[0.06] animate-fade-in">
            <nav className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-left px-4 py-3 text-white/70 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors text-sm font-medium"
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/auth'); }}
                className="mt-4 w-full py-3 rounded-lg text-white text-sm font-semibold"
                style={{ background: `linear-gradient(135deg, ${pc}, ${sc})` }}
              >
                Acessar Sistema
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={barbacenaHero} alt="Barbacena" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060c18]/85 via-[#060c18]/60 to-[#060c18]" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 40%, ${pc}18 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, ${sc}12 0%, transparent 50%)` }} />
        </div>

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24 sm:pt-28 pb-32">
          {/* Badge */}
          <div className="lp-animate inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] text-white/70 text-xs sm:text-sm font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" style={{ color: pc }} />
            {content.badge}
          </div>

          {/* Title */}
          <h1 className="lp-animate text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[1.05] mb-6 tracking-tight">
            <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
              {content.heroTitle}
            </span>
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${pc}, ${sc})` }}>
              {content.heroTitleHighlight}
            </span>
          </h1>

          {/* Description */}
          <p className="lp-animate text-sm sm:text-base lg:text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            {content.heroDescription}
          </p>

          {/* CTA */}
          <div className="lp-animate flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => scrollToSection('chamado')}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-white text-sm sm:text-base font-semibold transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, ${pc}, ${sc})`, boxShadow: `0 8px 32px ${pc}30` }}
            >
              Abrir Chamado
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white/70 text-sm sm:text-base font-medium border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              Acessar Sistema
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#060c18]/80 backdrop-blur-xl border-t border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-4 py-5 sm:py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${pc}, ${sc})` }}>
                  {stat.value}
                </div>
                <div className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider mt-1 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-white/20" />
        </div>
      </section>

      {/* ═══════════════════ SERVICES ═══════════════════ */}
      <section id="services" className="relative py-20 sm:py-28 lg:py-36">
        {/* Subtle accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${pc}40, transparent)` }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Header */}
          <div className="text-center mb-14 sm:mb-20">
            <span className="lp-animate text-xs font-bold uppercase tracking-[0.2em] mb-4 block" style={{ color: pc }}>
              Nossa Expertise
            </span>
            <h2 className="lp-animate text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Infraestrutura Integrada
            </h2>
            <p className="lp-animate text-white/40 mt-4 max-w-xl mx-auto text-sm sm:text-base">
              Soluções completas que unem tecnologia de ponta e eficiência operacional
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {(content.modules.length > 0 ? content.modules : defaultServices).map((service, i) => {
              const IconComponent = 'icon' in service && typeof service.icon === 'string'
                ? iconMap[service.icon] || Building2
                : ('icon' in service ? service.icon : Building2);
              return (
                <div
                  key={i}
                  className="lp-animate group relative p-6 sm:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-500 hover:-translate-y-1"
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  {/* Top accent line */}
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-current transition-all duration-500" style={{ color: pc }} />

                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${pc}15` }}>
                    <IconComponent className="w-5 h-5" style={{ color: pc }} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PROJECTS / GALLERY ═══════════════════ */}
      <section id="projects" className="py-20 sm:py-28 lg:py-36">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-14 sm:mb-20">
            <span className="lp-animate text-xs font-bold uppercase tracking-[0.2em] mb-4 block" style={{ color: pc }}>
              Portfólio
            </span>
            <h2 className="lp-animate text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Visualização de Projetos
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Large image */}
            <div className="sm:col-span-2 sm:row-span-2 relative overflow-hidden rounded-2xl group cursor-pointer" style={{ minHeight: '280px' }}>
              <img src={barbacenaHero} alt="Centro de Barbacena" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ minHeight: '280px' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                <h4 className="text-lg sm:text-xl font-bold text-white mb-1">Centro de Barbacena</h4>
                <p className="text-xs sm:text-sm font-medium" style={{ color: pc }}>Transição LED Completa — 2023</p>
              </div>
            </div>

            {/* Tech Card 1 */}
            <div className="aspect-[16/9] sm:aspect-square flex flex-col items-center justify-center rounded-2xl p-5 border border-white/[0.06] bg-white/[0.02]">
              <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-white/[0.08] mb-3" />
              <h4 className="text-sm sm:text-base font-bold mb-1" style={{ color: pc }}>Centro de Controle</h4>
              <p className="text-white/40 text-xs">Dados em Tempo Real</p>
            </div>

            {/* Tech Card 2 */}
            <div className="aspect-[16/9] sm:aspect-square flex flex-col items-center justify-center rounded-2xl p-5 border border-white/[0.06] bg-white/[0.02]">
              <Wifi className="w-10 h-10 sm:w-12 sm:h-12 text-white/[0.08] mb-3" />
              <h4 className="text-sm sm:text-base font-bold mb-1" style={{ color: pc }}>Conectividade</h4>
              <p className="text-white/40 text-xs">99.9% de Disponibilidade</p>
            </div>

            {/* Wide Card */}
            <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row items-start justify-between p-6 sm:p-8 rounded-2xl gap-4 border border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${pc}08, ${sc}06)` }}>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">Topologia da Rede Inteligente</h3>
                <p className="text-white/40 text-sm mb-5">Mapeamento otimizado da rede de distribuição de energia.</p>
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '75%', background: `linear-gradient(90deg, ${pc}, ${sc})` }} />
                </div>
              </div>
              <MapPin className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" style={{ color: sc }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TECHNOLOGY ═══════════════════ */}
      <section id="technology" className="py-20 sm:py-28 lg:py-36">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '4/3' }}>
                <img
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop"
                  alt="Tecnologia Smart City"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${pc}15 0%, transparent 50%, ${sc}10 100%)` }} />
              </div>
              {/* Decorative border */}
              <div className="absolute -inset-3 rounded-2xl border border-white/[0.04] -z-10 hidden sm:block" />
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <span className="lp-animate text-xs font-bold uppercase tracking-[0.2em] mb-4 block" style={{ color: pc }}>
                Tecnologia
              </span>
              <h2 className="lp-animate text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
                Inovação que{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${pc}, ${sc})` }}>
                  Transforma
                </span>
              </h2>
              <p className="lp-animate text-white/45 leading-relaxed text-sm sm:text-base mb-6">
                Utilizamos as tecnologias mais avançadas do mercado para criar soluções de infraestrutura urbana que não apenas atendem às necessidades de hoje, mas antecipam os desafios do futuro.
              </p>
              <p className="lp-animate text-white/45 leading-relaxed text-sm sm:text-base mb-8 hidden sm:block">
                Nossos sistemas integram IoT, inteligência artificial e análise de dados em tempo real para otimizar o desempenho e garantir a máxima eficiência energética.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
                {['Telegestão Avançada', 'Manutenção Preditiva', 'Análise de Dados', 'Integração IoT'].map((feature, i) => (
                  <div key={i} className="lp-animate flex items-center gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${pc}12` }}>
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: pc }} />
                    </div>
                    <span className="text-white/80 font-medium text-xs sm:text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ ABOUT ═══════════════════ */}
      <section id="about" className="py-20 sm:py-28 lg:py-36 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
          <span className="lp-animate text-xs font-bold uppercase tracking-[0.2em] mb-4 block" style={{ color: pc }}>
            Quem Somos
          </span>
          <h2 className="lp-animate text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Liderança em Cidades Inteligentes
          </h2>
          <p className="lp-animate text-white/40 leading-relaxed text-sm sm:text-base max-w-3xl mx-auto mb-14">
            Nascemos com a missão de transformar a realidade das cidades brasileiras através da tecnologia e da eficiência. Somos especialistas em estruturar projetos complexos que unem o setor público e privado em prol do cidadão.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: '+50', label: 'Cidades Atendidas' },
              { value: '+200k', label: 'Pontos de Luz' },
              { value: '15', label: 'Anos de Experiência' },
              { value: '100%', label: 'Compromisso' },
            ].map((stat, i) => (
              <div key={i} className="lp-animate">
                <h3 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-2 bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${pc}, ${sc})` }}>
                  {stat.value}
                </h3>
                <span className="text-white/35 text-[10px] sm:text-xs uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TICKET / CHAMADO ═══════════════════ */}
      <section id="chamado" className="relative py-20 sm:py-28 lg:py-36">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-14">
            <span className="lp-animate text-xs font-bold uppercase tracking-[0.2em] mb-4 block" style={{ color: pc }}>
              Registrar Ocorrência
            </span>
            <h2 className="lp-animate text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Abra seu{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${pc}, ${sc})` }}>
                Chamado
              </span>
            </h2>
            <p className="lp-animate text-white/40 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Identificou um problema na iluminação pública? Registre sua ocorrência ou ligue para nosso Call Center.
            </p>

            {/* Call Center Banner */}
            <div className="lp-animate inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${pc}18` }}>
                  <Phone className="w-5 h-5" style={{ color: pc }} />
                </div>
                <div className="text-left">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Ligue Grátis</p>
                  <p className="text-lg sm:text-xl font-bold" style={{ color: pc }}>0800-006-1737</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-white/[0.08]" />
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: sc }} />
                  <span className="text-white/40">Seg-Sex: <span className="text-white/70">7:30-23:00</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: sc }} />
                  <span className="text-white/40">Sáb: <span className="text-white/70">8:00-20:00</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
            {[
              { icon: MapPin, label: 'Localize no Mapa', color: pc },
              { icon: AlertCircle, label: 'Informe a Plaqueta', color: sc },
              { icon: Zap, label: 'Atendimento Rápido', color: pc },
            ].map((item, i) => (
              <div key={i} className="lp-animate p-3 sm:p-5 rounded-xl sm:rounded-2xl text-center border border-white/[0.06] bg-white/[0.02]">
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2" style={{ color: item.color }} />
                <h4 className="text-white/80 font-medium text-[11px] sm:text-sm">{item.label}</h4>
              </div>
            ))}
          </div>

          {/* Ticket Form */}
          <div id="ticket-form" className="relative p-5 sm:p-8 lg:p-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            <TicketForm accentColor={pc} tenantId={tenantId || undefined} branchId={branchId || undefined} />
          </div>
        </div>
      </section>

      {/* ═══════════════════ CONTACT ═══════════════════ */}
      <section id="contact" className="relative py-20 sm:py-28 lg:py-36 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-14 sm:mb-20">
            <span className="lp-animate text-xs font-bold uppercase tracking-[0.2em] mb-4 block" style={{ color: pc }}>
              Fale Conosco
            </span>
            <h2 className="lp-animate text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Inicie a Conversa
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Call Center Info */}
            <div className="lp-animate p-6 sm:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${pc}15`, border: `1px solid ${pc}20` }}>
                  <Phone className="w-6 h-6" style={{ color: pc }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Call Center</h3>
                  <p className="text-white/40 text-sm">Central de Atendimento</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-xl mb-6" style={{ background: `${pc}0a`, border: `1px solid ${pc}18` }}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1 font-medium">Ligue Grátis</p>
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: pc }}>0800-006-1737</p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { label: 'Segunda à Sexta', time: '7:30 às 23:00' },
                  { label: 'Sábados', time: '8:00 às 20:00' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: sc }} />
                    <div>
                      <p className="text-white/80 font-medium text-sm">{item.label}</p>
                      <p className="text-white/40 text-sm">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl mb-6" style={{ background: `${sc}0a`, border: `1px solid ${sc}18` }}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Globe className="w-4 h-4" style={{ color: sc }} />
                  <p className="text-white/80 font-medium text-sm">Aplicativo Cidade Iluminada</p>
                </div>
                <p className="text-white/40 text-xs leading-relaxed">
                  Registre solicitações também pelo nosso aplicativo disponível para download.
                </p>
              </div>

              <p className="text-white/30 text-xs leading-relaxed mb-4">
                Para registros, solicitações e reparos que envolvam a iluminação pública de Barbacena, os munícipes têm à disposição nosso Call Center. Todos os registros são gerenciados pelo software de gestão fornecido pela CONCIP.
              </p>

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-white/25">
                <strong className="text-white/35">Início das Atividades:</strong> A CONCIP recebeu formalmente a OS no dia 09/03/2022 para início das atividades no dia 20/03/2023.
              </div>
            </div>

            {/* Contact Form */}
            <div className="lp-animate p-6 sm:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${sc}15`, border: `1px solid ${sc}20` }}>
                  <Mail className="w-6 h-6" style={{ color: sc }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Envie uma Mensagem</h3>
                  <p className="text-white/40 text-sm">Responderemos em breve</p>
                </div>
              </div>

              <form className="space-y-5">
                {[
                  { label: 'Nome Completo', type: 'text' },
                  { label: 'E-mail', type: 'email' },
                  { label: 'Assunto', type: 'text' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5 block">{field.label}</label>
                    <input
                      type={field.type}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all"
                      placeholder={field.label}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5 block">Mensagem</label>
                  <textarea
                    rows={3}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all resize-none"
                    placeholder="Sua mensagem"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ background: `linear-gradient(135deg, ${pc}, ${sc})`, boxShadow: `0 4px 20px ${pc}25` }}
                >
                  Enviar Mensagem
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="py-10 sm:py-14 border-t border-white/[0.04] bg-[#030710]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row justify-between gap-10 mb-10">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                {content.logoUrl ? (
                  <img src={content.logoUrl} alt={content.companyName} className="h-6 sm:h-8 object-contain" />
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${pc}, ${sc})` }}>
                      <Lightbulb className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-base text-white">{content.companyName}</span>
                  </>
                )}
              </div>
              <p className="text-white/25 text-xs leading-relaxed">
                Inovando espaços urbanos através da luz, tecnologia e parcerias sustentáveis.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-14">
              {[
                { title: 'Soluções', links: ['Iluminação Pública', 'Smart City IoT', 'Usinas de Energia', 'Sistemas de Segurança'] },
                { title: 'Empresa', links: ['Sobre Nós', 'Projetos', 'Notícias', 'Contato'] },
                { title: 'Conecte-se', links: ['LinkedIn', 'Instagram', 'Twitter'] },
              ].map((group) => (
                <div key={group.title}>
                  <h4 className="font-semibold text-white/60 mb-4 text-xs uppercase tracking-wider">{group.title}</h4>
                  <ul className="space-y-2.5">
                    {group.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-white/30 hover:text-white/60 transition-colors text-xs sm:text-sm">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-8 border-t border-white/[0.04] text-white/20 text-[10px] sm:text-xs">
            &copy; {new Date().getFullYear()} {content.companyName}. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
