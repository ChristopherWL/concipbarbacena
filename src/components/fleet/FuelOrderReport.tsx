import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Vehicle } from '@/types/fleet';
import { useAuth } from '@/hooks/useAuth';

interface FuelOrderReportProps {
  vehicle: Vehicle;
  driverName: string;
  description: string;
  authorizedBy: string;
  orderNumber: number;
}

export function FuelOrderReport({ vehicle, driverName, description, authorizedBy, orderNumber }: FuelOrderReportProps) {
  const { tenant } = useAuth();
  const year = new Date().getFullYear();
  const formattedOrderNumber = String(orderNumber).padStart(5, '0');

  return (
    <div className="report-container bg-white text-black p-4 sm:p-6 md:p-8 w-full max-w-[210mm] mx-auto print:w-[210mm] print:min-h-[297mm] print:p-8">
      {/* Header */}
      <div className="header flex flex-col sm:flex-row items-center sm:items-start justify-between border-b-2 border-black pb-4 mb-4 gap-4">
        <div className="logo-container w-16 sm:w-20 md:w-24 flex-shrink-0">
          {tenant?.logo_dark_url || tenant?.logo_url ? (
            <img src={tenant?.logo_dark_url || tenant?.logo_url} alt="Logo" className="w-full h-auto" />
          ) : (
            <div className="logo-placeholder w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              Logo
            </div>
          )}
        </div>
        <div className="company-info text-center sm:text-right">
          <h1 className="company-name text-base sm:text-lg md:text-xl font-bold uppercase break-words">{tenant?.name || 'EMPRESA'}</h1>
          <p className="company-cnpj text-xs sm:text-sm">CNPJ: {tenant?.cnpj || '00.000.000/0001-00'}</p>
        </div>
      </div>

      {/* Title */}
      <div className="title-box bg-blue-100 text-center py-2 mb-6 border border-black">
        <h2 className="text-sm sm:text-base md:text-lg font-bold px-2">ORDEM DE ABASTECIMENTO Nº {formattedOrderNumber}/{year}</h2>
      </div>

      {/* Date */}
      <div className="field-row flex gap-2 mb-4">
        <span className="field-label font-semibold text-sm whitespace-nowrap">Data:</span>
        <span className="field-value border-b border-black flex-1 text-sm pl-1">
          {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
        </span>
      </div>

      {/* Vehicle Info */}
      <div className="mb-6 border border-black p-4">
        <h3 className="font-bold text-sm mb-3 bg-blue-50 -mx-4 -mt-4 px-4 py-2 border-b border-black">DADOS DO VEÍCULO</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="field-row flex gap-2">
            <span className="field-label font-semibold text-sm whitespace-nowrap">Veículo:</span>
            <span className="field-value border-b border-black flex-1 text-sm pl-1">{vehicle.brand} {vehicle.model}</span>
          </div>
          <div className="field-row flex gap-2">
            <span className="field-label font-semibold text-sm whitespace-nowrap">Placa:</span>
            <span className="field-value border-b border-black flex-1 text-sm pl-1">{vehicle.plate}</span>
          </div>
          <div className="field-row flex gap-2">
            <span className="field-label font-semibold text-sm whitespace-nowrap">Frota Nº:</span>
            <span className="field-value border-b border-black flex-1 text-sm pl-1">{vehicle.fleet_number || '___'}</span>
          </div>
          <div className="field-row flex gap-2">
            <span className="field-label font-semibold text-sm whitespace-nowrap">KM Atual:</span>
            <span className="field-value border-b border-black flex-1 text-sm pl-1">{vehicle.current_km.toLocaleString('pt-BR')}</span>
          </div>
          <div className="field-row flex gap-2 col-span-2">
            <span className="field-label font-semibold text-sm whitespace-nowrap">Combustível:</span>
            <span className="field-value border-b border-black flex-1 text-sm pl-1">{vehicle.fuel_type}</span>
          </div>
        </div>
      </div>

      {/* Driver Info */}
      <div className="mb-6 border border-black p-4">
        <h3 className="font-bold text-sm mb-3 bg-blue-50 -mx-4 -mt-4 px-4 py-2 border-b border-black">MOTORISTA</h3>
        <div className="field-row flex gap-2">
          <span className="field-label font-semibold text-sm whitespace-nowrap">Nome:</span>
          <span className="field-value border-b border-black flex-1 text-sm pl-1">{driverName}</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6 border border-black p-4">
        <h3 className="font-bold text-sm mb-3 bg-blue-50 -mx-4 -mt-4 px-4 py-2 border-b border-black">DESCRIÇÃO</h3>
        <p className="text-sm min-h-[40px]">{description || '—'}</p>
      </div>

      {/* Fields to fill at gas station */}
      <div className="mb-6 border border-black p-4">
        <h3 className="font-bold text-sm mb-3 bg-yellow-50 -mx-4 -mt-4 px-4 py-2 border-b border-black">PREENCHIMENTO NO POSTO</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="field-row flex gap-2">
            <span className="field-label font-semibold text-sm whitespace-nowrap">KM Abastecimento:</span>
            <span className="field-value border-b border-black flex-1 text-sm pl-1"></span>
          </div>
          <div className="field-row flex gap-2">
            <span className="field-label font-semibold text-sm whitespace-nowrap">Litros:</span>
            <span className="field-value border-b border-black flex-1 text-sm pl-1"></span>
          </div>
          <div className="field-row flex gap-2">
            <span className="field-label font-semibold text-sm whitespace-nowrap">Preço/Litro:</span>
            <span className="field-value border-b border-black flex-1 text-sm pl-1"></span>
          </div>
          <div className="field-row flex gap-2">
            <span className="field-label font-semibold text-sm whitespace-nowrap">Valor Total:</span>
            <span className="field-value border-b border-black flex-1 text-sm pl-1"></span>
          </div>
          <div className="field-row flex gap-2 col-span-2">
            <span className="field-label font-semibold text-sm whitespace-nowrap">Fornecedor/Posto:</span>
            <span className="field-value border-b border-black flex-1 text-sm pl-1"></span>
          </div>
        </div>
      </div>

      {/* Authorization */}
      <div className="signature-section mt-8 space-y-10">
        <div className="field-row flex gap-2">
          <span className="field-label font-semibold text-sm whitespace-nowrap">Autorizado por:</span>
          <span className="field-value border-b border-black flex-1 text-sm pl-1">{authorizedBy}</span>
        </div>

        <div className="grid grid-cols-2 gap-16 mt-12">
          <div>
            <div className="signature-line border-b border-black w-full h-12"></div>
            <p className="text-xs text-center mt-1">Assinatura do Coordenador</p>
          </div>
          <div>
            <div className="signature-line border-b border-black w-full h-12"></div>
            <p className="text-xs text-center mt-1">Assinatura do Motorista</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer mt-12 text-center text-xs text-gray-500">
        <p>Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>
    </div>
  );
}
