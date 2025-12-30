import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Send, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TicketFormProps {
  accentColor?: string;
}

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

function LocationMarker({ position, setPosition }: { 
  position: LocationData | null; 
  setPosition: (pos: LocationData) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      
      // Reverse geocoding using Nominatim (free)
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data.address) {
            const addr = data.address;
            const street = addr.road || addr.street || '';
            const number = addr.house_number || '';
            const neighborhood = addr.suburb || addr.neighbourhood || '';
            const city = addr.city || addr.town || addr.village || '';
            
            setPosition({
              lat,
              lng,
              address: `${street}${number ? ', ' + number : ''} - ${neighborhood}, ${city}`
            });
          }
        })
        .catch(() => {
          // Keep position without address if geocoding fails
        });
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
}

const TicketForm: React.FC<TicketFormProps> = ({ accentColor = '#F97316' }) => {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    rua: '',
    numero: '',
    bairro: '',
    referencia: '',
    placaPoste: '',
    tipoProblema: '',
    descricao: '',
  });
  
  const [position, setPosition] = useState<LocationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Barbacena center coordinates
  const barbacenaCenter: [number, number] = [-21.2256, -43.7711];

  useEffect(() => {
    if (position?.address) {
      // Parse address to fill form fields
      const parts = position.address.split(' - ');
      if (parts.length >= 1) {
        const streetParts = parts[0].split(', ');
        setFormData(prev => ({
          ...prev,
          rua: streetParts[0] || '',
          numero: streetParts[1] || '',
          bairro: parts[1]?.split(',')[0] || '',
        }));
      }
    }
  }, [position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.placaPoste) {
      toast.error('Por favor, informe o número da plaqueta do poste');
      return;
    }
    
    if (!formData.tipoProblema) {
      toast.error('Por favor, selecione o tipo de problema');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success('Chamado registrado com sucesso!');
    
    // Reset after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        rua: '',
        numero: '',
        bairro: '',
        referencia: '',
        placaPoste: '',
        tipoProblema: '',
        descricao: '',
      });
      setPosition(null);
    }, 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Chamado Registrado!</h3>
        <p className="text-white/70">
          Sua solicitação foi enviada com sucesso. Em breve nossa equipe irá verificar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Map Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5" style={{ color: accentColor }} />
          <h3 className="text-lg font-semibold text-white">Localização do Problema</h3>
        </div>
        <p className="text-white/70 text-sm mb-4">
          Clique no mapa para marcar a localização exata do poste com problema
        </p>
        
        <div className="rounded-xl overflow-hidden border border-white/10 h-[400px]">
          <MapContainer
            center={barbacenaCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>

        {position && (
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-white/70">
              <strong className="text-white">Localização selecionada:</strong><br />
              {position.address || `Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}`}
            </p>
          </div>
        )}
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5" style={{ color: accentColor }} />
          <h3 className="text-lg font-semibold text-white">Dados do Chamado</h3>
        </div>

        {/* Personal Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-white/80">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Seu nome"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-white/80">Telefone *</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              placeholder="(32) 99999-9999"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/80">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="seu@email.com"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>

        {/* Address Info */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="rua" className="text-white/80">Rua *</Label>
            <Input
              id="rua"
              value={formData.rua}
              onChange={(e) => handleInputChange('rua', e.target.value)}
              placeholder="Nome da rua"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero" className="text-white/80">Número</Label>
            <Input
              id="numero"
              value={formData.numero}
              onChange={(e) => handleInputChange('numero', e.target.value)}
              placeholder="Nº"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bairro" className="text-white/80">Bairro *</Label>
            <Input
              id="bairro"
              value={formData.bairro}
              onChange={(e) => handleInputChange('bairro', e.target.value)}
              placeholder="Bairro"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referencia" className="text-white/80">Ponto de Referência</Label>
            <Input
              id="referencia"
              value={formData.referencia}
              onChange={(e) => handleInputChange('referencia', e.target.value)}
              placeholder="Próximo a..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Pole Identification */}
        <div className="p-4 rounded-lg border-2 border-dashed" style={{ borderColor: accentColor + '40', backgroundColor: accentColor + '10' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
            <div className="flex-1">
              <Label htmlFor="placaPoste" className="text-white font-semibold">
                Número da Plaqueta do Poste *
              </Label>
              <p className="text-white/60 text-sm mt-1 mb-3">
                Cada poste possui uma plaqueta de identificação. Informe o número para agilizar o atendimento.
              </p>
              <Input
                id="placaPoste"
                value={formData.placaPoste}
                onChange={(e) => handleInputChange('placaPoste', e.target.value)}
                placeholder="Ex: BBN-001234"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 font-mono text-lg"
              />
            </div>
          </div>
        </div>

        {/* Problem Type */}
        <div className="space-y-2">
          <Label htmlFor="tipoProblema" className="text-white/80">Tipo de Problema *</Label>
          <Select value={formData.tipoProblema} onValueChange={(value) => handleInputChange('tipoProblema', value)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione o tipo de problema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lampada_apagada">Lâmpada Apagada</SelectItem>
              <SelectItem value="lampada_piscando">Lâmpada Piscando</SelectItem>
              <SelectItem value="lampada_acesa_dia">Lâmpada Acesa Durante o Dia</SelectItem>
              <SelectItem value="poste_danificado">Poste Danificado</SelectItem>
              <SelectItem value="fiacao_exposta">Fiação Exposta</SelectItem>
              <SelectItem value="luminaria_quebrada">Luminária Quebrada</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="descricao" className="text-white/80">Descrição Adicional</Label>
          <Textarea
            id="descricao"
            value={formData.descricao}
            onChange={(e) => handleInputChange('descricao', e.target.value)}
            placeholder="Descreva detalhes adicionais sobre o problema..."
            rows={4}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-lg font-semibold transition-all duration-300"
          style={{ 
            backgroundColor: accentColor,
            color: 'white',
          }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Abrir Chamado
            </span>
          )}
        </Button>

        <p className="text-white/50 text-xs text-center">
          * Campos obrigatórios. Seus dados serão utilizados apenas para contato sobre esta solicitação.
        </p>
      </form>
    </div>
  );
};

export default TicketForm;
