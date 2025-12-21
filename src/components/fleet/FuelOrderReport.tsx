import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FuelLog, Vehicle } from '@/types/fleet';
import { useAuth } from '@/hooks/useAuth';

interface FuelOrderReportProps {
  vehicle: Vehicle;
  fuelLog?: FuelLog;
  orderNumber: number;
}

export function FuelOrderReport({ vehicle, fuelLog, orderNumber }: FuelOrderReportProps) {
  const { tenant } = useAuth();
  const year = fuelLog ? new Date(fuelLog.date).getFullYear() : new Date().getFullYear();
  const formattedOrderNumber = String(orderNumber).padStart(5, '0');

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="report-container bg-white text-black p-8 w-[210mm] min-h-[297mm] mx-auto">
      {/* Header */}
      <div className="header flex items-start justify-between border-b-2 border-black pb-4 mb-4">
        <div className="logo-container w-24">
          {tenant?.logo_dark_url || tenant?.logo_url ? (
            <img src={tenant?.logo_dark_url || tenant?.logo_url} alt="Logo" className="w-full h-auto" />
          ) : (
            <div className="logo-placeholder w-20 h-20 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              Logo
            </div>
          )}
        </div>
        <div className="company-info text-right">
          <h1 className="company-name text-xl font-bold uppercase">{tenant?.name || 'EMPRESA'}</h1>
          <p className="company-cnpj text-sm">CNPJ: {tenant?.cnpj || '00.000.000/0001-00'}</p>
        </div>
      </div>

      {/* Title */}
      <div className="title-box bg-gray-200 text-center py-2 mb-6 border border-black">
        <h2 className="text-lg font-bold">ORDEM DE ABASTECIMENTO Nº {formattedOrderNumber}/{year}</h2>
      </div>

      {/* Driver Info */}
      <div className="mb-4">
        <div className="field-row flex gap-2 mb-2">
          <span className="field-label font-semibold text-sm">Nome do Motorista:</span>
          <span className="field-value border-b border-black flex-1 text-sm">{fuelLog?.notes || ''}</span>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="mb-4">
        <div className="field-row flex gap-2 mb-2">
          <span className="field-label font-semibold text-sm">Veículo:</span>
          <span className="field-value border-b border-black flex-1 text-sm">{vehicle.brand} {vehicle.model}</span>
        </div>
        <div className="vehicle-fields flex gap-8 mt-2">
          <div className="flex gap-2">
            <span className="field-label font-semibold text-sm">Frota:</span>
            <span className="field-value-fixed border-b border-black px-4 text-sm">{vehicle.fleet_number || '___'}</span>
          </div>
          <div className="flex gap-2">
            <span className="field-label font-semibold text-sm">Placa:</span>
            <span className="field-value-fixed border-b border-black px-4 text-sm">{vehicle.plate}</span>
          </div>
          <div className="flex gap-2">
            <span className="field-label font-semibold text-sm">KM:</span>
            <span className="field-value-fixed border-b border-black px-4 text-sm">{fuelLog ? fuelLog.km_at_fill.toLocaleString('pt-BR') : vehicle.current_km.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse border border-black mb-8 mt-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-sm text-left">Fornecedor</th>
            <th className="border border-black p-2 text-sm text-left">Preço Unit. (R$)</th>
            <th className="border border-black p-2 text-sm text-left">Quantid.</th>
            <th className="border border-black p-2 text-sm text-left">Unid.</th>
            <th className="border border-black p-2 text-sm text-left">Descrição</th>
            <th className="border border-black p-2 text-sm text-right">Total (R$)</th>
          </tr>
        </thead>
        <tbody>
          {fuelLog ? (
            <tr>
              <td className="border border-black p-2 text-sm">{fuelLog.supplier?.name || ''}</td>
              <td className="border border-black p-2 text-sm">{formatCurrency(fuelLog.price_per_liter)}</td>
              <td className="border border-black p-2 text-sm">{fuelLog.liters.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td className="border border-black p-2 text-sm">Litros</td>
              <td className="border border-black p-2 text-sm">{fuelLog.fuel_type || 'Combustível'}</td>
              <td className="border border-black p-2 text-sm text-right">{formatCurrency(fuelLog.total_cost)}</td>
            </tr>
          ) : (
            <tr>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
            </tr>
          )}
          {/* Empty rows for additional items */}
          {[...Array(4)].map((_, i) => (
            <tr key={i}>
              <td className="border border-black p-2 h-8"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Authorization Section */}
      <div className="signature-section mt-12 space-y-8">
        <div className="signature-row flex gap-2">
          <span className="signature-label font-semibold text-sm">Autorizado por</span>
          <span className="field-value border-b border-black flex-1 text-sm"></span>
        </div>

        <div className="mt-8">
          <p className="signature-label font-semibold text-sm mb-2">Assinatura Coordenador</p>
          <div className="signature-line border-b border-black w-full h-12"></div>
        </div>

        <div className="signature-row mt-8 flex gap-2">
          <span className="signature-label font-semibold text-sm">Motorista</span>
          <span className="field-value border-b border-black flex-1 text-sm">{fuelLog?.notes || ''}</span>
        </div>

        <div className="mt-8">
          <p className="signature-label font-semibold text-sm mb-2">Assinatura Motorista</p>
          <div className="signature-line border-b border-black w-full h-12"></div>
        </div>
      </div>

      {/* Footer with date */}
      <div className="footer mt-12 text-center text-sm text-gray-600">
        <p>Data: {fuelLog ? format(new Date(fuelLog.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>
    </div>
  );
}