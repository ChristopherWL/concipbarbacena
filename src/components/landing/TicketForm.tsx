import React, { useState, useEffect, useRef } from 'react';
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
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingFromMap = useRef(false);

  // Barbacena center coordinates
  const barbacenaCenter: [number, number] = [-21.2256, -43.7711];

  // Update marker on map
  const updateMapMarker = (lat: number, lng: number, flyTo: boolean = true) => {
    if (!mapRef.current) return;
    
    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker
    markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    
    // Fly to location
    if (flyTo) {
      mapRef.current.flyTo([lat, lng], 17, { duration: 1 });
    }
  };

  // Geocode address to coordinates (address -> map)
  const geocodeAddress = async (rua: string, numero: string, bairro: string) => {
    if (!rua || rua.length < 3) return;
    
    setIsSearchingAddress(true);
    
    try {
      // Build search query
      const query = `${rua}${numero ? ' ' + numero : ''}${bairro ? ', ' + bairro : ''}, Barbacena, MG, Brasil`;
      const encodedQuery = encodeURIComponent(query);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        // Update map marker
        updateMapMarker(lat, lng, true);
        
        // Update position state without triggering reverse geocoding
        setPosition({ lat, lng, address: query });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Initialize Leaflet map directly (without react-leaflet)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      center: barbacenaCenter,
      zoom: 14,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Handle click events
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Add new marker
      markerRef.current = L.marker([lat, lng]).addTo(map);
      
      // Update position state
      setPosition({ lat, lng });
      
      // Flag that we're updating from map click
      isUpdatingFromMap.current = true;
      
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
            
            // Update form fields directly
            setFormData(prev => ({
              ...prev,
              rua: street,
              numero: number,
              bairro: neighborhood,
            }));
            
            setPosition({
              lat,
              lng,
              address: `${street}${number ? ', ' + number : ''} - ${neighborhood}, ${city}`
            });
          }
          
          // Reset flag after a delay
          setTimeout(() => {
            isUpdatingFromMap.current = false;
          }, 500);
        })
        .catch(() => {
          isUpdatingFromMap.current = false;
        });
    });

    mapRef.current = map;

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Debounced geocoding when address fields change
  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Don't trigger geocoding if the change came from map click
    if (isUpdatingFromMap.current) return;
    
    // Clear previous timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    
    // Set new timeout for debounced geocoding
    geocodeTimeoutRef.current = setTimeout(() => {
      const updatedFormData = { ...formData, [field]: value };
      if (updatedFormData.rua && updatedFormData.rua.length >= 3) {
        geocodeAddress(updatedFormData.rua, updatedFormData.numero, updatedFormData.bairro);
      }
    }, 800);
  };

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
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
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
        
        <div 
          ref={mapContainerRef}
          className="rounded-xl overflow-hidden border border-white/10 h-[400px]"
        />

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
            <Label htmlFor="rua" className="text-white/80 flex items-center gap-2">
              Rua *
              {isSearchingAddress && (
                <span className="text-xs text-white/50 flex items-center gap-1">
                  <div className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
                  Buscando...
                </span>
              )}
            </Label>
            <Input
              id="rua"
              value={formData.rua}
              onChange={(e) => handleAddressChange('rua', e.target.value)}
              placeholder="Digite o nome da rua para localizar no mapa"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero" className="text-white/80">Número</Label>
            <Input
              id="numero"
              value={formData.numero}
              onChange={(e) => handleAddressChange('numero', e.target.value)}
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
              onChange={(e) => handleAddressChange('bairro', e.target.value)}
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
