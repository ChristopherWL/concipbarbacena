import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useRef, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import GenericLandingPage from './GenericLandingPage';
import { 
  Building2, ArrowRight, Phone, Mail, MapPin, Star, Users, Settings, Shield, 
  Zap, Heart, Check, Clock, Truck, Wrench, Quote, MessageCircle, Headphones, Video,
  Briefcase, Building, TrendingUp, BarChart, PieChart, DollarSign, CreditCard,
  Cpu, Wifi, Monitor, Smartphone, Database, Cloud, Code, Globe,
  Lock, Key, Eye, Hammer, Package, Activity, Thermometer, Calendar, Timer,
  User, UserCheck, CheckCircle, Award, Target, Flag, Bookmark, Lightbulb,
  Compass, Home, Layers, Grid, Box, FileText, Folder, Image, Camera, Music, Smile, ThumbsUp,
  ChevronDown, Play, Sparkles, MousePointerClick, Menu, X, ArrowUpRight, ChevronRight,
  type LucideIcon
} from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';

const iconMap: Record<string, LucideIcon> = {
  'phone': Phone, 'mail': Mail, 'message-circle': MessageCircle, 'headphones': Headphones, 'video': Video,
  'briefcase': Briefcase, 'building': Building, 'trending-up': TrendingUp, 'bar-chart': BarChart, 
  'pie-chart': PieChart, 'dollar-sign': DollarSign, 'credit-card': CreditCard,
  'cpu': Cpu, 'wifi': Wifi, 'monitor': Monitor, 'smartphone': Smartphone, 
  'database': Database, 'cloud': Cloud, 'code': Code, 'globe': Globe,
  'shield': Shield, 'lock': Lock, 'key': Key, 'eye': Eye,
  'wrench': Wrench, 'settings': Settings, 'tool': Wrench, 'hammer': Hammer, 'truck': Truck, 'package': Package,
  'heart': Heart, 'activity': Activity, 'thermometer': Thermometer,
  'clock': Clock, 'calendar': Calendar, 'timer': Timer,
  'users': Users, 'user': User, 'user-check': UserCheck,
  'star': Star, 'zap': Zap, 'check': Check, 'check-circle': CheckCircle, 'award': Award, 
  'target': Target, 'flag': Flag, 'bookmark': Bookmark, 'lightbulb': Lightbulb,
  'compass': Compass, 'map-pin': MapPin, 'home': Home, 'layers': Layers, 'grid': Grid,
  'box': Box, 'file-text': FileText, 'folder': Folder, 'image': Image, 'camera': Camera, 
  'music': Music, 'smile': Smile, 'thumbs-up': ThumbsUp,
};

export default function LandingPage() {
  const { slug: urlSlug } = useParams();
  const navigate = useNavigate();
  const { user, tenant: authTenant, isLoading: authLoading } = useAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ONLY use URL slug - never auto-use auth tenant slug
  // This ensures GenericLandingPage is always shown at "/" regardless of auth state
  const effectiveSlug = urlSlug;

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant-landing', effectiveSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_landing_pages')
        .select('*')
        .eq('slug', effectiveSlug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveSlug,
  });

  const isLoading = tenantLoading && !!effectiveSlug;

  // Scroll handler for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [tenant]);

  // If no URL slug provided, always show generic landing page
  if (!effectiveSlug) {
    return <GenericLandingPage />;
  }

  if (isLoading) {
    return <PageLoading text="Carregando" />;
  }

  // If accessing via URL slug and tenant not found, show error
  if (!tenant && urlSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center animate-fade-in-up">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Building2 className="h-12 w-12 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Empresa não encontrada</h1>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">O link que você acessou não existe ou foi removido.</p>
          <Button onClick={() => navigate('/auth')} size="lg" className="bg-blue-600 hover:bg-blue-700">
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  // Still loading tenant data
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <p className="text-blue-200 animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  const lp = tenant.landing_page_content as any || {};
  const services = lp.services || [];
  const features = lp.features || [];
  const testimonials = lp.testimonials || [];
  const stats = lp.stats || [
    { value: '+500', label: 'Clientes Atendidos' },
    { value: '24/7', label: 'Suporte' },
    { value: '99%', label: 'Satisfação' },
    { value: '+10', label: 'Anos de Experiência' }
  ];
  const showServices = lp.showServices !== false;
  const showFeatures = lp.showFeatures !== false && features.length > 0;
  const showTestimonials = lp.showTestimonials !== false && testimonials.length > 0;
  const showAbout = lp.showAbout !== false && lp.aboutContent;
  const showContact = lp.showContact !== false;
  const showStats = lp.showStats !== false;

  const primaryColor = tenant.primary_color || '#3b82f6';
  const secondaryColor = tenant.secondary_color || '#1e40af';

  // Function to lighten color for better contrast on dark backgrounds
  const getLighterColor = (hex: string) => {
    // Convert hex to RGB, lighten, and return
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Mix with white for lighter version
    const lighten = (c: number) => Math.min(255, Math.floor(c + (255 - c) * 0.5));
    return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
  };

  const lightPrimaryColor = getLighterColor(primaryColor);

  const getIcon = (iconName: string): LucideIcon => iconMap[iconName] || Star;

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { id: 'services', label: 'Serviços', show: showServices && services.length > 0 },
    { id: 'about', label: 'Sobre', show: showAbout },
    { id: 'features', label: 'Diferenciais', show: showFeatures },
    { id: 'testimonials', label: 'Depoimentos', show: showTestimonials },
    { id: 'contact', label: 'Contato', show: showContact },
  ].filter(item => item.show);

  return (
    <div 
      className="min-h-screen overflow-x-hidden bg-slate-950"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="h-12 w-auto" />
              ) : (
                <>
                  <div 
                    className="flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-lg shadow-blue-500/25"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-bold text-white hidden sm:block">{tenant.name}</span>
                </>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => scrollToSection(item.id)} 
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-300"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate(effectiveSlug ? `/auth?tenant=${effectiveSlug}` : '/auth')} 
                className="hidden sm:flex shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <span>{lp.ctaText || 'Acessar Sistema'}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900/98 backdrop-blur-xl border-b border-white/10 animate-slide-down">
            <div className="container mx-auto px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => scrollToSection(item.id)} 
                  className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <Button 
                onClick={() => navigate(effectiveSlug ? `/auth?tenant=${effectiveSlug}` : '/auth')} 
                className="w-full mt-4"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                {lp.ctaText || 'Acessar Sistema'}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 lg:pt-36 overflow-hidden">
        {/* Background - Image or Animated Gradient */}
        <div className="absolute inset-0">
          {lp.heroBackgroundUrl ? (
            <>
              <img 
                src={lp.heroBackgroundUrl} 
                alt="Background" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90" />
            </>
          ) : (
            <>
              {/* Main gradient */}
              <div 
                className="absolute inset-0 animate-gradient-shift"
                style={{ 
                  background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 25%, ${secondaryColor} 50%, #0f172a 75%, ${secondaryColor} 100%)`,
                  backgroundSize: '400% 400%',
                }}
              />
              
              {/* Mesh gradient overlay */}
              <div className="absolute inset-0 opacity-60" style={{
                background: `radial-gradient(ellipse at 20% 20%, ${primaryColor}40 0%, transparent 50%),
                             radial-gradient(ellipse at 80% 80%, ${secondaryColor}30 0%, transparent 50%),
                             radial-gradient(ellipse at 50% 50%, ${primaryColor}20 0%, transparent 70%)`
              }} />

              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                 linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
              }} />
            </>
          )}
        </div>

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-[10%] w-72 h-72 rounded-full opacity-20 animate-float-slow"
               style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
          <div className="absolute bottom-1/4 right-[10%] w-96 h-96 rounded-full opacity-15 animate-float-slower"
               style={{ background: `radial-gradient(circle, ${secondaryColor}, transparent)` }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10"
               style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
          
          {/* Decorative shapes */}
          <div className="absolute top-20 right-[20%] w-4 h-4 rounded-full bg-blue-400/40 animate-pulse-slow" />
          <div className="absolute top-40 left-[15%] w-3 h-3 rounded-full bg-cyan-400/40 animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 right-[30%] w-2 h-2 rounded-full bg-white/40 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <div className="max-w-5xl mx-auto pt-8 lg:pt-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-white/80 text-sm mb-8 animate-fade-in-up mt-4">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>{lp.heroSubtitle || 'Excelência em cada detalhe'}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up animation-delay-100">
              {lp.title || `Bem-vindo à ${tenant.name}`}
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
              {lp.description || 'Oferecemos os melhores serviços para você e sua empresa. Soluções completas e personalizadas para atender todas as suas necessidades.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-300">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 shadow-2xl shadow-blue-500/30 hover:scale-105 transition-all duration-300 group"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                onClick={() => navigate(effectiveSlug ? `/auth?tenant=${effectiveSlug}` : '/auth')}
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                {lp.ctaText || 'Acessar Sistema'}
              </Button>
              {lp.ctaSecondaryText && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                  onClick={() => scrollToSection('services')}
                >
                  {lp.ctaSecondaryText}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Stats */}
            {showStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20 animate-fade-in-up animation-delay-400">
                {stats.map((stat: any, index: number) => (
                  <div 
                    key={index}
                    className="relative group"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
                      <div className="text-3xl lg:text-4xl font-bold mb-1" style={{ color: lightPrimaryColor }}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-slate-400">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow">
          <button 
            onClick={() => scrollToSection('services')}
            className="flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          >
            <span className="text-xs uppercase tracking-[0.2em] font-medium">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Services Section */}
      {showServices && services.length > 0 && (
        <section id="services" className="pt-32 lg:pt-40 pb-24 lg:pb-32 bg-slate-900 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20"
                 style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="text-center mb-16 lg:mb-20">
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6 animate-on-scroll border"
                style={{ backgroundColor: `${primaryColor}15`, color: lightPrimaryColor, borderColor: `${primaryColor}40` }}
              >
                {lp.servicesLabel || 'Nossos Serviços'}
              </span>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 animate-on-scroll">
                {lp.servicesTitle || 'O Que Oferecemos'}
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto animate-on-scroll">
                {lp.servicesSubtitle || 'Soluções completas para atender todas as suas necessidades com qualidade e eficiência'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {services.map((service: any, index: number) => {
                const IconComponent = getIcon(service.icon);
                return (
                  <div 
                    key={index} 
                    className="animate-on-scroll group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="relative h-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-500 hover:border-slate-600/50 hover:bg-slate-800/70 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10">
                      {/* Top gradient line */}
                      <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                           style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
                      
                      {service.image_url ? (
                        <div className="aspect-video overflow-hidden relative">
                          <img 
                            src={service.image_url} 
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                        </div>
                      ) : null}
                      
                      <div className="p-6 lg:p-8">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                          style={{ 
                            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                            boxShadow: `0 10px 30px -10px ${primaryColor}50`
                          }}
                        >
                          <IconComponent className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-slate-400 leading-relaxed">{service.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {showAbout && (
        <section id="about" className="py-24 lg:py-32 bg-slate-950 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full opacity-20"
                 style={{ background: `radial-gradient(circle, ${secondaryColor}, transparent)` }} />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="animate-on-scroll">
                <span 
                  className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6 border"
                  style={{ backgroundColor: `${primaryColor}15`, color: lightPrimaryColor, borderColor: `${primaryColor}40` }}
                >
                  {lp.aboutLabel || 'Sobre Nós'}
                </span>
                <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
                  {lp.aboutTitle || 'Quem Somos'}
                </h2>
                <p className="text-lg text-slate-400 whitespace-pre-line leading-relaxed mb-8">
                  {lp.aboutContent}
                </p>
                <Button 
                  size="lg"
                  className="group"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  onClick={() => navigate(effectiveSlug ? `/auth?tenant=${effectiveSlug}` : '/auth')}
                >
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 animate-on-scroll">
                {(lp.aboutValues || [
                  { icon: 'award', title: 'Qualidade', description: 'Excelência em cada projeto' },
                  { icon: 'users', title: 'Equipe', description: 'Profissionais qualificados' },
                  { icon: 'clock', title: 'Pontualidade', description: 'Prazos sempre cumpridos' },
                  { icon: 'shield', title: 'Segurança', description: 'Proteção garantida' }
                ]).map((value: any, index: number) => {
                  const IconComponent = getIcon(value.icon);
                  return (
                    <div 
                      key={index}
                      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 hover:-translate-y-1 transition-all duration-300"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${primaryColor}25` }}
                      >
                        <IconComponent className="h-6 w-6" style={{ color: lightPrimaryColor }} />
                      </div>
                      <h4 className="font-bold text-white mb-1">{value.title}</h4>
                      <p className="text-sm text-slate-400">{value.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {showFeatures && (
        <section id="features" className="py-24 lg:py-32 bg-slate-900 relative overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="text-center mb-16 lg:mb-20">
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6 animate-on-scroll border"
                style={{ backgroundColor: `${primaryColor}15`, color: lightPrimaryColor, borderColor: `${primaryColor}40` }}
              >
                {lp.featuresLabel || 'Diferenciais'}
              </span>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 animate-on-scroll">
                {lp.featuresTitle || 'Por Que Nos Escolher'}
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto animate-on-scroll">
                {lp.featuresSubtitle || 'Conheça os diferenciais que fazem de nós a melhor escolha para você'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature: any, index: number) => {
                const IconComponent = getIcon(feature.icon);
                return (
                  <div 
                    key={index}
                    className="animate-on-scroll group flex gap-4 p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-2xl hover:border-slate-600/50 hover:bg-slate-800/50 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${primaryColor}25` }}
                    >
                      <IconComponent className="h-6 w-6" style={{ color: lightPrimaryColor }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {showTestimonials && (
        <section id="testimonials" className="py-24 lg:py-32 bg-slate-950 relative overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="text-center mb-16 lg:mb-20">
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6 animate-on-scroll border"
                style={{ backgroundColor: `${primaryColor}15`, color: lightPrimaryColor, borderColor: `${primaryColor}40` }}
              >
                {lp.testimonialsLabel || 'Depoimentos'}
              </span>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 animate-on-scroll">
                {lp.testimonialsTitle || 'O Que Nossos Clientes Dizem'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial: any, index: number) => (
                <div 
                  key={index}
                  className="animate-on-scroll bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600/50 transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Quote className="h-10 w-10 mb-6 opacity-40" style={{ color: lightPrimaryColor }} />
                  <p className="text-slate-300 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-4">
                    {testimonial.avatar ? (
                      <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                      >
                        {testimonial.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white">{testimonial.name}</div>
                      <div className="text-sm text-slate-400">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {showContact && (
        <section id="contact" className="py-24 lg:py-32 bg-slate-900 relative overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="text-center mb-16 lg:mb-20">
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6 animate-on-scroll border"
                style={{ backgroundColor: `${primaryColor}15`, color: lightPrimaryColor, borderColor: `${primaryColor}40` }}
              >
                {lp.contactLabel || 'Contato'}
              </span>
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 animate-on-scroll">
                {lp.contactTitle || 'Fale Conosco'}
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto animate-on-scroll">
                {lp.contactSubtitle || 'Entre em contato e descubra como podemos ajudar'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
              {lp.contactPhone && (
                <a 
                  href={`tel:${lp.contactPhone.replace(/\D/g, '')}`}
                  className="animate-on-scroll group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center hover:border-slate-600/50 hover:-translate-y-2 transition-all duration-300 w-full sm:w-72"
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${primaryColor}25` }}
                  >
                    <Phone className="h-7 w-7" style={{ color: lightPrimaryColor }} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Telefone</h3>
                  <p className="text-slate-400">{lp.contactPhone}</p>
                </a>
              )}

              {lp.contactEmail && (
                <a 
                  href={`mailto:${lp.contactEmail}`}
                  className="animate-on-scroll group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center hover:border-slate-600/50 hover:-translate-y-2 transition-all duration-300 w-full sm:w-72"
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${primaryColor}25` }}
                  >
                    <Mail className="h-7 w-7" style={{ color: lightPrimaryColor }} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">E-mail</h3>
                  <p className="text-slate-400">{lp.contactEmail}</p>
                </a>
              )}

              {lp.contactAddress && (
                <div className="animate-on-scroll group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center hover:border-slate-600/50 hover:-translate-y-2 transition-all duration-300 w-full sm:w-72">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${primaryColor}25` }}
                  >
                    <MapPin className="h-7 w-7" style={{ color: lightPrimaryColor }} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Endereço</h3>
                  <p className="text-slate-400">{lp.contactAddress}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`
          }}
        />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 animate-on-scroll">
              {lp.ctaTitle || 'Pronto para começar?'}
            </h2>
            <p className="text-xl text-white/80 mb-10 animate-on-scroll">
              {lp.ctaDescription || 'Entre em contato conosco e descubra como podemos ajudar sua empresa a crescer.'}
            </p>
            <Button 
              size="lg" 
              className="bg-white hover:bg-white/90 shadow-2xl text-lg px-10 py-7 hover:scale-105 transition-all duration-300 animate-on-scroll"
              style={{ color: primaryColor }}
              onClick={() => navigate(effectiveSlug ? `/auth?tenant=${effectiveSlug}` : '/auth')}
            >
              <MousePointerClick className="mr-2 h-5 w-5" />
              {lp.ctaButtonText || 'Acessar Sistema'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-auto" />
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <Building2 className="w-5 h-5" />
                </div>
              )}
              <span className="text-xl font-bold text-white">{tenant.name}</span>
            </div>

            <div className="flex items-center gap-6">
              {lp.contactPhone && (
                <a href={`tel:${lp.contactPhone.replace(/\D/g, '')}`} className="text-slate-400 hover:text-white transition-colors">
                  <Phone className="h-5 w-5" />
                </a>
              )}
              {lp.contactEmail && (
                <a href={`mailto:${lp.contactEmail}`} className="text-slate-400 hover:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              )}
            </div>

            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
