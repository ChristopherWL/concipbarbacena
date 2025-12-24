import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ObraCardProgress } from "./ObraCardProgress";
import { 
  Building2, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Settings, 
  Edit, 
  Trash2,
  HardHat
} from "lucide-react";
import type { Obra } from "@/hooks/useObras";

interface ObraCardProps {
  obra: Obra;
  tenantId: string | null;
  isReadOnly: boolean;
  onCardClick: (obra: Obra) => void;
  onEdit: (obra: Obra, e: React.MouseEvent) => void;
  onUpdate: (obra: Obra, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

export const ObraCard = ({
  obra,
  tenantId,
  isReadOnly,
  onCardClick,
  onEdit,
  onUpdate,
  onDelete,
  getStatusBadge,
}: ObraCardProps) => {
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'concluida':
        return {
          iconBg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-600',
          borderColor: 'hover:border-emerald-500/50',
          gradientFrom: 'from-emerald-500/5',
        };
      case 'em_andamento':
        return {
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-600',
          borderColor: 'hover:border-blue-500/50',
          gradientFrom: 'from-blue-500/5',
        };
      case 'pausada':
        return {
          iconBg: 'bg-amber-500/10',
          iconColor: 'text-amber-600',
          borderColor: 'hover:border-amber-500/50',
          gradientFrom: 'from-amber-500/5',
        };
      case 'cancelada':
        return {
          iconBg: 'bg-destructive/10',
          iconColor: 'text-destructive',
          borderColor: 'hover:border-destructive/50',
          gradientFrom: 'from-destructive/5',
        };
      default:
        return {
          iconBg: 'bg-muted',
          iconColor: 'text-muted-foreground',
          borderColor: 'hover:border-primary/50',
          gradientFrom: 'from-primary/5',
        };
    }
  };

  const colors = getStatusColors(obra.status);

  return (
    <Card 
      className={`cursor-pointer group hover:shadow-xl transition-all duration-300 border-2 ${colors.borderColor} relative overflow-hidden`}
      onClick={() => onCardClick(obra)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradientFrom} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      
      <CardContent className="p-4 sm:p-5 relative">
        <div className="flex gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${colors.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
            <HardHat className={`h-6 w-6 sm:h-8 sm:w-8 ${colors.iconColor}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header with name and status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-start sm:items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base sm:text-lg truncate">{obra.nome}</h3>
                {getStatusBadge(obra.status)}
              </div>
              
              {/* Desktop actions - hidden for read-only */}
              {!isReadOnly && (
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  {obra.notas && (
                    <div className="flex items-center gap-1 text-muted-foreground" title={obra.notas}>
                      <FileText className="h-4 w-4" />
                    </div>
                  )}
                  <Button variant="outline" size="icon" onClick={(e) => onEdit(obra, e)} title="Editar Obra">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button className="px-4 sm:px-6" onClick={(e) => onUpdate(obra, e)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => onDelete(obra.id, e)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
            
            {/* Info grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-sm text-muted-foreground">
              {obra.customer?.name && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className={`h-3.5 w-3.5 flex-shrink-0 ${colors.iconColor}`} />
                  <span className="truncate">{obra.customer.name}</span>
                </div>
              )}
              {obra.endereco && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className={`h-3.5 w-3.5 flex-shrink-0 ${colors.iconColor}`} />
                  <span className="truncate">{obra.endereco}</span>
                </div>
              )}
              {obra.data_inicio && (
                <div className="flex items-center gap-1.5">
                  <Calendar className={`h-3.5 w-3.5 flex-shrink-0 ${colors.iconColor}`} />
                  <span>{new Date(obra.data_inicio).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              {obra.previsao_termino && (
                <div className="flex items-center gap-1.5">
                  <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${colors.iconColor}`} />
                  <span>Prev: {new Date(obra.previsao_termino).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>

            {/* Progress and Current Stage */}
            {tenantId && <ObraCardProgress obraId={obra.id} tenantId={tenantId} />}
          </div>
        </div>
        
        {/* Mobile actions - hidden for read-only */}
        {!isReadOnly && (
          <div className="flex sm:hidden items-center gap-2 pt-3 mt-3 border-t border-border/20">
            {obra.notas && (
              <div className="flex items-center gap-1 text-muted-foreground" title={obra.notas}>
                <FileText className="h-4 w-4" />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={(e) => onEdit(obra, e)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button className="flex-1" size="sm" onClick={(e) => onUpdate(obra, e)}>
              <Edit className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => onDelete(obra.id, e)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
