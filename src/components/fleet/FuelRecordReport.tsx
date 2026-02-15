import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FuelLog, Vehicle } from '@/types/fleet';
import { useAuth } from '@/hooks/useAuth';

interface FuelRecordReportProps {
  vehicle: Vehicle;
  fuelLog: FuelLog;
  recordNumber: number;
}

export function FuelRecordReport({ vehicle, fuelLog, recordNumber }: FuelRecordReportProps) {
  const { tenant } = useAuth();
  const year = new Date(fuelLog.date).getFullYear();
  const formattedRecordNumber = String(recordNumber).padStart(5, '0');

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

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
      <div className="title-box bg-green-100 text-center py-2 mb-4 sm:mb-6 border border-black">
        <h2 className="text-sm sm:text-base md:text-lg font-bold px-2">REGISTRO DE ABASTECIMENTO Nº {formattedRecordNumber}/{year}</h2>
      </div>

      {/* Driver Info */}
      <div className="mb-4">
        <div className="field-row flex flex-col sm:flex-row gap-1 sm:gap-2 mb-2">
          <span className="field-label font-semibold text-xs sm:text-sm whitespace-nowrap">Nome do Motorista:</span>
          <span className="field-value border-b border-black flex-1 text-xs sm:text-sm min-w-0">{fuelLog.notes || ''}</span>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="mb-4">
        <div className="field-row flex flex-col sm:flex-row gap-1 sm:gap-2 mb-2">
          <span className="field-label font-semibold text-xs sm:text-sm whitespace-nowrap">Veículo:</span>
          <span className="field-value border-b border-black flex-1 text-xs sm:text-sm min-w-0">{vehicle.brand} {vehicle.model}</span>
        </div>
        <div className="vehicle-fields flex flex-wrap gap-4 sm:gap-6 md:gap-8 mt-2">
          <div className="flex gap-1 sm:gap-2">
            <span className="field-label font-semibold text-xs sm:text-sm">Frota:</span>
            <span className="field-value-fixed border-b border-black px-2 sm:px-4 text-xs sm:text-sm">{vehicle.fleet_number || '___'}</span>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <span className="field-label font-semibold text-xs sm:text-sm">Placa:</span>
            <span className="field-value-fixed border-b border-black px-2 sm:px-4 text-xs sm:text-sm">{vehicle.plate}</span>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <span className="field-label font-semibold text-xs sm:text-sm">KM:</span>
            <span className="field-value-fixed border-b border-black px-2 sm:px-4 text-xs sm:text-sm">{fuelLog.km_at_fill.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Date Info */}
      <div className="mb-4">
        <div className="field-row flex flex-col sm:flex-row gap-1 sm:gap-2 mb-2">
          <span className="field-label font-semibold text-xs sm:text-sm whitespace-nowrap">Data do Abastecimento:</span>
          <span className="field-value border-b border-black flex-1 text-xs sm:text-sm min-w-0">
            {format(new Date(fuelLog.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto mb-8 mt-6">
        <table className="w-full border-collapse border border-black min-w-[600px]">
          <thead>
            <tr className="bg-green-50">
              <th className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm text-left whitespace-nowrap">Fornecedor</th>
              <th className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm text-left whitespace-nowrap">Preço Unit. (R$)</th>
              <th className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm text-left whitespace-nowrap">Quantid.</th>
              <th className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm text-left whitespace-nowrap">Unid.</th>
              <th className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm text-left whitespace-nowrap">Combustível</th>
              <th className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm text-right whitespace-nowrap">Total (R$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm">{fuelLog.supplier?.name || '-'}</td>
              <td className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm whitespace-nowrap">{formatCurrency(fuelLog.price_per_liter)}</td>
              <td className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm whitespace-nowrap">{fuelLog.liters.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm">Litros</td>
              <td className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm">{fuelLog.fuel_type || 'Combustível'}</td>
              <td className="border border-black p-1.5 sm:p-2 text-xs sm:text-sm text-right whitespace-nowrap font-bold">{formatCurrency(fuelLog.total_cost)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-black p-4 mb-8">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Tanque Cheio:</span> {fuelLog.full_tank ? 'Sim' : 'Não'}
          </div>
          <div className="text-right">
            <span className="font-semibold">Valor Total:</span> {formatCurrency(fuelLog.total_cost)}
          </div>
        </div>
      </div>

      {/* Signatures Section */}
      <div className="signature-section mt-12 space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="signature-label font-semibold text-sm mb-2">Conferido por:</p>
            <div className="signature-line border-b border-black w-full h-12"></div>
          </div>
          <div>
            <p className="signature-label font-semibold text-sm mb-2">Motorista:</p>
            <div className="signature-line border-b border-black w-full h-12"></div>
            <p className="text-xs text-gray-600 mt-1">{fuelLog.notes || ''}</p>
          </div>
        </div>
      </div>

      {/* Footer with date */}
      <div className="footer mt-12 text-center text-sm text-gray-600">
        <p>Registro gerado em: {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>
    </div>
  );
}
