-- Enum para tipo de pagamento do prestador
CREATE TYPE public.payment_type AS ENUM ('diaria', 'hora', 'por_os', 'mensal');

-- Tabela de prestadores de serviço
CREATE TABLE public.service_providers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    
    -- Dados pessoais
    name TEXT NOT NULL,
    document_type TEXT DEFAULT 'cpf', -- cpf ou cnpj
    document TEXT,
    rg TEXT,
    phone TEXT,
    phone2 TEXT,
    email TEXT,
    
    -- Endereço
    address TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    
    -- Dados profissionais
    specialty TEXT, -- ex: pedreiro, servente, fibra, elétrica
    skills TEXT[], -- habilidades adicionais
    notes TEXT,
    
    -- Dados bancários
    bank_name TEXT,
    bank_agency TEXT,
    bank_account TEXT,
    bank_account_type TEXT,
    pix_key TEXT,
    
    -- Configuração de pagamento
    payment_type public.payment_type NOT NULL DEFAULT 'diaria',
    daily_rate DECIMAL(10,2), -- valor da diária
    hourly_rate DECIMAL(10,2), -- valor hora
    rate_per_os DECIMAL(10,2), -- valor por OS
    monthly_rate DECIMAL(10,2), -- valor mensal
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de atribuição de OS a prestadores
CREATE TABLE public.service_provider_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
    
    -- Dados do trabalho
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    hours_worked DECIMAL(5,2),
    days_worked INTEGER DEFAULT 1,
    
    -- Pagamento
    payment_type public.payment_type NOT NULL,
    rate_applied DECIMAL(10,2) NOT NULL, -- valor usado no cálculo
    total_amount DECIMAL(10,2), -- valor total calculado
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(service_provider_id, service_order_id)
);

-- Tabela de pagamentos mensais (resumo)
CREATE TABLE public.service_provider_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    service_provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    
    reference_month INTEGER NOT NULL,
    reference_year INTEGER NOT NULL,
    
    total_os_count INTEGER DEFAULT 0,
    total_days_worked INTEGER DEFAULT 0,
    total_hours_worked DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    
    status TEXT DEFAULT 'pendente', -- pendente, pago
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_by UUID,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(service_provider_id, reference_month, reference_year)
);

-- Índices
CREATE INDEX idx_service_providers_tenant ON public.service_providers(tenant_id);
CREATE INDEX idx_service_providers_branch ON public.service_providers(branch_id);
CREATE INDEX idx_service_providers_specialty ON public.service_providers(specialty);
CREATE INDEX idx_service_provider_assignments_provider ON public.service_provider_assignments(service_provider_id);
CREATE INDEX idx_service_provider_assignments_order ON public.service_provider_assignments(service_order_id);
CREATE INDEX idx_service_provider_payments_provider ON public.service_provider_payments(service_provider_id);
CREATE INDEX idx_service_provider_payments_period ON public.service_provider_payments(reference_year, reference_month);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_provider_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_provider_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para service_providers
CREATE POLICY "service_providers_select" ON public.service_providers
    FOR SELECT TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND public.can_access_branch(auth.uid(), branch_id)
        )
    );

CREATE POLICY "service_providers_insert" ON public.service_providers
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_superadmin(auth.uid())
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND public.has_role(auth.uid(), 'admin'::public.app_role)
        )
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND public.has_role(auth.uid(), 'manager'::public.app_role)
            AND public.can_access_branch(auth.uid(), branch_id)
        )
    );

CREATE POLICY "service_providers_update" ON public.service_providers
    FOR UPDATE TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND public.has_role(auth.uid(), 'admin'::public.app_role)
        )
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND public.has_role(auth.uid(), 'manager'::public.app_role)
            AND public.can_access_branch(auth.uid(), branch_id)
        )
    );

CREATE POLICY "service_providers_delete" ON public.service_providers
    FOR DELETE TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND public.has_role(auth.uid(), 'admin'::public.app_role)
        )
    );

-- RLS Policies para service_provider_assignments
CREATE POLICY "sp_assignments_select" ON public.service_provider_assignments
    FOR SELECT TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR tenant_id = public.get_user_tenant_id(auth.uid())
    );

CREATE POLICY "sp_assignments_insert" ON public.service_provider_assignments
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_superadmin(auth.uid())
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND (
                public.has_role(auth.uid(), 'admin'::public.app_role)
                OR public.has_role(auth.uid(), 'manager'::public.app_role)
            )
        )
    );

CREATE POLICY "sp_assignments_update" ON public.service_provider_assignments
    FOR UPDATE TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND (
                public.has_role(auth.uid(), 'admin'::public.app_role)
                OR public.has_role(auth.uid(), 'manager'::public.app_role)
            )
        )
    );

CREATE POLICY "sp_assignments_delete" ON public.service_provider_assignments
    FOR DELETE TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND public.has_role(auth.uid(), 'admin'::public.app_role)
        )
    );

-- RLS Policies para service_provider_payments
CREATE POLICY "sp_payments_select" ON public.service_provider_payments
    FOR SELECT TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR tenant_id = public.get_user_tenant_id(auth.uid())
    );

CREATE POLICY "sp_payments_insert" ON public.service_provider_payments
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_superadmin(auth.uid())
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND (
                public.has_role(auth.uid(), 'admin'::public.app_role)
                OR public.has_role(auth.uid(), 'manager'::public.app_role)
            )
        )
    );

CREATE POLICY "sp_payments_update" ON public.service_provider_payments
    FOR UPDATE TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND (
                public.has_role(auth.uid(), 'admin'::public.app_role)
                OR public.has_role(auth.uid(), 'manager'::public.app_role)
            )
        )
    );

CREATE POLICY "sp_payments_delete" ON public.service_provider_payments
    FOR DELETE TO authenticated
    USING (
        public.is_superadmin(auth.uid())
        OR (
            tenant_id = public.get_user_tenant_id(auth.uid())
            AND public.has_role(auth.uid(), 'admin'::public.app_role)
        )
    );

-- Triggers para updated_at
CREATE TRIGGER update_service_providers_updated_at
    BEFORE UPDATE ON public.service_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sp_assignments_updated_at
    BEFORE UPDATE ON public.service_provider_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sp_payments_updated_at
    BEFORE UPDATE ON public.service_provider_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();