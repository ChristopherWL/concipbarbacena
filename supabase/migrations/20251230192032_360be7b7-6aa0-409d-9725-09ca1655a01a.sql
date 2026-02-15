-- Add chamado fields to service_orders table
ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS origem VARCHAR(50) DEFAULT 'interno',
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS placa_poste VARCHAR(50),
ADD COLUMN IF NOT EXISTS tipo_problema VARCHAR(100),
ADD COLUMN IF NOT EXISTS solicitante_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS solicitante_telefone VARCHAR(50),
ADD COLUMN IF NOT EXISTS solicitante_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS bairro VARCHAR(255),
ADD COLUMN IF NOT EXISTS numero VARCHAR(50),
ADD COLUMN IF NOT EXISTS referencia TEXT,
ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;

-- Add index for faster queries on chamados
CREATE INDEX IF NOT EXISTS idx_service_orders_origem ON public.service_orders(origem);
CREATE INDEX IF NOT EXISTS idx_service_orders_placa_poste ON public.service_orders(placa_poste);

-- Comment on columns
COMMENT ON COLUMN public.service_orders.origem IS 'Origem da OS: interno, chamado_publico';
COMMENT ON COLUMN public.service_orders.latitude IS 'Latitude da localização do problema';
COMMENT ON COLUMN public.service_orders.longitude IS 'Longitude da localização do problema';
COMMENT ON COLUMN public.service_orders.placa_poste IS 'Número da plaqueta de identificação do poste';
COMMENT ON COLUMN public.service_orders.tipo_problema IS 'Tipo do problema reportado';
COMMENT ON COLUMN public.service_orders.solicitante_nome IS 'Nome do solicitante (chamados públicos)';
COMMENT ON COLUMN public.service_orders.solicitante_telefone IS 'Telefone do solicitante';
COMMENT ON COLUMN public.service_orders.solicitante_email IS 'Email do solicitante';
COMMENT ON COLUMN public.service_orders.aprovado_por IS 'Admin que aprovou o chamado';
COMMENT ON COLUMN public.service_orders.aprovado_em IS 'Data/hora da aprovação';