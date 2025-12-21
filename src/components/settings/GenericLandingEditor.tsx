import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Save, Loader2, Eye, Plus, Trash2, ChevronDown,
  Building2, Play, Shield, Zap, Clock, Package, Truck, Users, 
  ClipboardList, BarChart3, FileText, Sparkles, Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageUpload } from './ImageUpload';
interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Stat {
  id: string;
  value: string;
  label: string;
}

interface GenericLandingContent {
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
  modules: Module[];
  features: Feature[];
  stats: Stat[];
  showModules: boolean;
  showFeatures: boolean;
  showStats: boolean;
  ctaTitle: string;
  ctaDescription: string;
  // Color customization
  primaryButtonColor: string;
  secondaryButtonColor: string;
  highlightColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  accentColor: string;
  lightEffectColor: string;
}

import { 
  Wrench, Settings, Calculator, Wallet, CreditCard, Receipt, 
  MapPin, Navigation, Calendar, Bell, Mail, Phone, Globe, 
  Database, Server, Cloud, Lock, Key, EyeIcon, Search, Filter,
  Download, Upload, Printer, Camera, Image, Video, Mic,
  Headphones, Monitor, Smartphone, Tablet, Laptop, Cpu,
  HardDrive, Wifi, Bluetooth, Battery, Power, Plug,
  Home, Building, Factory, Store, Warehouse, Construction,
  Hammer, Scissors, Paintbrush, Pencil, Ruler, Compass,
  Target, Flag, Award, Trophy, Medal, Crown, Heart, ThumbsUp,
  MessageSquare, MessageCircle, Send, Share, Link, Bookmark,
  Folder, FolderOpen, Archive, Box, Boxes, Container,
  ShoppingCart, ShoppingBag, Gift, Tag, Percent, DollarSign,
  TrendingUp, TrendingDown, Activity, PieChart, LineChart,
  CheckCircle, XCircle, AlertCircle, Info, HelpCircle,
  User, UserPlus, UserMinus, UserCheck, Users2, Contact,
  Car, Bike, Train, Plane, Ship, Rocket,
  Sun, Moon, CloudRain, Thermometer, Wind, Droplet,
  Leaf, Trees, Flower2, Apple, Coffee, Pizza,
  Briefcase, GraduationCap, Book, BookOpen, Library, Newspaper
} from 'lucide-react';

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
  'wrench': Wrench,
  'settings': Settings,
  'calculator': Calculator,
  'wallet': Wallet,
  'credit-card': CreditCard,
  'receipt': Receipt,
  'map-pin': MapPin,
  'navigation': Navigation,
  'calendar': Calendar,
  'bell': Bell,
  'mail': Mail,
  'phone': Phone,
  'globe': Globe,
  'database': Database,
  'server': Server,
  'cloud': Cloud,
  'lock': Lock,
  'key': Key,
  'eye': EyeIcon,
  'search': Search,
  'filter': Filter,
  'download': Download,
  'upload': Upload,
  'printer': Printer,
  'camera': Camera,
  'image': Image,
  'video': Video,
  'mic': Mic,
  'headphones': Headphones,
  'monitor': Monitor,
  'smartphone': Smartphone,
  'tablet': Tablet,
  'laptop': Laptop,
  'cpu': Cpu,
  'hard-drive': HardDrive,
  'wifi': Wifi,
  'bluetooth': Bluetooth,
  'battery': Battery,
  'power': Power,
  'plug': Plug,
  'home': Home,
  'building': Building,
  'factory': Factory,
  'store': Store,
  'warehouse': Warehouse,
  'construction': Construction,
  'hammer': Hammer,
  'scissors': Scissors,
  'paintbrush': Paintbrush,
  'pencil': Pencil,
  'ruler': Ruler,
  'compass': Compass,
  'target': Target,
  'flag': Flag,
  'award': Award,
  'trophy': Trophy,
  'medal': Medal,
  'crown': Crown,
  'heart': Heart,
  'thumbs-up': ThumbsUp,
  'message-square': MessageSquare,
  'message-circle': MessageCircle,
  'send': Send,
  'share': Share,
  'link': Link,
  'bookmark': Bookmark,
  'folder': Folder,
  'folder-open': FolderOpen,
  'archive': Archive,
  'box': Box,
  'boxes': Boxes,
  'container': Container,
  'shopping-cart': ShoppingCart,
  'shopping-bag': ShoppingBag,
  'gift': Gift,
  'tag': Tag,
  'percent': Percent,
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'activity': Activity,
  'pie-chart': PieChart,
  'line-chart': LineChart,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-circle': AlertCircle,
  'info': Info,
  'help-circle': HelpCircle,
  'user': User,
  'user-plus': UserPlus,
  'user-minus': UserMinus,
  'user-check': UserCheck,
  'users-2': Users2,
  'contact': Contact,
  'car': Car,
  'bike': Bike,
  'train': Train,
  'plane': Plane,
  'ship': Ship,
  'rocket': Rocket,
  'sun': Sun,
  'moon': Moon,
  'cloud-rain': CloudRain,
  'thermometer': Thermometer,
  'wind': Wind,
  'droplet': Droplet,
  'leaf': Leaf,
  'tree': Trees,
  'flower': Flower2,
  'apple': Apple,
  'coffee': Coffee,
  'pizza': Pizza,
  'briefcase': Briefcase,
  'graduation-cap': GraduationCap,
  'book': Book,
  'book-open': BookOpen,
  'library': Library,
  'newspaper': Newspaper,
};

const iconOptions = [
  { value: 'package', label: 'Pacote' },
  { value: 'truck', label: 'Caminhão' },
  { value: 'users', label: 'Usuários' },
  { value: 'clipboard-list', label: 'Clipboard' },
  { value: 'bar-chart', label: 'Gráfico Barras' },
  { value: 'file-text', label: 'Documento' },
  { value: 'shield', label: 'Segurança' },
  { value: 'zap', label: 'Raio' },
  { value: 'clock', label: 'Relógio' },
  { value: 'wrench', label: 'Chave Inglesa' },
  { value: 'settings', label: 'Configurações' },
  { value: 'calculator', label: 'Calculadora' },
  { value: 'wallet', label: 'Carteira' },
  { value: 'credit-card', label: 'Cartão' },
  { value: 'receipt', label: 'Recibo' },
  { value: 'map-pin', label: 'Localização' },
  { value: 'navigation', label: 'Navegação' },
  { value: 'calendar', label: 'Calendário' },
  { value: 'bell', label: 'Notificação' },
  { value: 'mail', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'globe', label: 'Globo' },
  { value: 'database', label: 'Banco de Dados' },
  { value: 'server', label: 'Servidor' },
  { value: 'cloud', label: 'Nuvem' },
  { value: 'lock', label: 'Cadeado' },
  { value: 'key', label: 'Chave' },
  { value: 'eye', label: 'Olho' },
  { value: 'search', label: 'Busca' },
  { value: 'filter', label: 'Filtro' },
  { value: 'download', label: 'Download' },
  { value: 'upload', label: 'Upload' },
  { value: 'printer', label: 'Impressora' },
  { value: 'camera', label: 'Câmera' },
  { value: 'image', label: 'Imagem' },
  { value: 'video', label: 'Vídeo' },
  { value: 'mic', label: 'Microfone' },
  { value: 'headphones', label: 'Fones' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'smartphone', label: 'Celular' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'laptop', label: 'Notebook' },
  { value: 'cpu', label: 'Processador' },
  { value: 'hard-drive', label: 'HD' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'bluetooth', label: 'Bluetooth' },
  { value: 'battery', label: 'Bateria' },
  { value: 'power', label: 'Energia' },
  { value: 'plug', label: 'Tomada' },
  { value: 'home', label: 'Casa' },
  { value: 'building', label: 'Prédio' },
  { value: 'factory', label: 'Fábrica' },
  { value: 'store', label: 'Loja' },
  { value: 'warehouse', label: 'Armazém' },
  { value: 'construction', label: 'Construção' },
  { value: 'hammer', label: 'Martelo' },
  { value: 'scissors', label: 'Tesoura' },
  { value: 'paintbrush', label: 'Pincel' },
  { value: 'pencil', label: 'Lápis' },
  { value: 'ruler', label: 'Régua' },
  { value: 'compass', label: 'Compasso' },
  { value: 'target', label: 'Alvo' },
  { value: 'flag', label: 'Bandeira' },
  { value: 'award', label: 'Prêmio' },
  { value: 'trophy', label: 'Troféu' },
  { value: 'medal', label: 'Medalha' },
  { value: 'crown', label: 'Coroa' },
  { value: 'heart', label: 'Coração' },
  { value: 'thumbs-up', label: 'Curtir' },
  { value: 'message-square', label: 'Mensagem' },
  { value: 'message-circle', label: 'Chat' },
  { value: 'send', label: 'Enviar' },
  { value: 'share', label: 'Compartilhar' },
  { value: 'link', label: 'Link' },
  { value: 'bookmark', label: 'Favorito' },
  { value: 'folder', label: 'Pasta' },
  { value: 'folder-open', label: 'Pasta Aberta' },
  { value: 'archive', label: 'Arquivo' },
  { value: 'box', label: 'Caixa' },
  { value: 'boxes', label: 'Caixas' },
  { value: 'container', label: 'Container' },
  { value: 'shopping-cart', label: 'Carrinho' },
  { value: 'shopping-bag', label: 'Sacola' },
  { value: 'gift', label: 'Presente' },
  { value: 'tag', label: 'Etiqueta' },
  { value: 'percent', label: 'Porcentagem' },
  { value: 'dollar-sign', label: 'Dinheiro' },
  { value: 'trending-up', label: 'Tendência Alta' },
  { value: 'trending-down', label: 'Tendência Baixa' },
  { value: 'activity', label: 'Atividade' },
  { value: 'pie-chart', label: 'Gráfico Pizza' },
  { value: 'line-chart', label: 'Gráfico Linha' },
  { value: 'check-circle', label: 'Confirmado' },
  { value: 'x-circle', label: 'Cancelado' },
  { value: 'alert-circle', label: 'Alerta' },
  { value: 'info', label: 'Informação' },
  { value: 'help-circle', label: 'Ajuda' },
  { value: 'user', label: 'Usuário' },
  { value: 'user-plus', label: 'Adicionar Usuário' },
  { value: 'user-minus', label: 'Remover Usuário' },
  { value: 'user-check', label: 'Usuário Verificado' },
  { value: 'users-2', label: 'Grupo' },
  { value: 'contact', label: 'Contato' },
  { value: 'car', label: 'Carro' },
  { value: 'bike', label: 'Bicicleta' },
  { value: 'train', label: 'Trem' },
  { value: 'plane', label: 'Avião' },
  { value: 'ship', label: 'Navio' },
  { value: 'rocket', label: 'Foguete' },
  { value: 'sun', label: 'Sol' },
  { value: 'moon', label: 'Lua' },
  { value: 'cloud-rain', label: 'Chuva' },
  { value: 'thermometer', label: 'Termômetro' },
  { value: 'wind', label: 'Vento' },
  { value: 'droplet', label: 'Gota' },
  { value: 'leaf', label: 'Folha' },
  { value: 'tree', label: 'Árvore' },
  { value: 'flower', label: 'Flor' },
  { value: 'apple', label: 'Maçã' },
  { value: 'coffee', label: 'Café' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'briefcase', label: 'Maleta' },
  { value: 'graduation-cap', label: 'Formatura' },
  { value: 'book', label: 'Livro' },
  { value: 'book-open', label: 'Livro Aberto' },
  { value: 'library', label: 'Biblioteca' },
  { value: 'newspaper', label: 'Jornal' },
];

const defaultContent: GenericLandingContent = {
  companyName: 'Sistema ERP',
  companySubtitle: 'Gestão Empresarial',
  logoUrl: '',
  logoDarkUrl: '',
  badge: 'Plataforma completa de gestão empresarial',
  heroTitle: 'Transforme sua',
  heroTitleHighlight: 'Gestão Empresarial',
  heroDescription: 'Estoque, ordens de serviço, frota, equipes, notas fiscais e relatórios. Tudo integrado em uma única plataforma inteligente.',
  ctaPrimary: 'Acessar Sistema',
  ctaSecondary: 'Conhecer Módulos',
  modules: [
    { id: '1', title: 'Estoque', description: 'Controle completo de materiais, EPIs e equipamentos', icon: 'package' },
    { id: '2', title: 'Ordens de Serviço', description: 'Gerencie OS com rastreamento de custos', icon: 'clipboard-list' },
    { id: '3', title: 'Frota', description: 'Veículos, manutenções e abastecimentos', icon: 'truck' },
    { id: '4', title: 'Equipes', description: 'Técnicos, cautelas e atribuições', icon: 'users' },
    { id: '5', title: 'Notas Fiscais', description: 'Importação XML e controle de entradas', icon: 'file-text' },
    { id: '6', title: 'Relatórios', description: 'Dashboards e indicadores em tempo real', icon: 'bar-chart' },
  ],
  features: [
    { id: '1', title: 'Seguro', description: 'Criptografia de ponta e controle de acesso por níveis', icon: 'shield' },
    { id: '2', title: 'Rápido', description: 'Interface otimizada para máxima performance', icon: 'zap' },
    { id: '3', title: '24/7', description: 'Disponível a qualquer hora, em qualquer lugar', icon: 'clock' },
  ],
  stats: [
    { id: '1', value: '100%', label: 'Integrado' },
    { id: '2', value: '24/7', label: 'Disponível' },
    { id: '3', value: '+10', label: 'Módulos' },
    { id: '4', value: '∞', label: 'Possibilidades' },
  ],
  showModules: true,
  showFeatures: true,
  showStats: true,
  ctaTitle: 'Pronto para transformar sua gestão?',
  ctaDescription: 'Comece agora mesmo e descubra como podemos ajudar seu negócio a crescer.',
  // Default colors
  primaryButtonColor: '#3b82f6',
  secondaryButtonColor: '#1e40af',
  highlightColor: '#60a5fa',
  backgroundGradientFrom: '#020617',
  backgroundGradientTo: '#0f172a',
  accentColor: '#3b82f6',
  lightEffectColor: '#8b5cf6',
};

interface GenericLandingEditorProps {
  tenantId: string;
  initialContent: any;
  onSave: () => void;
}

export function GenericLandingEditor({ tenantId, initialContent, onSave }: GenericLandingEditorProps) {
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<GenericLandingContent>(defaultContent);

  useEffect(() => {
    if (initialContent?.generic) {
      setContent({ ...defaultContent, ...initialContent.generic });
    }
  }, [initialContent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedContent = {
        ...(initialContent || {}),
        generic: content
      };
      
      const { error } = await supabase
        .from('tenants')
        .update({ landing_page_content: updatedContent })
        .eq('id', tenantId);

      if (error) throw error;
      toast.success('Landing page salva com sucesso!');
      onSave();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addModule = () => {
    setContent(prev => ({
      ...prev,
      modules: [...prev.modules, { id: Date.now().toString(), title: '', description: '', icon: 'package' }]
    }));
  };

  const updateModule = (id: string, field: keyof Module, value: string) => {
    setContent(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  const removeModule = (id: string) => {
    setContent(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== id)
    }));
  };

  const addFeature = () => {
    setContent(prev => ({
      ...prev,
      features: [...prev.features, { id: Date.now().toString(), title: '', description: '', icon: 'shield' }]
    }));
  };

  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    setContent(prev => ({
      ...prev,
      features: prev.features.map(f => f.id === id ? { ...f, [field]: value } : f)
    }));
  };

  const removeFeature = (id: string) => {
    setContent(prev => ({
      ...prev,
      features: prev.features.filter(f => f.id !== id)
    }));
  };

  const updateStat = (id: string, field: keyof Stat, value: string) => {
    setContent(prev => ({
      ...prev,
      stats: prev.stats.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const addStat = () => {
    if (content.stats.length >= 4) {
      toast.error('Máximo de 4 estatísticas');
      return;
    }
    setContent(prev => ({
      ...prev,
      stats: [...prev.stats, { id: Date.now().toString(), value: '', label: '' }]
    }));
  };

  const removeStat = (id: string) => {
    setContent(prev => ({
      ...prev,
      stats: prev.stats.filter(s => s.id !== id)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <Card className="overflow-hidden">
        <CardHeader className="text-white p-0">
          <div 
            className="relative h-64 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${content.backgroundGradientFrom || '#020617'} 0%, ${content.backgroundGradientTo || '#0f172a'} 100%)`
            }}
          >
            {/* Animated Light Focus Effects - Matching real page */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <style>{`
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
              `}</style>
              
              {/* Light 1 - Top Left */}
              <div 
                className="absolute top-[10%] left-[5%] w-32 h-32 rounded-full blur-[40px]"
                style={{
                  backgroundColor: content.lightEffectColor || '#8b5cf6',
                  opacity: 0.25,
                  animation: 'lightMove1 5s linear infinite'
                }}
              />
              
              {/* Light 2 - Top Right */}
              <div 
                className="absolute top-[5%] right-[8%] w-28 h-28 rounded-full blur-[40px]"
                style={{
                  backgroundColor: content.lightEffectColor || '#8b5cf6',
                  opacity: 0.2,
                  animation: 'lightMove3 4s linear infinite'
                }}
              />
              
              {/* Light 3 - Bottom Right */}
              <div 
                className="absolute bottom-[10%] right-[5%] w-36 h-36 rounded-full blur-[40px]"
                style={{
                  backgroundColor: content.lightEffectColor || '#8b5cf6',
                  opacity: 0.25,
                  animation: 'lightMove2 6s linear infinite'
                }}
              />
              
              {/* Light 4 - Center */}
              <div 
                className="absolute top-1/2 left-[40%] w-40 h-40 rounded-full blur-[50px]"
                style={{
                  backgroundColor: content.lightEffectColor || '#8b5cf6',
                  opacity: 0.15,
                  animation: 'lightMove3 4s linear infinite'
                }}
              />
              
              {/* Light 5 - Top Center Right */}
              <div 
                className="absolute top-[30%] right-[20%] w-24 h-24 rounded-full blur-[35px]"
                style={{
                  backgroundColor: content.lightEffectColor || '#8b5cf6',
                  opacity: 0.2,
                  animation: 'lightMove4 5.5s linear infinite'
                }}
              />
            </div>
            
            {/* Mini Header */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {content.logoUrl ? (
                  <img 
                    src={content.logoUrl} 
                    alt="Logo" 
                    className="h-8 max-w-[120px] object-contain"
                  />
                ) : (
                  <>
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: content.primaryButtonColor || '#3b82f6' }}
                    >
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{content.companyName}</p>
                      <p className="text-[8px] text-slate-400">{content.companySubtitle}</p>
                    </div>
                  </>
                )}
              </div>
              <Button 
                size="sm" 
                className="h-6 text-xs text-white border-0"
                style={{ backgroundColor: `${content.primaryButtonColor || '#3b82f6'}cc` }}
              >
                <Play className="w-3 h-3 mr-1" />
                Entrar
              </Button>
            </div>
            
            {/* Mini Hero */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-8">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[8px] mb-3">
                <div 
                  className="w-1.5 h-1.5 rounded-full animate-pulse" 
                  style={{ backgroundColor: content.accentColor || '#22c55e' }}
                />
                {content.badge}
              </div>
              <h3 className="text-lg font-bold leading-tight">
                {content.heroTitle}
                <span 
                  className="block"
                  style={{ color: content.highlightColor || '#60a5fa' }}
                >
                  {content.heroTitleHighlight}
                </span>
              </h3>
              <p className="text-[9px] text-slate-400 mt-2 max-w-xs line-clamp-2">{content.heroDescription}</p>
              <div className="flex gap-2 mt-4">
                <Button 
                  size="sm" 
                  className="h-6 text-[10px] text-white border-0"
                  style={{ background: `linear-gradient(135deg, ${content.primaryButtonColor || '#3b82f6'}, ${content.highlightColor || '#60a5fa'})` }}
                >
                  <Play className="w-3 h-3 mr-1" />
                  {content.ctaPrimary}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 text-[10px] text-white"
                  style={{ 
                    backgroundColor: `${content.secondaryButtonColor || '#1e40af'}20`,
                    borderColor: `${content.secondaryButtonColor || '#1e40af'}40`,
                    borderWidth: '1px'
                  }}
                >
                  {content.ctaSecondary}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
            
            {/* Floating Sparkles */}
            <Sparkles 
              className="absolute top-16 right-8 w-4 h-4" 
              style={{ color: `${content.accentColor || '#3b82f6'}60` }}
            />
            <Star 
              className="absolute bottom-20 left-12 w-3 h-3" 
              style={{ color: `${content.highlightColor || '#eab308'}50` }}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Prévia da landing page</p>
            <Button variant="outline" size="sm" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Header Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cabeçalho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nome da Empresa</Label>
              <Input 
                value={content.companyName}
                onChange={e => setContent({ ...content, companyName: e.target.value })}
                placeholder="Sistema ERP"
              />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Input 
                value={content.companySubtitle}
                onChange={e => setContent({ ...content, companySubtitle: e.target.value })}
                placeholder="Gestão Empresarial"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seção Hero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Badge (texto pequeno)</Label>
            <Input 
              value={content.badge}
              onChange={e => setContent({ ...content, badge: e.target.value })}
              placeholder="Plataforma completa de gestão empresarial"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Título</Label>
              <Input 
                value={content.heroTitle}
                onChange={e => setContent({ ...content, heroTitle: e.target.value })}
                placeholder="Transforme sua"
              />
            </div>
            <div>
              <Label>Título Destacado</Label>
              <Input 
                value={content.heroTitleHighlight}
                onChange={e => setContent({ ...content, heroTitleHighlight: e.target.value })}
                placeholder="Gestão Empresarial"
              />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea 
              value={content.heroDescription}
              onChange={e => setContent({ ...content, heroDescription: e.target.value })}
              placeholder="Descrição do sistema..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Botão Principal</Label>
              <Input 
                value={content.ctaPrimary}
                onChange={e => setContent({ ...content, ctaPrimary: e.target.value })}
                placeholder="Acessar Sistema"
              />
            </div>
            <div>
              <Label>Botão Secundário</Label>
              <Input 
                value={content.ctaSecondary}
                onChange={e => setContent({ ...content, ctaSecondary: e.target.value })}
                placeholder="Conhecer Módulos"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cores e Aparência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">Cores dos Botões</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Botão Principal</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={content.primaryButtonColor || '#3b82f6'}
                    onChange={e => setContent({ ...content, primaryButtonColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <Input 
                    value={content.primaryButtonColor || '#3b82f6'}
                    onChange={e => setContent({ ...content, primaryButtonColor: e.target.value })}
                    className="flex-1"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Botão Secundário</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={content.secondaryButtonColor || '#1e40af'}
                    onChange={e => setContent({ ...content, secondaryButtonColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <Input 
                    value={content.secondaryButtonColor || '#1e40af'}
                    onChange={e => setContent({ ...content, secondaryButtonColor: e.target.value })}
                    className="flex-1"
                    placeholder="#1e40af"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-sm font-medium mb-3 block">Cores de Destaque</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Texto Destacado</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={content.highlightColor || '#60a5fa'}
                    onChange={e => setContent({ ...content, highlightColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <Input 
                    value={content.highlightColor || '#60a5fa'}
                    onChange={e => setContent({ ...content, highlightColor: e.target.value })}
                    className="flex-1"
                    placeholder="#60a5fa"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Cor de Acento</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={content.accentColor || '#3b82f6'}
                    onChange={e => setContent({ ...content, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <Input 
                    value={content.accentColor || '#3b82f6'}
                    onChange={e => setContent({ ...content, accentColor: e.target.value })}
                    className="flex-1"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-sm font-medium mb-3 block">Efeitos de Luz</Label>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Cor dos Efeitos de Fundo</Label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={content.lightEffectColor || '#8b5cf6'}
                  onChange={e => setContent({ ...content, lightEffectColor: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0"
                />
                <Input 
                  value={content.lightEffectColor || '#8b5cf6'}
                  onChange={e => setContent({ ...content, lightEffectColor: e.target.value })}
                  className="flex-1"
                  placeholder="#8b5cf6"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Controla os efeitos de luz animados no fundo da página
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-sm font-medium mb-3 block">Fundo da Página</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Gradiente - De</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={content.backgroundGradientFrom || '#020617'}
                    onChange={e => setContent({ ...content, backgroundGradientFrom: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <Input 
                    value={content.backgroundGradientFrom || '#020617'}
                    onChange={e => setContent({ ...content, backgroundGradientFrom: e.target.value })}
                    className="flex-1"
                    placeholder="#020617"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Gradiente - Para</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={content.backgroundGradientTo || '#0f172a'}
                    onChange={e => setContent({ ...content, backgroundGradientTo: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <Input 
                    value={content.backgroundGradientTo || '#0f172a'}
                    onChange={e => setContent({ ...content, backgroundGradientTo: e.target.value })}
                    className="flex-1"
                    placeholder="#0f172a"
                  />
                </div>
              </div>
            </div>
            {/* Preview do gradiente */}
            <div 
              className="mt-3 h-12 rounded-lg border"
              style={{
                background: `linear-gradient(to right, ${content.backgroundGradientFrom || '#020617'}, ${content.backgroundGradientTo || '#0f172a'})`
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Estatísticas</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-normal">Mostrar</Label>
            <Switch 
              checked={content.showStats}
              onCheckedChange={v => setContent({ ...content, showStats: v })}
            />
          </div>
        </CardHeader>
        {content.showStats && (
          <CardContent className="space-y-4">
            {content.stats.map((stat) => (
              <div key={stat.id} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="100%"
                    value={stat.value}
                    onChange={e => updateStat(stat.id, 'value', e.target.value)}
                  />
                  <Input 
                    placeholder="Integrado"
                    value={stat.label}
                    onChange={e => updateStat(stat.id, 'label', e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeStat(stat.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {content.stats.length < 4 && (
              <Button variant="outline" size="sm" onClick={addStat}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Estatística
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modules Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Módulos</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-normal">Mostrar</Label>
            <Switch 
              checked={content.showModules}
              onCheckedChange={v => setContent({ ...content, showModules: v })}
            />
          </div>
        </CardHeader>
        {content.showModules && (
          <CardContent className="space-y-4">
            {content.modules.map((mod) => (
              <div key={mod.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex gap-2 items-center">
                  <select 
                    className="h-9 w-24 rounded-md border bg-background px-2 text-sm"
                    value={mod.icon}
                    onChange={e => updateModule(mod.id, 'icon', e.target.value)}
                  >
                    {iconOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <Input 
                    placeholder="Título"
                    value={mod.title}
                    onChange={e => updateModule(mod.id, 'title', e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeModule(mod.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Input 
                  placeholder="Descrição do módulo"
                  value={mod.description}
                  onChange={e => updateModule(mod.id, 'description', e.target.value)}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addModule}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Módulo
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Features Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recursos / Diferenciais</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-sm font-normal">Mostrar</Label>
            <Switch 
              checked={content.showFeatures}
              onCheckedChange={v => setContent({ ...content, showFeatures: v })}
            />
          </div>
        </CardHeader>
        {content.showFeatures && (
          <CardContent className="space-y-4">
            {content.features.map((feat) => (
              <div key={feat.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex gap-2 items-center">
                  <select 
                    className="h-9 w-24 rounded-md border bg-background px-2 text-sm"
                    value={feat.icon}
                    onChange={e => updateFeature(feat.id, 'icon', e.target.value)}
                  >
                    {iconOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <Input 
                    placeholder="Título"
                    value={feat.title}
                    onChange={e => updateFeature(feat.id, 'title', e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeFeature(feat.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Input 
                  placeholder="Descrição"
                  value={feat.description}
                  onChange={e => updateFeature(feat.id, 'description', e.target.value)}
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFeature}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Recurso
            </Button>
          </CardContent>
        )}
      </Card>

      {/* CTA Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chamada Final (CTA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input 
              value={content.ctaTitle}
              onChange={e => setContent({ ...content, ctaTitle: e.target.value })}
              placeholder="Pronto para transformar sua gestão?"
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input 
              value={content.ctaDescription}
              onChange={e => setContent({ ...content, ctaDescription: e.target.value })}
              placeholder="Comece agora mesmo..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Alterações
      </Button>
    </div>
  );
}
