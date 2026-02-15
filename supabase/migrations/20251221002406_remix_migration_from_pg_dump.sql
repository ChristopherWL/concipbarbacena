CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'technician',
    'warehouse',
    'superadmin',
    'caixa',
    'diretor'
);


--
-- Name: contract_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.contract_type AS ENUM (
    'clt',
    'pj',
    'estagio',
    'temporario',
    'autonomo'
);


--
-- Name: employee_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.employee_status AS ENUM (
    'ativo',
    'ferias',
    'afastado',
    'desligado'
);


--
-- Name: leave_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.leave_type AS ENUM (
    'atestado_medico',
    'licenca_maternidade',
    'licenca_paternidade',
    'acidente_trabalho',
    'falta_justificada',
    'falta_injustificada',
    'outro'
);


--
-- Name: maintenance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenance_status AS ENUM (
    'agendada',
    'em_andamento',
    'concluida',
    'cancelada'
);


--
-- Name: maintenance_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.maintenance_type AS ENUM (
    'preventiva',
    'corretiva'
);


--
-- Name: movement_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.movement_type AS ENUM (
    'entrada',
    'saida',
    'transferencia',
    'ajuste',
    'devolucao'
);


--
-- Name: priority_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.priority_level AS ENUM (
    'baixa',
    'media',
    'alta',
    'urgente'
);


--
-- Name: serial_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.serial_status AS ENUM (
    'disponivel',
    'em_uso',
    'em_manutencao',
    'descartado'
);


--
-- Name: service_order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_order_status AS ENUM (
    'aberta',
    'em_andamento',
    'aguardando',
    'concluida',
    'cancelada'
);


--
-- Name: stock_audit_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stock_audit_status AS ENUM (
    'aberto',
    'em_analise',
    'resolvido',
    'cancelado',
    'enviado',
    'recebido'
);


--
-- Name: stock_audit_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stock_audit_type AS ENUM (
    'defeito',
    'furto',
    'garantia',
    'inventario'
);


--
-- Name: stock_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stock_category AS ENUM (
    'epi',
    'epc',
    'ferramentas',
    'materiais',
    'equipamentos'
);


--
-- Name: tenant_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tenant_status AS ENUM (
    'active',
    'suspended',
    'trial',
    'cancelled'
);


--
-- Name: vacation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vacation_status AS ENUM (
    'pendente',
    'aprovada',
    'rejeitada',
    'em_gozo',
    'concluida'
);


--
-- Name: can_manage_users_in_tenant(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_manage_users_in_tenant(_user_id uuid, _tenant_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    -- superadmin can do everything
    public.is_superadmin(_user_id)
    OR
    -- tenant admin/manager can manage
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.tenant_id = _tenant_id
        AND ur.role IN ('admin'::public.app_role, 'manager'::public.app_role)
    )
    OR
    -- explicit permission on user_permissions
    EXISTS (
      SELECT 1
      FROM public.user_permissions up
      WHERE up.user_id = _user_id
        AND up.tenant_id = _tenant_id
        AND up.can_manage_users = true
    )
    OR
    -- permission granted by template
    EXISTS (
      SELECT 1
      FROM public.user_permissions up
      JOIN public.permission_templates pt ON pt.id = up.template_id
      WHERE up.user_id = _user_id
        AND up.tenant_id = _tenant_id
        AND pt.can_manage_users = true
        AND COALESCE(pt.is_active, true) = true
    );
$$;


--
-- Name: get_tenant_id_from_storage_path(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_tenant_id_from_storage_path(object_path text) RETURNS uuid
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  tenant_folder TEXT;
BEGIN
  -- Extract first path component (should be tenant_id)
  tenant_folder := split_part(object_path, '/', 1);
  
  -- Validate UUID format
  IF tenant_folder ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN tenant_folder::UUID;
  END IF;
  
  RETURN NULL;
END;
$_$;


--
-- Name: get_user_branch_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_branch_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT selected_branch_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;


--
-- Name: get_user_tenant_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_tenant_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT tenant_id
    FROM public.profiles
    WHERE id = _user_id
    LIMIT 1
$$;


--
-- Name: handle_new_tenant(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_tenant() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Set default theme colors if not provided
    IF NEW.primary_color IS NULL THEN
        NEW.primary_color := '#3b82f6';  -- Blue 500
    END IF;
    
    IF NEW.secondary_color IS NULL THEN
        NEW.secondary_color := '#f1f5f9';  -- Slate 100
    END IF;
    
    IF NEW.menu_color IS NULL THEN
        NEW.menu_color := '#1e3a5f';  -- Deep navy blue
    END IF;
    
    IF NEW.theme IS NULL THEN
        NEW.theme := 'light';
    END IF;

    -- Create default features for new tenant
    INSERT INTO public.tenant_features (tenant_id)
    VALUES (NEW.id)
    ON CONFLICT (tenant_id) DO NOTHING;
    
    -- Create main branch for new tenant
    INSERT INTO public.branches (tenant_id, name, is_main)
    VALUES (NEW.id, 'Matriz', true)
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
        NEW.raw_user_meta_data ->> 'avatar_url'
    );
    RETURN NEW;
END;
$$;


--
-- Name: handle_new_user_permissions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_permissions() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    _tenant_id UUID;
BEGIN
    -- Get tenant_id from profiles
    SELECT tenant_id INTO _tenant_id FROM public.profiles WHERE id = NEW.user_id;
    
    IF _tenant_id IS NOT NULL THEN
        INSERT INTO public.user_permissions (user_id, tenant_id)
        VALUES (NEW.user_id, _tenant_id)
        ON CONFLICT (user_id, tenant_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;


--
-- Name: is_superadmin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_superadmin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = 'superadmin'
    )
$$;


--
-- Name: is_technician_assigned_to_order(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_technician_assigned_to_order(_order_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM service_order_technicians sot
    JOIN technicians t ON t.id = sot.technician_id
    WHERE sot.service_order_id = _order_id
      AND t.user_id = _user_id
  )
$$;


--
-- Name: is_tenant_admin(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_tenant_admin(_user_id uuid, _tenant_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND tenant_id = _tenant_id
          AND role = 'admin'
    )
$$;


--
-- Name: is_user_in_order_team(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_in_order_team(_order_id uuid, _user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  -- Check if user is a technician in the team
  SELECT EXISTS (
    SELECT 1
    FROM service_orders so
    JOIN team_members tm ON tm.team_id = so.team_id
    JOIN technicians t ON t.id = tm.technician_id
    WHERE so.id = _order_id
      AND t.user_id = _user_id
  )
  OR EXISTS (
    -- Check if user is an employee in the team (removed is_technician requirement)
    SELECT 1
    FROM service_orders so
    JOIN team_members tm ON tm.team_id = so.team_id
    JOIN employees e ON e.id = tm.employee_id
    WHERE so.id = _order_id
      AND e.user_id = _user_id
  )
  OR EXISTS (
    -- Check if user is the team leader (technician)
    SELECT 1
    FROM service_orders so
    JOIN teams te ON te.id = so.team_id
    JOIN technicians t ON t.id = te.leader_id
    WHERE so.id = _order_id
      AND t.user_id = _user_id
  )
  OR EXISTS (
    -- Check if user is the team leader (employee) (removed is_technician requirement)
    SELECT 1
    FROM service_orders so
    JOIN teams te ON te.id = so.team_id
    JOIN employees e ON e.id = te.leader_employee_id
    WHERE so.id = _order_id
      AND e.user_id = _user_id
  )
$$;


--
-- Name: user_belongs_to_tenant(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_belongs_to_tenant(_user_id uuid, _tenant_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = _user_id
          AND tenant_id = _tenant_id
    )
$$;


--
-- Name: user_can_see_all_branches(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_can_see_all_branches(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role IN ('admin'::public.app_role, 'manager'::public.app_role)
  )
$$;


SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: asset_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    technician_id uuid NOT NULL,
    asset_type text NOT NULL,
    vehicle_id uuid,
    serial_number_id uuid,
    product_id uuid,
    quantity integer DEFAULT 1,
    assigned_at timestamp with time zone DEFAULT now(),
    returned_at timestamp with time zone,
    expected_return date,
    notes text,
    assigned_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code text,
    cnpj text,
    phone text,
    email text,
    address text,
    city text,
    state text,
    zip_code text,
    is_active boolean DEFAULT true,
    is_main boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    logo_url text,
    logo_dark_url text,
    razao_social text,
    number text,
    complement text,
    neighborhood text,
    inscricao_estadual text,
    inscricao_municipal text
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    type text DEFAULT 'pf'::text,
    name text NOT NULL,
    document text,
    email text,
    phone text,
    phone2 text,
    address text,
    number text,
    complement text,
    neighborhood text,
    city text,
    state text,
    zip_code text,
    contact_name text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    branch_id uuid
);


--
-- Name: diario_obras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diario_obras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    obra_id uuid,
    data date DEFAULT CURRENT_DATE NOT NULL,
    clima text,
    hora_inicio time without time zone,
    hora_fim time without time zone,
    equipe_presente integer DEFAULT 0,
    atividades_realizadas text,
    materiais_utilizados text,
    ocorrencias text,
    fotos jsonb DEFAULT '[]'::jsonb,
    registrado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    equipe_manha text,
    veiculo_manha text,
    placa_manha text,
    motorista_manha text,
    km_ida_manha text,
    km_volta_manha text,
    hora_inicio_manha time without time zone,
    hora_fim_manha time without time zone,
    km_rodado_manha text,
    equipe_tarde text,
    veiculo_tarde text,
    placa_tarde text,
    motorista_tarde text,
    km_ida_tarde text,
    km_volta_tarde text,
    hora_inicio_tarde time without time zone,
    hora_fim_tarde time without time zone,
    km_rodado_tarde text,
    responsavel_entrega_materiais text,
    responsavel_devolucao_materiais text,
    equipe_assinaturas jsonb DEFAULT '[]'::jsonb,
    observacao_fiscalizacao text,
    clima_manha text,
    clima_tarde text,
    clima_noite text,
    branch_id uuid,
    status text DEFAULT 'aberto'::text NOT NULL,
    supervisor_signature text,
    validated_at timestamp with time zone,
    validated_by uuid,
    CONSTRAINT diario_obras_clima_check CHECK ((clima = ANY (ARRAY['ensolarado'::text, 'parcialmente_nublado'::text, 'nublado'::text, 'chuvoso'::text, 'tempestade'::text])))
);


--
-- Name: employee_epc_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_epc_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    product_id uuid,
    description text NOT NULL,
    serial_number text,
    quantity integer DEFAULT 1 NOT NULL,
    delivery_date date DEFAULT CURRENT_DATE NOT NULL,
    return_date date,
    return_reason text,
    condition_delivery text DEFAULT 'novo'::text,
    condition_return text,
    location text,
    notes text,
    signature_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: employee_epi_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_epi_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    product_id uuid,
    description text NOT NULL,
    ca_number text,
    quantity integer DEFAULT 1 NOT NULL,
    size text,
    delivery_date date DEFAULT CURRENT_DATE NOT NULL,
    return_date date,
    return_reason text,
    signature_url text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: employee_ferramentas_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_ferramentas_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    product_id uuid,
    description text NOT NULL,
    serial_number text,
    quantity integer DEFAULT 1 NOT NULL,
    delivery_date date DEFAULT CURRENT_DATE NOT NULL,
    return_date date,
    return_reason text,
    condition_delivery text DEFAULT 'novo'::text,
    condition_return text,
    notes text,
    signature_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: employee_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    event_type text NOT NULL,
    event_date date NOT NULL,
    description text,
    old_value text,
    new_value text,
    registered_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid,
    user_id uuid,
    name text NOT NULL,
    cpf text,
    rg text,
    birth_date date,
    gender text,
    marital_status text,
    nationality text DEFAULT 'Brasileiro'::text,
    email text,
    phone text,
    phone2 text,
    address text,
    number text,
    complement text,
    neighborhood text,
    city text,
    state text,
    zip_code text,
    registration_number text,
    "position" text,
    department text,
    contract_type public.contract_type DEFAULT 'clt'::public.contract_type,
    hire_date date,
    termination_date date,
    termination_reason text,
    bank_name text,
    bank_agency text,
    bank_account text,
    bank_account_type text,
    pix_key text,
    base_salary numeric DEFAULT 0,
    hourly_rate numeric,
    status public.employee_status DEFAULT 'ativo'::public.employee_status,
    is_technician boolean DEFAULT false,
    photo_url text,
    notes text,
    dependents jsonb DEFAULT '[]'::jsonb,
    documents jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    blusa_numero text,
    calca_numero text,
    calcado_numero text
);


--
-- Name: fechamentos_mensais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fechamentos_mensais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    reference_month integer NOT NULL,
    reference_year integer NOT NULL,
    total_value numeric(12,2) DEFAULT 0,
    suppliers_count integer DEFAULT 0,
    coupons_count integer DEFAULT 0,
    closed_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fechamentos_mensais_reference_month_check CHECK (((reference_month >= 1) AND (reference_month <= 12))),
    CONSTRAINT fechamentos_mensais_reference_year_check CHECK ((reference_year >= 2020))
);


--
-- Name: fiscal_note_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fiscal_note_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fiscal_note_id uuid NOT NULL,
    product_id uuid,
    description text NOT NULL,
    quantity numeric(12,4) DEFAULT 1 NOT NULL,
    unit_price numeric(12,4) DEFAULT 0 NOT NULL,
    total_price numeric(12,2) DEFAULT 0 NOT NULL,
    ncm text,
    cfop text,
    unit text DEFAULT 'UN'::text,
    discount numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fiscal_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fiscal_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    branch_id uuid,
    note_type text NOT NULL,
    numero text NOT NULL,
    serie text DEFAULT '1'::text,
    status text DEFAULT 'pendente'::text NOT NULL,
    issue_date timestamp with time zone DEFAULT now() NOT NULL,
    total_value numeric(12,2) DEFAULT 0 NOT NULL,
    customer_id uuid,
    customer_name text,
    customer_document text,
    operation_nature text,
    freight_value numeric(12,2) DEFAULT 0,
    discount_value numeric(12,2) DEFAULT 0,
    products_value numeric(12,2) DEFAULT 0,
    service_code text,
    service_description text,
    deductions numeric(12,2) DEFAULT 0,
    iss_rate numeric(5,2) DEFAULT 0,
    iss_value numeric(12,2) DEFAULT 0,
    competence_date date,
    access_key text,
    protocol_number text,
    xml_content text,
    pdf_url text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cancelled_at timestamp with time zone,
    cancel_reason text,
    CONSTRAINT fiscal_notes_note_type_check CHECK ((note_type = ANY (ARRAY['nfe'::text, 'nfce'::text, 'nfse'::text]))),
    CONSTRAINT fiscal_notes_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'autorizada'::text, 'cancelada'::text, 'rejeitada'::text])))
);


--
-- Name: fuel_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    date date NOT NULL,
    km_at_fill integer NOT NULL,
    liters numeric(10,2) NOT NULL,
    price_per_liter numeric(10,2) NOT NULL,
    total_cost numeric(12,2) NOT NULL,
    fuel_type text,
    full_tank boolean DEFAULT true,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    supplier_id uuid,
    branch_id uuid
);


--
-- Name: invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    email text NOT NULL,
    role public.app_role DEFAULT 'technician'::public.app_role NOT NULL,
    invited_by uuid,
    token text DEFAULT (gen_random_uuid())::text NOT NULL,
    accepted_at timestamp with time zone,
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    cfop text,
    ncm text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invoice_items_quantity_check CHECK ((quantity > 0))
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    supplier_id uuid,
    invoice_number text NOT NULL,
    invoice_series text,
    invoice_key text,
    issue_date date NOT NULL,
    entry_date timestamp with time zone DEFAULT now(),
    total_value numeric(12,2) DEFAULT 0,
    discount numeric(12,2) DEFAULT 0,
    freight numeric(12,2) DEFAULT 0,
    taxes numeric(12,2) DEFAULT 0,
    notes text,
    xml_content text,
    pdf_url text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    branch_id uuid
);


--
-- Name: leaves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    leave_type public.leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days integer NOT NULL,
    doctor_name text,
    crm text,
    cid text,
    document_url text,
    notes text,
    registered_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: maintenances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    maintenance_type public.maintenance_type NOT NULL,
    status public.maintenance_status DEFAULT 'agendada'::public.maintenance_status,
    description text NOT NULL,
    scheduled_date date,
    scheduled_km integer,
    completed_date date,
    completed_km integer,
    cost numeric(12,2) DEFAULT 0,
    supplier text,
    notes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    branch_id uuid
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    branch_id uuid,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone
);


--
-- Name: obras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.obras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid,
    nome text NOT NULL,
    endereco text,
    cidade text,
    estado text,
    cep text,
    descricao text,
    responsavel_id uuid,
    status text DEFAULT 'planejada'::text NOT NULL,
    progresso integer DEFAULT 0 NOT NULL,
    data_inicio date,
    previsao_termino date,
    data_conclusao date,
    valor_contrato numeric DEFAULT 0,
    notas text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    branch_id uuid,
    CONSTRAINT obras_progresso_check CHECK (((progresso >= 0) AND (progresso <= 100))),
    CONSTRAINT obras_status_check CHECK ((status = ANY (ARRAY['planejada'::text, 'em_andamento'::text, 'pausada'::text, 'concluida'::text, 'cancelada'::text])))
);


--
-- Name: obras_progresso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.obras_progresso (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    obra_id uuid NOT NULL,
    data date DEFAULT CURRENT_DATE NOT NULL,
    percentual_anterior integer DEFAULT 0 NOT NULL,
    percentual_atual integer NOT NULL,
    descricao text,
    registrado_por uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payrolls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payrolls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    reference_month integer NOT NULL,
    reference_year integer NOT NULL,
    base_salary numeric DEFAULT 0,
    overtime_hours numeric DEFAULT 0,
    overtime_value numeric DEFAULT 0,
    night_shift_hours numeric DEFAULT 0,
    night_shift_value numeric DEFAULT 0,
    bonuses numeric DEFAULT 0,
    commissions numeric DEFAULT 0,
    other_earnings numeric DEFAULT 0,
    total_earnings numeric DEFAULT 0,
    inss_value numeric DEFAULT 0,
    inss_rate numeric DEFAULT 0,
    irrf_value numeric DEFAULT 0,
    irrf_rate numeric DEFAULT 0,
    fgts_value numeric DEFAULT 0,
    fgts_rate numeric DEFAULT 8,
    transport_discount numeric DEFAULT 0,
    meal_discount numeric DEFAULT 0,
    healthcare_discount numeric DEFAULT 0,
    other_discounts numeric DEFAULT 0,
    total_discounts numeric DEFAULT 0,
    net_salary numeric DEFAULT 0,
    earnings_details jsonb DEFAULT '[]'::jsonb,
    discounts_details jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'rascunho'::text,
    calculated_at timestamp with time zone,
    approved_by uuid,
    approved_at timestamp with time zone,
    paid_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pdv_cash_operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pdv_cash_operations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    session_id uuid NOT NULL,
    terminal_id uuid NOT NULL,
    operator_id uuid NOT NULL,
    operation_type character varying(20) NOT NULL,
    amount numeric NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pdv_cash_operations_operation_type_check CHECK (((operation_type)::text = ANY ((ARRAY['sangria'::character varying, 'suprimento'::character varying])::text[])))
);


--
-- Name: pdv_operators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pdv_operators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    code character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    pin character varying(6) NOT NULL,
    is_active boolean DEFAULT true,
    can_cancel_sale boolean DEFAULT false,
    can_give_discount boolean DEFAULT false,
    max_discount_percent numeric(5,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pdv_sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pdv_sale_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity numeric(10,3) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pdv_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pdv_sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    session_id uuid NOT NULL,
    terminal_id uuid NOT NULL,
    operator_id uuid NOT NULL,
    sale_number integer NOT NULL,
    total numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0,
    payment_method character varying(20) NOT NULL,
    cash_received numeric(10,2),
    change_given numeric(10,2),
    status character varying(20) DEFAULT 'completed'::character varying,
    cancelled_at timestamp with time zone,
    cancelled_by uuid,
    cancel_reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: pdv_sales_sale_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pdv_sales_sale_number_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pdv_sales_sale_number_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pdv_sales_sale_number_seq OWNED BY public.pdv_sales.sale_number;


--
-- Name: pdv_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pdv_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    terminal_id uuid NOT NULL,
    operator_id uuid NOT NULL,
    opened_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    initial_value numeric(10,2) DEFAULT 0 NOT NULL,
    final_value numeric(10,2),
    total_sales numeric(10,2) DEFAULT 0,
    total_dinheiro numeric(10,2) DEFAULT 0,
    total_credito numeric(10,2) DEFAULT 0,
    total_debito numeric(10,2) DEFAULT 0,
    total_pix numeric(10,2) DEFAULT 0,
    sales_count integer DEFAULT 0,
    difference numeric(10,2) DEFAULT 0,
    notes text,
    status character varying(20) DEFAULT 'aberto'::character varying
);


--
-- Name: pdv_terminals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pdv_terminals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    code character varying(10) NOT NULL,
    is_active boolean DEFAULT true,
    last_activity_at timestamp with time zone,
    current_operator_id uuid,
    opened_at timestamp with time zone,
    initial_value numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: permission_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permission_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3b82f6'::text,
    page_dashboard boolean DEFAULT true,
    page_stock boolean DEFAULT true,
    page_fleet boolean DEFAULT false,
    page_teams boolean DEFAULT false,
    page_service_orders boolean DEFAULT false,
    page_customers boolean DEFAULT false,
    page_invoices boolean DEFAULT false,
    page_reports boolean DEFAULT false,
    page_settings boolean DEFAULT false,
    can_create boolean DEFAULT true,
    can_edit boolean DEFAULT true,
    can_delete boolean DEFAULT false,
    can_export boolean DEFAULT true,
    can_view_costs boolean DEFAULT false,
    can_view_reports boolean DEFAULT false,
    can_manage_users boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    page_movimentacao boolean DEFAULT false,
    page_fechamento boolean DEFAULT false,
    default_dashboard text DEFAULT 'overview'::text,
    page_hr boolean DEFAULT true,
    page_obras boolean DEFAULT true,
    page_diario_obras boolean DEFAULT true,
    page_suppliers boolean DEFAULT true,
    role text DEFAULT 'technician'::text
);


--
-- Name: position_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.position_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    is_driver boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    category public.stock_category NOT NULL,
    unit text DEFAULT 'UN'::text,
    is_serialized boolean DEFAULT false,
    min_stock integer DEFAULT 0,
    max_stock integer,
    current_stock integer DEFAULT 0,
    cost_price numeric(12,2) DEFAULT 0,
    sale_price numeric(12,2),
    location text,
    barcode text,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    material_type text,
    ca_number text,
    ca_validity date,
    epi_type text,
    size text,
    epc_type text,
    applicable_norm text,
    validity_date date,
    dimensions text,
    tool_type text,
    brand text,
    model text,
    voltage text,
    power text,
    acquisition_date date,
    warranty_until date,
    condition text,
    equipment_type text,
    mac_address text,
    branch_id uuid
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    tenant_id uuid,
    full_name text,
    avatar_url text,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email text,
    selected_branch_id uuid
);


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    reminder_date date NOT NULL,
    reminder_time time without time zone,
    type text DEFAULT 'reminder'::text NOT NULL,
    location text,
    notified_day_before boolean DEFAULT false,
    notified_same_day boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    priority text DEFAULT 'media'::text,
    sector text DEFAULT 'overview'::text,
    is_recurring boolean DEFAULT false,
    recurrence_type text,
    recurrence_interval integer DEFAULT 1,
    recurrence_end_date date,
    assigned_user_id uuid,
    assigned_role text,
    CONSTRAINT reminders_priority_check CHECK ((priority = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'urgente'::text])))
);


--
-- Name: serial_numbers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.serial_numbers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    invoice_item_id uuid,
    serial_number text NOT NULL,
    status public.serial_status DEFAULT 'disponivel'::public.serial_status,
    assigned_to uuid,
    assigned_at timestamp with time zone,
    location text,
    notes text,
    warranty_expires date,
    purchase_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    branch_id uuid
);


--
-- Name: service_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    serial_number_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: service_order_technicians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_order_technicians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_order_id uuid NOT NULL,
    technician_id uuid NOT NULL,
    hours_worked numeric(5,2),
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: service_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    order_number integer NOT NULL,
    customer_id uuid NOT NULL,
    team_id uuid,
    status public.service_order_status DEFAULT 'aberta'::public.service_order_status,
    priority public.priority_level DEFAULT 'media'::public.priority_level,
    title text NOT NULL,
    description text,
    scheduled_date date,
    scheduled_time time without time zone,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    address text,
    city text,
    state text,
    estimated_hours numeric(5,2),
    actual_hours numeric(5,2),
    labor_cost numeric(12,2) DEFAULT 0,
    materials_cost numeric(12,2) DEFAULT 0,
    total_cost numeric(12,2) DEFAULT 0,
    notes text,
    internal_notes text,
    signature_url text,
    photos jsonb DEFAULT '[]'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    branch_id uuid
);


--
-- Name: service_orders_order_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.service_orders_order_number_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: service_orders_order_number_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.service_orders_order_number_seq OWNED BY public.service_orders.order_number;


--
-- Name: stock_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    serial_number_id uuid,
    audit_type public.stock_audit_type NOT NULL,
    status public.stock_audit_status DEFAULT 'aberto'::public.stock_audit_status NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    description text NOT NULL,
    evidence_urls jsonb DEFAULT '[]'::jsonb,
    reported_by uuid,
    reported_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    resolution_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    branch_id uuid
);


--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    serial_number_id uuid,
    invoice_id uuid,
    movement_type public.movement_type NOT NULL,
    quantity integer NOT NULL,
    previous_stock integer NOT NULL,
    new_stock integer NOT NULL,
    unit_cost numeric(12,2),
    reason text,
    reference_type text,
    reference_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    branch_id uuid
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    cnpj text,
    email text,
    phone text,
    address text,
    city text,
    state text,
    contact_name text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    branch_id uuid
);


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    technician_id uuid,
    joined_at timestamp with time zone DEFAULT now(),
    employee_id uuid
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    leader_id uuid,
    color text DEFAULT '#3b82f6'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    vehicle_id uuid,
    leader_employee_id uuid,
    branch_id uuid
);


--
-- Name: technicians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technicians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    name text NOT NULL,
    cpf text,
    rg text,
    phone text,
    email text,
    address text,
    city text,
    state text,
    hire_date date,
    "position" text,
    hourly_rate numeric(10,2),
    photo_url text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    branch_id uuid,
    employee_id uuid
);


--
-- Name: tenant_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_features (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    enable_fleet boolean DEFAULT true,
    enable_service_orders boolean DEFAULT true,
    enable_teams boolean DEFAULT true,
    enable_customers boolean DEFAULT true,
    enable_invoices boolean DEFAULT true,
    enable_reports boolean DEFAULT true,
    show_prices boolean DEFAULT true,
    show_costs boolean DEFAULT true,
    show_suppliers boolean DEFAULT true,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    default_dashboard_admin text DEFAULT 'overview'::text,
    default_dashboard_manager text DEFAULT 'overview'::text,
    default_dashboard_warehouse text DEFAULT 'estoque'::text,
    default_dashboard_technician text DEFAULT 'servico'::text,
    default_dashboard_caixa text DEFAULT 'pdv'::text,
    enable_pdv boolean DEFAULT true,
    pdv_print_method character varying(20) DEFAULT 'browser'::character varying,
    pdv_printer_name text,
    pdv_receipt_header text,
    pdv_receipt_footer text,
    pdv_show_company_info boolean DEFAULT true,
    pdv_paper_width integer DEFAULT 80,
    enable_hr boolean DEFAULT true,
    enable_stock boolean DEFAULT true,
    enable_movimentacao boolean DEFAULT true,
    enable_cautelas boolean DEFAULT true,
    enable_fechamento boolean DEFAULT true,
    enable_obras boolean DEFAULT true,
    enable_stock_materiais boolean DEFAULT true,
    enable_stock_equipamentos boolean DEFAULT true,
    enable_stock_ferramentas boolean DEFAULT true,
    enable_stock_epi boolean DEFAULT true,
    enable_stock_epc boolean DEFAULT true,
    enable_stock_auditoria boolean DEFAULT true,
    enable_nf_entrada boolean DEFAULT true,
    enable_nf_emissao boolean DEFAULT true,
    enable_hr_colaboradores boolean DEFAULT true,
    enable_hr_folha boolean DEFAULT true,
    enable_hr_ferias boolean DEFAULT true,
    enable_hr_afastamentos boolean DEFAULT true,
    enable_obras_projetos boolean DEFAULT true,
    enable_obras_diario boolean DEFAULT true
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    cnpj text,
    razao_social text,
    email text,
    phone text,
    address text,
    city text,
    state text,
    zip_code text,
    logo_url text,
    background_url text,
    primary_color text DEFAULT '#3b82f6'::text,
    secondary_color text DEFAULT '#1e40af'::text,
    theme text DEFAULT 'light'::text,
    status public.tenant_status DEFAULT 'trial'::public.tenant_status,
    settings jsonb DEFAULT '{}'::jsonb,
    landing_page_content jsonb DEFAULT '{"title": "Bem-vindo", "services": [], "description": "Sistema de gestão empresarial"}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    number text,
    complement text,
    neighborhood text,
    menu_color text DEFAULT '#1e3a5f'::text,
    primary_opacity integer DEFAULT 100,
    secondary_opacity integer DEFAULT 100,
    logo_dark_url text,
    proprietario text
);


--
-- Name: tenant_landing_pages; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.tenant_landing_pages WITH (security_invoker='true') AS
 SELECT id,
    name,
    slug,
    logo_url,
    background_url,
    primary_color,
    secondary_color,
    theme,
    landing_page_content
   FROM public.tenants
  WHERE (status = 'active'::public.tenant_status);


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    page_dashboard boolean DEFAULT true,
    page_stock boolean DEFAULT true,
    page_fleet boolean DEFAULT true,
    page_teams boolean DEFAULT true,
    page_service_orders boolean DEFAULT true,
    page_customers boolean DEFAULT true,
    page_invoices boolean DEFAULT true,
    page_reports boolean DEFAULT true,
    page_settings boolean DEFAULT false,
    can_create boolean DEFAULT true,
    can_edit boolean DEFAULT true,
    can_delete boolean DEFAULT false,
    can_export boolean DEFAULT true,
    can_view_costs boolean DEFAULT true,
    can_view_reports boolean DEFAULT true,
    can_manage_users boolean DEFAULT false,
    branch_ids uuid[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    template_id uuid,
    page_movimentacao boolean DEFAULT true,
    page_fechamento boolean DEFAULT true,
    dashboard_type text,
    page_hr boolean DEFAULT true,
    page_obras boolean DEFAULT true,
    page_diario_obras boolean DEFAULT true,
    page_suppliers boolean DEFAULT true
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: vacations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vacations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    acquisition_start date NOT NULL,
    acquisition_end date NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days_taken integer NOT NULL,
    sold_days integer DEFAULT 0,
    status public.vacation_status DEFAULT 'pendente'::public.vacation_status,
    requested_at timestamp with time zone DEFAULT now(),
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_reason text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    plate text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    year integer,
    color text,
    chassis text,
    renavam text,
    fuel_type text DEFAULT 'flex'::text,
    current_km integer DEFAULT 0,
    image_url text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    branch_id uuid,
    fleet_number text
);


--
-- Name: pdv_sales sale_number; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sales ALTER COLUMN sale_number SET DEFAULT nextval('public.pdv_sales_sale_number_seq'::regclass);


--
-- Name: service_orders order_number; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders ALTER COLUMN order_number SET DEFAULT nextval('public.service_orders_order_number_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: asset_assignments asset_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: diario_obras diario_obras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diario_obras
    ADD CONSTRAINT diario_obras_pkey PRIMARY KEY (id);


--
-- Name: employee_epc_assignments employee_epc_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_epc_assignments
    ADD CONSTRAINT employee_epc_assignments_pkey PRIMARY KEY (id);


--
-- Name: employee_epi_assignments employee_epi_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_epi_assignments
    ADD CONSTRAINT employee_epi_assignments_pkey PRIMARY KEY (id);


--
-- Name: employee_ferramentas_assignments employee_ferramentas_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_ferramentas_assignments
    ADD CONSTRAINT employee_ferramentas_assignments_pkey PRIMARY KEY (id);


--
-- Name: employee_history employee_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_history
    ADD CONSTRAINT employee_history_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: fechamentos_mensais fechamentos_mensais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fechamentos_mensais
    ADD CONSTRAINT fechamentos_mensais_pkey PRIMARY KEY (id);


--
-- Name: fechamentos_mensais fechamentos_mensais_tenant_id_reference_month_reference_yea_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fechamentos_mensais
    ADD CONSTRAINT fechamentos_mensais_tenant_id_reference_month_reference_yea_key UNIQUE (tenant_id, reference_month, reference_year);


--
-- Name: fiscal_note_items fiscal_note_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_note_items
    ADD CONSTRAINT fiscal_note_items_pkey PRIMARY KEY (id);


--
-- Name: fiscal_notes fiscal_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_notes
    ADD CONSTRAINT fiscal_notes_pkey PRIMARY KEY (id);


--
-- Name: fuel_logs fuel_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_logs
    ADD CONSTRAINT fuel_logs_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_token_key UNIQUE (token);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_tenant_id_invoice_number_invoice_series_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_invoice_number_invoice_series_key UNIQUE (tenant_id, invoice_number, invoice_series);


--
-- Name: leaves leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_pkey PRIMARY KEY (id);


--
-- Name: maintenances maintenances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT maintenances_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: obras obras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_pkey PRIMARY KEY (id);


--
-- Name: obras_progresso obras_progresso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras_progresso
    ADD CONSTRAINT obras_progresso_pkey PRIMARY KEY (id);


--
-- Name: payrolls payrolls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_pkey PRIMARY KEY (id);


--
-- Name: payrolls payrolls_tenant_id_employee_id_reference_month_reference_ye_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_tenant_id_employee_id_reference_month_reference_ye_key UNIQUE (tenant_id, employee_id, reference_month, reference_year);


--
-- Name: pdv_cash_operations pdv_cash_operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_cash_operations
    ADD CONSTRAINT pdv_cash_operations_pkey PRIMARY KEY (id);


--
-- Name: pdv_operators pdv_operators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_operators
    ADD CONSTRAINT pdv_operators_pkey PRIMARY KEY (id);


--
-- Name: pdv_operators pdv_operators_tenant_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_operators
    ADD CONSTRAINT pdv_operators_tenant_id_code_key UNIQUE (tenant_id, code);


--
-- Name: pdv_sale_items pdv_sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sale_items
    ADD CONSTRAINT pdv_sale_items_pkey PRIMARY KEY (id);


--
-- Name: pdv_sales pdv_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sales
    ADD CONSTRAINT pdv_sales_pkey PRIMARY KEY (id);


--
-- Name: pdv_sessions pdv_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sessions
    ADD CONSTRAINT pdv_sessions_pkey PRIMARY KEY (id);


--
-- Name: pdv_terminals pdv_terminals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_terminals
    ADD CONSTRAINT pdv_terminals_pkey PRIMARY KEY (id);


--
-- Name: pdv_terminals pdv_terminals_tenant_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_terminals
    ADD CONSTRAINT pdv_terminals_tenant_id_code_key UNIQUE (tenant_id, code);


--
-- Name: permission_templates permission_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_templates
    ADD CONSTRAINT permission_templates_pkey PRIMARY KEY (id);


--
-- Name: position_categories position_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.position_categories
    ADD CONSTRAINT position_categories_pkey PRIMARY KEY (id);


--
-- Name: position_categories position_categories_tenant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.position_categories
    ADD CONSTRAINT position_categories_tenant_id_name_key UNIQUE (tenant_id, name);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_tenant_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_tenant_id_code_key UNIQUE (tenant_id, code);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: serial_numbers serial_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serial_numbers
    ADD CONSTRAINT serial_numbers_pkey PRIMARY KEY (id);


--
-- Name: serial_numbers serial_numbers_tenant_id_product_id_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serial_numbers
    ADD CONSTRAINT serial_numbers_tenant_id_product_id_serial_number_key UNIQUE (tenant_id, product_id, serial_number);


--
-- Name: service_order_items service_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_items
    ADD CONSTRAINT service_order_items_pkey PRIMARY KEY (id);


--
-- Name: service_order_technicians service_order_technicians_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_technicians
    ADD CONSTRAINT service_order_technicians_pkey PRIMARY KEY (id);


--
-- Name: service_order_technicians service_order_technicians_service_order_id_technician_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_technicians
    ADD CONSTRAINT service_order_technicians_service_order_id_technician_id_key UNIQUE (service_order_id, technician_id);


--
-- Name: service_orders service_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_pkey PRIMARY KEY (id);


--
-- Name: stock_audits stock_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audits
    ADD CONSTRAINT stock_audits_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_team_id_technician_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_technician_id_key UNIQUE (team_id, technician_id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: technicians technicians_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technicians
    ADD CONSTRAINT technicians_pkey PRIMARY KEY (id);


--
-- Name: tenant_features tenant_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_features
    ADD CONSTRAINT tenant_features_pkey PRIMARY KEY (id);


--
-- Name: tenant_features tenant_features_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_features
    ADD CONSTRAINT tenant_features_tenant_id_key UNIQUE (tenant_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_key UNIQUE (slug);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_user_id_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_tenant_id_key UNIQUE (user_id, tenant_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_tenant_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_tenant_id_role_key UNIQUE (user_id, tenant_id, role);


--
-- Name: vacations vacations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT vacations_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_tenant_id_plate_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_tenant_id_plate_key UNIQUE (tenant_id, plate);


--
-- Name: idx_activity_logs_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_tenant_id ON public.activity_logs USING btree (tenant_id);


--
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);


--
-- Name: idx_asset_assignments_technician_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asset_assignments_technician_id ON public.asset_assignments USING btree (technician_id);


--
-- Name: idx_branches_tenant_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_branches_tenant_active ON public.branches USING btree (tenant_id, is_active);


--
-- Name: idx_customers_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_branch_id ON public.customers USING btree (branch_id);


--
-- Name: idx_customers_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_tenant_id ON public.customers USING btree (tenant_id);


--
-- Name: idx_diario_obras_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diario_obras_status ON public.diario_obras USING btree (status);


--
-- Name: idx_employee_epi_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_epi_employee ON public.employee_epi_assignments USING btree (employee_id);


--
-- Name: idx_employee_epi_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_epi_tenant ON public.employee_epi_assignments USING btree (tenant_id);


--
-- Name: idx_employee_history_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_history_employee ON public.employee_history USING btree (employee_id);


--
-- Name: idx_employees_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_branch_id ON public.employees USING btree (branch_id);


--
-- Name: idx_employees_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_cpf ON public.employees USING btree (cpf);


--
-- Name: idx_employees_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_status ON public.employees USING btree (status);


--
-- Name: idx_employees_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_tenant ON public.employees USING btree (tenant_id);


--
-- Name: idx_fechamentos_mensais_tenant_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fechamentos_mensais_tenant_period ON public.fechamentos_mensais USING btree (tenant_id, reference_year, reference_month);


--
-- Name: idx_fiscal_note_items_fiscal_note_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiscal_note_items_fiscal_note_id ON public.fiscal_note_items USING btree (fiscal_note_id);


--
-- Name: idx_fiscal_notes_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiscal_notes_branch_id ON public.fiscal_notes USING btree (branch_id);


--
-- Name: idx_fiscal_notes_issue_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiscal_notes_issue_date ON public.fiscal_notes USING btree (issue_date);


--
-- Name: idx_fiscal_notes_note_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiscal_notes_note_type ON public.fiscal_notes USING btree (note_type);


--
-- Name: idx_fiscal_notes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiscal_notes_status ON public.fiscal_notes USING btree (status);


--
-- Name: idx_fiscal_notes_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiscal_notes_tenant_id ON public.fiscal_notes USING btree (tenant_id);


--
-- Name: idx_fuel_logs_supplier_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fuel_logs_supplier_id ON public.fuel_logs USING btree (supplier_id);


--
-- Name: idx_fuel_logs_vehicle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fuel_logs_vehicle_id ON public.fuel_logs USING btree (vehicle_id);


--
-- Name: idx_invitations_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_tenant_id ON public.invitations USING btree (tenant_id);


--
-- Name: idx_invitations_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_token ON public.invitations USING btree (token);


--
-- Name: idx_invoice_items_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);


--
-- Name: idx_invoice_items_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_product_id ON public.invoice_items USING btree (product_id);


--
-- Name: idx_invoices_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_number ON public.invoices USING btree (invoice_number);


--
-- Name: idx_invoices_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_tenant_id ON public.invoices USING btree (tenant_id);


--
-- Name: idx_leaves_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaves_employee ON public.leaves USING btree (employee_id);


--
-- Name: idx_leaves_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaves_type ON public.leaves USING btree (leave_type);


--
-- Name: idx_maintenances_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenances_status ON public.maintenances USING btree (status);


--
-- Name: idx_maintenances_vehicle_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenances_vehicle_id ON public.maintenances USING btree (vehicle_id);


--
-- Name: idx_notifications_tenant_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_tenant_user ON public.notifications USING btree (tenant_id, user_id);


--
-- Name: idx_notifications_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (tenant_id, is_read) WHERE (is_read = false);


--
-- Name: idx_payrolls_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_employee ON public.payrolls USING btree (employee_id);


--
-- Name: idx_payrolls_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payrolls_period ON public.payrolls USING btree (reference_year, reference_month);


--
-- Name: idx_products_barcode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_barcode ON public.products USING btree (barcode);


--
-- Name: idx_products_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_branch_id ON public.products USING btree (branch_id);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- Name: idx_products_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_code ON public.products USING btree (code);


--
-- Name: idx_products_material_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_material_type ON public.products USING btree (material_type);


--
-- Name: idx_products_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_tenant_id ON public.products USING btree (tenant_id);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_tenant_id ON public.profiles USING btree (tenant_id);


--
-- Name: idx_reminders_notifications; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_notifications ON public.reminders USING btree (reminder_date, notified_day_before, notified_same_day, is_active);


--
-- Name: idx_reminders_tenant_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_tenant_date ON public.reminders USING btree (tenant_id, reminder_date);


--
-- Name: idx_serial_numbers_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_serial_numbers_branch_id ON public.serial_numbers USING btree (branch_id);


--
-- Name: idx_serial_numbers_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_serial_numbers_product_id ON public.serial_numbers USING btree (product_id);


--
-- Name: idx_serial_numbers_serial; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_serial_numbers_serial ON public.serial_numbers USING btree (serial_number);


--
-- Name: idx_serial_numbers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_serial_numbers_status ON public.serial_numbers USING btree (status);


--
-- Name: idx_serial_numbers_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_serial_numbers_tenant_id ON public.serial_numbers USING btree (tenant_id);


--
-- Name: idx_service_order_items_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_order_items_order_id ON public.service_order_items USING btree (service_order_id);


--
-- Name: idx_service_orders_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_orders_branch_id ON public.service_orders USING btree (branch_id);


--
-- Name: idx_service_orders_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_orders_customer_id ON public.service_orders USING btree (customer_id);


--
-- Name: idx_service_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_orders_status ON public.service_orders USING btree (status);


--
-- Name: idx_service_orders_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_orders_tenant_id ON public.service_orders USING btree (tenant_id);


--
-- Name: idx_stock_audits_audit_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_audits_audit_type ON public.stock_audits USING btree (audit_type);


--
-- Name: idx_stock_audits_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_audits_product_id ON public.stock_audits USING btree (product_id);


--
-- Name: idx_stock_audits_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_audits_status ON public.stock_audits USING btree (status);


--
-- Name: idx_stock_audits_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_audits_tenant_id ON public.stock_audits USING btree (tenant_id);


--
-- Name: idx_stock_movements_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_branch_id ON public.stock_movements USING btree (branch_id);


--
-- Name: idx_stock_movements_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_product_id ON public.stock_movements USING btree (product_id);


--
-- Name: idx_stock_movements_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stock_movements_tenant_id ON public.stock_movements USING btree (tenant_id);


--
-- Name: idx_suppliers_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppliers_tenant_id ON public.suppliers USING btree (tenant_id);


--
-- Name: idx_team_members_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_employee_id ON public.team_members USING btree (employee_id);


--
-- Name: idx_team_members_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_team_id ON public.team_members USING btree (team_id);


--
-- Name: idx_teams_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_branch_id ON public.teams USING btree (branch_id);


--
-- Name: idx_teams_leader_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_leader_employee_id ON public.teams USING btree (leader_employee_id);


--
-- Name: idx_teams_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_tenant_id ON public.teams USING btree (tenant_id);


--
-- Name: idx_technicians_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_technicians_branch_id ON public.technicians USING btree (branch_id);


--
-- Name: idx_technicians_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_technicians_employee_id ON public.technicians USING btree (employee_id);


--
-- Name: idx_technicians_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_technicians_tenant_id ON public.technicians USING btree (tenant_id);


--
-- Name: idx_tenants_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_slug ON public.tenants USING btree (slug);


--
-- Name: idx_user_permissions_user_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_permissions_user_tenant ON public.user_permissions USING btree (user_id, tenant_id);


--
-- Name: idx_user_roles_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_tenant_id ON public.user_roles USING btree (tenant_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_user_roles_user_tenant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_tenant ON public.user_roles USING btree (user_id, tenant_id);


--
-- Name: idx_vacations_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacations_employee ON public.vacations USING btree (employee_id);


--
-- Name: idx_vacations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vacations_status ON public.vacations USING btree (status);


--
-- Name: idx_vehicles_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_branch_id ON public.vehicles USING btree (branch_id);


--
-- Name: idx_vehicles_plate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_plate ON public.vehicles USING btree (plate);


--
-- Name: idx_vehicles_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_tenant_id ON public.vehicles USING btree (tenant_id);


--
-- Name: tenants on_tenant_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_tenant_created AFTER INSERT ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant();


--
-- Name: user_roles on_user_role_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_user_role_created AFTER INSERT ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_permissions();


--
-- Name: customers set_customers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: invoices set_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: maintenances set_maintenances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_maintenances_updated_at BEFORE UPDATE ON public.maintenances FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: products set_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles set_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: serial_numbers set_serial_numbers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_serial_numbers_updated_at BEFORE UPDATE ON public.serial_numbers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: service_orders set_service_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_service_orders_updated_at BEFORE UPDATE ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: suppliers set_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: teams set_teams_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: technicians set_technicians_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_technicians_updated_at BEFORE UPDATE ON public.technicians FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: tenants set_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: vehicles set_vehicles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: employees update_employees_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: fiscal_notes update_fiscal_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_fiscal_notes_updated_at BEFORE UPDATE ON public.fiscal_notes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: leaves update_leaves_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON public.leaves FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: payrolls update_payrolls_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payrolls_updated_at BEFORE UPDATE ON public.payrolls FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: pdv_operators update_pdv_operators_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pdv_operators_updated_at BEFORE UPDATE ON public.pdv_operators FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: position_categories update_position_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_position_categories_updated_at BEFORE UPDATE ON public.position_categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: stock_audits update_stock_audits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_stock_audits_updated_at BEFORE UPDATE ON public.stock_audits FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: vacations update_vacations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vacations_updated_at BEFORE UPDATE ON public.vacations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: activity_logs activity_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: asset_assignments asset_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: asset_assignments asset_assignments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: asset_assignments asset_assignments_serial_number_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_serial_number_id_fkey FOREIGN KEY (serial_number_id) REFERENCES public.serial_numbers(id) ON DELETE CASCADE;


--
-- Name: asset_assignments asset_assignments_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.technicians(id) ON DELETE CASCADE;


--
-- Name: asset_assignments asset_assignments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: asset_assignments asset_assignments_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_assignments
    ADD CONSTRAINT asset_assignments_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: branches branches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: customers customers_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: customers customers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: diario_obras diario_obras_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diario_obras
    ADD CONSTRAINT diario_obras_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: diario_obras diario_obras_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diario_obras
    ADD CONSTRAINT diario_obras_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: diario_obras diario_obras_registrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diario_obras
    ADD CONSTRAINT diario_obras_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES auth.users(id);


--
-- Name: diario_obras diario_obras_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diario_obras
    ADD CONSTRAINT diario_obras_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: employee_epc_assignments employee_epc_assignments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_epc_assignments
    ADD CONSTRAINT employee_epc_assignments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_epc_assignments employee_epc_assignments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_epc_assignments
    ADD CONSTRAINT employee_epc_assignments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: employee_epc_assignments employee_epc_assignments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_epc_assignments
    ADD CONSTRAINT employee_epc_assignments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: employee_epi_assignments employee_epi_assignments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_epi_assignments
    ADD CONSTRAINT employee_epi_assignments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_epi_assignments employee_epi_assignments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_epi_assignments
    ADD CONSTRAINT employee_epi_assignments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: employee_epi_assignments employee_epi_assignments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_epi_assignments
    ADD CONSTRAINT employee_epi_assignments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: employee_ferramentas_assignments employee_ferramentas_assignments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_ferramentas_assignments
    ADD CONSTRAINT employee_ferramentas_assignments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_ferramentas_assignments employee_ferramentas_assignments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_ferramentas_assignments
    ADD CONSTRAINT employee_ferramentas_assignments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: employee_ferramentas_assignments employee_ferramentas_assignments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_ferramentas_assignments
    ADD CONSTRAINT employee_ferramentas_assignments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: employee_history employee_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_history
    ADD CONSTRAINT employee_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_history employee_history_registered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_history
    ADD CONSTRAINT employee_history_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES auth.users(id);


--
-- Name: employee_history employee_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_history
    ADD CONSTRAINT employee_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: employees employees_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: employees employees_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: fechamentos_mensais fechamentos_mensais_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fechamentos_mensais
    ADD CONSTRAINT fechamentos_mensais_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES auth.users(id);


--
-- Name: fechamentos_mensais fechamentos_mensais_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fechamentos_mensais
    ADD CONSTRAINT fechamentos_mensais_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: fiscal_note_items fiscal_note_items_fiscal_note_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_note_items
    ADD CONSTRAINT fiscal_note_items_fiscal_note_id_fkey FOREIGN KEY (fiscal_note_id) REFERENCES public.fiscal_notes(id) ON DELETE CASCADE;


--
-- Name: fiscal_note_items fiscal_note_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_note_items
    ADD CONSTRAINT fiscal_note_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: fiscal_notes fiscal_notes_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_notes
    ADD CONSTRAINT fiscal_notes_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: fiscal_notes fiscal_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_notes
    ADD CONSTRAINT fiscal_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: fiscal_notes fiscal_notes_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_notes
    ADD CONSTRAINT fiscal_notes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: fiscal_notes fiscal_notes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_notes
    ADD CONSTRAINT fiscal_notes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: fuel_logs fuel_logs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_logs
    ADD CONSTRAINT fuel_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: fuel_logs fuel_logs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_logs
    ADD CONSTRAINT fuel_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: fuel_logs fuel_logs_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_logs
    ADD CONSTRAINT fuel_logs_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: fuel_logs fuel_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_logs
    ADD CONSTRAINT fuel_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: fuel_logs fuel_logs_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_logs
    ADD CONSTRAINT fuel_logs_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: invitations invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: invitations invitations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_items invoice_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: invoices invoices_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: leaves leaves_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: leaves leaves_registered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES auth.users(id);


--
-- Name: leaves leaves_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: maintenances maintenances_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT maintenances_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: maintenances maintenances_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT maintenances_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: maintenances maintenances_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT maintenances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: maintenances maintenances_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT maintenances_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: obras obras_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: obras obras_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: obras obras_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: obras_progresso obras_progresso_obra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras_progresso
    ADD CONSTRAINT obras_progresso_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE CASCADE;


--
-- Name: obras_progresso obras_progresso_registrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras_progresso
    ADD CONSTRAINT obras_progresso_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES auth.users(id);


--
-- Name: obras_progresso obras_progresso_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras_progresso
    ADD CONSTRAINT obras_progresso_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: obras obras_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.technicians(id);


--
-- Name: obras obras_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.obras
    ADD CONSTRAINT obras_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: payrolls payrolls_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: payrolls payrolls_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: payrolls payrolls_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payrolls
    ADD CONSTRAINT payrolls_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pdv_cash_operations pdv_cash_operations_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_cash_operations
    ADD CONSTRAINT pdv_cash_operations_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.pdv_operators(id) ON DELETE CASCADE;


--
-- Name: pdv_cash_operations pdv_cash_operations_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_cash_operations
    ADD CONSTRAINT pdv_cash_operations_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pdv_sessions(id) ON DELETE CASCADE;


--
-- Name: pdv_cash_operations pdv_cash_operations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_cash_operations
    ADD CONSTRAINT pdv_cash_operations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pdv_cash_operations pdv_cash_operations_terminal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_cash_operations
    ADD CONSTRAINT pdv_cash_operations_terminal_id_fkey FOREIGN KEY (terminal_id) REFERENCES public.pdv_terminals(id) ON DELETE CASCADE;


--
-- Name: pdv_operators pdv_operators_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_operators
    ADD CONSTRAINT pdv_operators_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pdv_sale_items pdv_sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sale_items
    ADD CONSTRAINT pdv_sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: pdv_sale_items pdv_sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sale_items
    ADD CONSTRAINT pdv_sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.pdv_sales(id) ON DELETE CASCADE;


--
-- Name: pdv_sales pdv_sales_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sales
    ADD CONSTRAINT pdv_sales_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.pdv_operators(id);


--
-- Name: pdv_sales pdv_sales_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sales
    ADD CONSTRAINT pdv_sales_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.pdv_operators(id);


--
-- Name: pdv_sales pdv_sales_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sales
    ADD CONSTRAINT pdv_sales_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pdv_sessions(id);


--
-- Name: pdv_sales pdv_sales_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sales
    ADD CONSTRAINT pdv_sales_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pdv_sales pdv_sales_terminal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sales
    ADD CONSTRAINT pdv_sales_terminal_id_fkey FOREIGN KEY (terminal_id) REFERENCES public.pdv_terminals(id);


--
-- Name: pdv_sessions pdv_sessions_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sessions
    ADD CONSTRAINT pdv_sessions_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.pdv_operators(id);


--
-- Name: pdv_sessions pdv_sessions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sessions
    ADD CONSTRAINT pdv_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: pdv_sessions pdv_sessions_terminal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_sessions
    ADD CONSTRAINT pdv_sessions_terminal_id_fkey FOREIGN KEY (terminal_id) REFERENCES public.pdv_terminals(id) ON DELETE CASCADE;


--
-- Name: pdv_terminals pdv_terminals_current_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_terminals
    ADD CONSTRAINT pdv_terminals_current_operator_id_fkey FOREIGN KEY (current_operator_id) REFERENCES public.pdv_operators(id);


--
-- Name: pdv_terminals pdv_terminals_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pdv_terminals
    ADD CONSTRAINT pdv_terminals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: permission_templates permission_templates_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permission_templates
    ADD CONSTRAINT permission_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: position_categories position_categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.position_categories
    ADD CONSTRAINT position_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: products products_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: products products_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_selected_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_selected_branch_id_fkey FOREIGN KEY (selected_branch_id) REFERENCES public.branches(id);


--
-- Name: profiles profiles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: reminders reminders_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: reminders reminders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: serial_numbers serial_numbers_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serial_numbers
    ADD CONSTRAINT serial_numbers_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: serial_numbers serial_numbers_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serial_numbers
    ADD CONSTRAINT serial_numbers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: serial_numbers serial_numbers_invoice_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serial_numbers
    ADD CONSTRAINT serial_numbers_invoice_item_id_fkey FOREIGN KEY (invoice_item_id) REFERENCES public.invoice_items(id) ON DELETE SET NULL;


--
-- Name: serial_numbers serial_numbers_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serial_numbers
    ADD CONSTRAINT serial_numbers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: serial_numbers serial_numbers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serial_numbers
    ADD CONSTRAINT serial_numbers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: service_order_items service_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_items
    ADD CONSTRAINT service_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: service_order_items service_order_items_serial_number_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_items
    ADD CONSTRAINT service_order_items_serial_number_id_fkey FOREIGN KEY (serial_number_id) REFERENCES public.serial_numbers(id) ON DELETE SET NULL;


--
-- Name: service_order_items service_order_items_service_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_items
    ADD CONSTRAINT service_order_items_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES public.service_orders(id) ON DELETE CASCADE;


--
-- Name: service_order_technicians service_order_technicians_service_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_technicians
    ADD CONSTRAINT service_order_technicians_service_order_id_fkey FOREIGN KEY (service_order_id) REFERENCES public.service_orders(id) ON DELETE CASCADE;


--
-- Name: service_order_technicians service_order_technicians_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_order_technicians
    ADD CONSTRAINT service_order_technicians_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.technicians(id) ON DELETE CASCADE;


--
-- Name: service_orders service_orders_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: service_orders service_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: service_orders service_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;


--
-- Name: service_orders service_orders_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: service_orders service_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: stock_audits stock_audits_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audits
    ADD CONSTRAINT stock_audits_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: stock_audits stock_audits_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audits
    ADD CONSTRAINT stock_audits_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: stock_audits stock_audits_serial_number_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audits
    ADD CONSTRAINT stock_audits_serial_number_id_fkey FOREIGN KEY (serial_number_id) REFERENCES public.serial_numbers(id) ON DELETE SET NULL;


--
-- Name: stock_audits stock_audits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_audits
    ADD CONSTRAINT stock_audits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: stock_movements stock_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_serial_number_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_serial_number_id_fkey FOREIGN KEY (serial_number_id) REFERENCES public.serial_numbers(id) ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: suppliers suppliers_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: suppliers suppliers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: team_members team_members_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.technicians(id) ON DELETE CASCADE;


--
-- Name: teams teams_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: teams teams_leader_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_leader_employee_id_fkey FOREIGN KEY (leader_employee_id) REFERENCES public.employees(id);


--
-- Name: teams teams_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.technicians(id) ON DELETE SET NULL;


--
-- Name: teams teams_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: teams teams_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: technicians technicians_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technicians
    ADD CONSTRAINT technicians_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: technicians technicians_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technicians
    ADD CONSTRAINT technicians_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: technicians technicians_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technicians
    ADD CONSTRAINT technicians_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: technicians technicians_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technicians
    ADD CONSTRAINT technicians_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tenant_features tenant_features_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_features
    ADD CONSTRAINT tenant_features_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.permission_templates(id) ON DELETE SET NULL;


--
-- Name: user_permissions user_permissions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vacations vacations_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT vacations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: vacations vacations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT vacations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: vacations vacations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vacations
    ADD CONSTRAINT vacations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: vehicles vehicles_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: vehicles vehicles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenants Admins and managers can update their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can update their tenant" ON public.tenants FOR UPDATE USING ((public.is_superadmin(auth.uid()) OR public.is_tenant_admin(auth.uid(), id) OR (public.user_belongs_to_tenant(auth.uid(), id) AND public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((public.is_superadmin(auth.uid()) OR public.is_tenant_admin(auth.uid(), id) OR (public.user_belongs_to_tenant(auth.uid(), id) AND public.has_role(auth.uid(), 'manager'::public.app_role))));


--
-- Name: invitations Admins can create invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create invitations" ON public.invitations FOR INSERT TO authenticated WITH CHECK ((public.is_tenant_admin(auth.uid(), tenant_id) AND (role <> 'superadmin'::public.app_role)));


--
-- Name: invitations Admins can delete invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete invitations" ON public.invitations FOR DELETE TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id));


--
-- Name: notifications Admins can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: branches Admins can manage branches in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage branches in their tenant" ON public.branches USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: pdv_cash_operations Admins can manage pdv cash operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pdv cash operations" ON public.pdv_cash_operations USING ((public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid())));


--
-- Name: pdv_operators Admins can manage pdv operators; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pdv operators" ON public.pdv_operators USING ((public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid())));


--
-- Name: pdv_sale_items Admins can manage pdv sale items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pdv sale items" ON public.pdv_sale_items USING ((EXISTS ( SELECT 1
   FROM public.pdv_sales s
  WHERE ((s.id = pdv_sale_items.sale_id) AND (public.is_tenant_admin(auth.uid(), s.tenant_id) OR public.is_superadmin(auth.uid()))))));


--
-- Name: pdv_sales Admins can manage pdv sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pdv sales" ON public.pdv_sales USING ((public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid())));


--
-- Name: pdv_sessions Admins can manage pdv sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pdv sessions" ON public.pdv_sessions USING ((public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid())));


--
-- Name: pdv_terminals Admins can manage pdv terminals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pdv terminals" ON public.pdv_terminals USING ((public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid())));


--
-- Name: user_roles Admins can manage roles in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles in their tenant" ON public.user_roles TO authenticated USING ((public.is_tenant_admin(auth.uid(), tenant_id) AND (role <> 'superadmin'::public.app_role))) WITH CHECK ((public.is_tenant_admin(auth.uid(), tenant_id) AND (role <> 'superadmin'::public.app_role)));


--
-- Name: permission_templates Admins can manage templates in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage templates in their tenant" ON public.permission_templates USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: invitations Admins can view invitations in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view invitations in their tenant" ON public.invitations FOR SELECT TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id));


--
-- Name: tenant_features Admins can view their tenant features; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view their tenant features" ON public.tenant_features FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: branches Anyone can view active branches for login; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active branches for login" ON public.branches FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: invitations Anyone can view invitation by valid token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view invitation by valid token" ON public.invitations FOR SELECT TO authenticated, anon USING (true);


--
-- Name: employee_epc_assignments Managers can manage EPC assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage EPC assignments" ON public.employee_epc_assignments USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: employee_epi_assignments Managers can manage EPI assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage EPI assignments" ON public.employee_epi_assignments USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: employee_ferramentas_assignments Managers can manage Ferramentas assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage Ferramentas assignments" ON public.employee_ferramentas_assignments USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: asset_assignments Managers can manage asset assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage asset assignments" ON public.asset_assignments TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: customers Managers can manage customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage customers" ON public.customers TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: employee_history Managers can manage employee history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage employee history" ON public.employee_history USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: employees Managers can manage employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage employees" ON public.employees USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: fuel_logs Managers can manage fuel logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage fuel logs" ON public.fuel_logs TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: invoice_items Managers can manage invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage invoice items" ON public.invoice_items TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (i.tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (i.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: invoices Managers can manage invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage invoices" ON public.invoices TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: leaves Managers can manage leaves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage leaves" ON public.leaves USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: maintenances Managers can manage maintenances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage maintenances" ON public.maintenances TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: obras Managers can manage obras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage obras" ON public.obras USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: obras_progresso Managers can manage obras_progresso; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage obras_progresso" ON public.obras_progresso USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: payrolls Managers can manage payrolls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage payrolls" ON public.payrolls USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: position_categories Managers can manage position categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage position categories" ON public.position_categories USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: products Managers can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage products" ON public.products TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: serial_numbers Managers can manage serial numbers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage serial numbers" ON public.serial_numbers TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: service_order_items Managers can manage service order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage service order items" ON public.service_order_items TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.service_orders so
  WHERE ((so.id = service_order_items.service_order_id) AND (so.tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.service_orders so
  WHERE ((so.id = service_order_items.service_order_id) AND (so.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: service_order_technicians Managers can manage service order technicians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage service order technicians" ON public.service_order_technicians TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.service_orders so
  WHERE ((so.id = service_order_technicians.service_order_id) AND (so.tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.service_orders so
  WHERE ((so.id = service_order_technicians.service_order_id) AND (so.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: service_orders Managers can manage service orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage service orders" ON public.service_orders TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: stock_audits Managers can manage stock audits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage stock audits" ON public.stock_audits USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: suppliers Managers can manage suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage suppliers" ON public.suppliers TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: team_members Managers can manage team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage team members" ON public.team_members TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = team_members.team_id) AND (t.tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = team_members.team_id) AND (t.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: teams Managers can manage teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage teams" ON public.teams TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: technicians Managers can manage technicians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage technicians" ON public.technicians TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: user_permissions Managers can manage user permissions in tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage user permissions in tenant" ON public.user_permissions USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.can_manage_users_in_tenant(auth.uid(), tenant_id))) WITH CHECK (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.can_manage_users_in_tenant(auth.uid(), tenant_id)));


--
-- Name: vacations Managers can manage vacations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage vacations" ON public.vacations USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: vehicles Managers can manage vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can manage vehicles" ON public.vehicles TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: customers Managers can view customers in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view customers in their tenant" ON public.customers FOR SELECT TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))));


--
-- Name: service_orders Managers can view service orders in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view service orders in their tenant" ON public.service_orders FOR SELECT TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))));


--
-- Name: technicians Managers can view technicians in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view technicians in their tenant" ON public.technicians FOR SELECT TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))));


--
-- Name: employee_epc_assignments Superadmin can manage all EPC assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all EPC assignments" ON public.employee_epc_assignments USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: employee_epi_assignments Superadmin can manage all EPI assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all EPI assignments" ON public.employee_epi_assignments USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: employee_ferramentas_assignments Superadmin can manage all Ferramentas assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all Ferramentas assignments" ON public.employee_ferramentas_assignments USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: branches Superadmin can manage all branches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all branches" ON public.branches USING (public.is_superadmin(auth.uid()));


--
-- Name: customers Superadmin can manage all customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all customers" ON public.customers USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: diario_obras Superadmin can manage all diario_obras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all diario_obras" ON public.diario_obras USING (public.is_superadmin(auth.uid()));


--
-- Name: employee_history Superadmin can manage all employee history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all employee history" ON public.employee_history USING (public.is_superadmin(auth.uid()));


--
-- Name: employees Superadmin can manage all employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all employees" ON public.employees USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: invitations Superadmin can manage all invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all invitations" ON public.invitations TO authenticated USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: leaves Superadmin can manage all leaves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all leaves" ON public.leaves USING (public.is_superadmin(auth.uid()));


--
-- Name: maintenances Superadmin can manage all maintenances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all maintenances" ON public.maintenances USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: obras Superadmin can manage all obras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all obras" ON public.obras USING (public.is_superadmin(auth.uid()));


--
-- Name: obras_progresso Superadmin can manage all obras_progresso; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all obras_progresso" ON public.obras_progresso USING (public.is_superadmin(auth.uid()));


--
-- Name: payrolls Superadmin can manage all payrolls; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all payrolls" ON public.payrolls USING (public.is_superadmin(auth.uid()));


--
-- Name: permission_templates Superadmin can manage all permission_templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all permission_templates" ON public.permission_templates USING (public.is_superadmin(auth.uid()));


--
-- Name: products Superadmin can manage all products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all products" ON public.products USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: user_roles Superadmin can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all roles" ON public.user_roles TO authenticated USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: service_orders Superadmin can manage all service_orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all service_orders" ON public.service_orders USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: stock_audits Superadmin can manage all stock audits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all stock audits" ON public.stock_audits USING (public.is_superadmin(auth.uid()));


--
-- Name: team_members Superadmin can manage all team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all team members" ON public.team_members USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: teams Superadmin can manage all teams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all teams" ON public.teams USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: technicians Superadmin can manage all technicians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all technicians" ON public.technicians USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: tenant_features Superadmin can manage all tenant_features; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all tenant_features" ON public.tenant_features USING (public.is_superadmin(auth.uid()));


--
-- Name: tenants Superadmin can manage all tenants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all tenants" ON public.tenants TO authenticated USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: vacations Superadmin can manage all vacations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all vacations" ON public.vacations USING (public.is_superadmin(auth.uid()));


--
-- Name: vehicles Superadmin can manage all vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can manage all vehicles" ON public.vehicles USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: activity_logs Superadmin can view all activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can view all activity logs" ON public.activity_logs FOR SELECT USING (public.is_superadmin(auth.uid()));


--
-- Name: customers Superadmin can view all customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can view all customers" ON public.customers FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));


--
-- Name: invoices Superadmin can view all invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can view all invoices" ON public.invoices FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));


--
-- Name: products Superadmin can view all products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can view all products" ON public.products FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));


--
-- Name: profiles Superadmin can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));


--
-- Name: service_orders Superadmin can view all service orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can view all service orders" ON public.service_orders FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));


--
-- Name: suppliers Superadmin can view all suppliers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can view all suppliers" ON public.suppliers FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));


--
-- Name: technicians Superadmin can view all technicians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin can view all technicians" ON public.technicians FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));


--
-- Name: user_permissions Superadmin full access to user_permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access to user_permissions" ON public.user_permissions USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));


--
-- Name: activity_logs System can insert logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: service_orders Technicians can update their team or created service orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Technicians can update their team or created service orders" ON public.service_orders FOR UPDATE USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.has_role(auth.uid(), 'technician'::public.app_role) AND (public.is_user_in_order_team(id, auth.uid()) OR (created_by = auth.uid())))) WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: products Technicians can view products for service orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Technicians can view products for service orders" ON public.products FOR SELECT TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.has_role(auth.uid(), 'technician'::public.app_role)));


--
-- Name: service_orders Technicians can view their team or created service orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Technicians can view their team or created service orders" ON public.service_orders FOR SELECT USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.has_role(auth.uid(), 'technician'::public.app_role) AND (public.is_user_in_order_team(id, auth.uid()) OR (created_by = auth.uid()))));


--
-- Name: employees User managers can update employees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User managers can update employees" ON public.employees FOR UPDATE USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.can_manage_users_in_tenant(auth.uid(), tenant_id))) WITH CHECK (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.can_manage_users_in_tenant(auth.uid(), tenant_id)));


--
-- Name: technicians User managers can update technicians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User managers can update technicians" ON public.technicians FOR UPDATE USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.can_manage_users_in_tenant(auth.uid(), tenant_id))) WITH CHECK (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.can_manage_users_in_tenant(auth.uid(), tenant_id)));


--
-- Name: profiles Users and managers can update profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users and managers can update profiles" ON public.profiles FOR UPDATE USING (((id = auth.uid()) OR ((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.can_manage_users_in_tenant(auth.uid(), tenant_id)) OR public.is_superadmin(auth.uid())));


--
-- Name: fechamentos_mensais Users can close months for their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can close months for their tenant" ON public.fechamentos_mensais FOR INSERT WITH CHECK ((tenant_id IN ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: fiscal_note_items Users can create fiscal note items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create fiscal note items" ON public.fiscal_note_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.fiscal_notes fn
  WHERE ((fn.id = fiscal_note_items.fiscal_note_id) AND (public.is_superadmin(auth.uid()) OR public.user_belongs_to_tenant(auth.uid(), fn.tenant_id))))));


--
-- Name: fiscal_notes Users can create fiscal notes in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create fiscal notes in their tenant" ON public.fiscal_notes FOR INSERT WITH CHECK ((public.is_superadmin(auth.uid()) OR public.user_belongs_to_tenant(auth.uid(), tenant_id)));


--
-- Name: reminders Users can create reminders for their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reminders for their tenant" ON public.reminders FOR INSERT WITH CHECK ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: stock_movements Users can create stock movements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create stock movements" ON public.stock_movements FOR INSERT WITH CHECK ((((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role))) OR public.is_superadmin(auth.uid())));


--
-- Name: diario_obras Users can delete diario_obras in their branch; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete diario_obras in their branch" ON public.diario_obras FOR DELETE USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.user_can_see_all_branches(auth.uid()) OR (branch_id IS NULL) OR (branch_id = public.get_user_branch_id(auth.uid())))));


--
-- Name: fechamentos_mensais Users can delete fechamentos_mensais of their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete fechamentos_mensais of their tenant" ON public.fechamentos_mensais FOR DELETE USING (((tenant_id = public.get_user_tenant_id(auth.uid())) OR public.is_superadmin(auth.uid())));


--
-- Name: fiscal_note_items Users can delete fiscal note items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete fiscal note items" ON public.fiscal_note_items FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.fiscal_notes fn
  WHERE ((fn.id = fiscal_note_items.fiscal_note_id) AND (public.is_superadmin(auth.uid()) OR public.user_belongs_to_tenant(auth.uid(), fn.tenant_id))))));


--
-- Name: fiscal_notes Users can delete fiscal notes in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete fiscal notes in their tenant" ON public.fiscal_notes FOR DELETE USING ((public.is_superadmin(auth.uid()) OR (public.user_belongs_to_tenant(auth.uid(), tenant_id) AND public.is_tenant_admin(auth.uid(), tenant_id))));


--
-- Name: reminders Users can delete their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reminders" ON public.reminders FOR DELETE USING ((user_id = auth.uid()));


--
-- Name: diario_obras Users can insert diario_obras in their branch; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert diario_obras in their branch" ON public.diario_obras FOR INSERT WITH CHECK (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.user_can_see_all_branches(auth.uid()) OR (branch_id IS NULL) OR (branch_id = public.get_user_branch_id(auth.uid())))));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));


--
-- Name: diario_obras Users can update diario_obras in their branch; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update diario_obras in their branch" ON public.diario_obras FOR UPDATE USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.user_can_see_all_branches(auth.uid()) OR (branch_id IS NULL) OR (branch_id = public.get_user_branch_id(auth.uid()))))) WITH CHECK (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.user_can_see_all_branches(auth.uid()) OR (branch_id IS NULL) OR (branch_id = public.get_user_branch_id(auth.uid())))));


--
-- Name: fiscal_note_items Users can update fiscal note items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update fiscal note items" ON public.fiscal_note_items FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.fiscal_notes fn
  WHERE ((fn.id = fiscal_note_items.fiscal_note_id) AND (public.is_superadmin(auth.uid()) OR public.user_belongs_to_tenant(auth.uid(), fn.tenant_id))))));


--
-- Name: fiscal_notes Users can update fiscal notes in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update fiscal notes in their tenant" ON public.fiscal_notes FOR UPDATE USING ((public.is_superadmin(auth.uid()) OR public.user_belongs_to_tenant(auth.uid(), tenant_id)));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (((tenant_id IN ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))) AND ((user_id IS NULL) OR (user_id = auth.uid()))));


--
-- Name: reminders Users can update their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reminders" ON public.reminders FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: employee_epc_assignments Users can view EPC assignments in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view EPC assignments in their tenant" ON public.employee_epc_assignments FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: employee_epi_assignments Users can view EPI assignments in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view EPI assignments in their tenant" ON public.employee_epi_assignments FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: employee_ferramentas_assignments Users can view Ferramentas assignments in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view Ferramentas assignments in their tenant" ON public.employee_ferramentas_assignments FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: asset_assignments Users can view asset assignments in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view asset assignments in their tenant" ON public.asset_assignments FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: branches Users can view branches in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view branches in their tenant" ON public.branches FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: diario_obras Users can view diario_obras in their branch or all if admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view diario_obras in their branch or all if admin" ON public.diario_obras FOR SELECT USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.user_can_see_all_branches(auth.uid()) OR (branch_id IS NULL) OR (branch_id = public.get_user_branch_id(auth.uid())))));


--
-- Name: employee_history Users can view employee history in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view employee history in their tenant" ON public.employee_history FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: employees Users can view employees in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view employees in their tenant" ON public.employees FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: fiscal_note_items Users can view fiscal note items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view fiscal note items" ON public.fiscal_note_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.fiscal_notes fn
  WHERE ((fn.id = fiscal_note_items.fiscal_note_id) AND (public.is_superadmin(auth.uid()) OR public.user_belongs_to_tenant(auth.uid(), fn.tenant_id))))));


--
-- Name: fiscal_notes Users can view fiscal notes from their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view fiscal notes from their tenant" ON public.fiscal_notes FOR SELECT USING ((public.is_superadmin(auth.uid()) OR public.user_belongs_to_tenant(auth.uid(), tenant_id)));


--
-- Name: fuel_logs Users can view fuel logs in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view fuel logs in their tenant" ON public.fuel_logs FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: invoice_items Users can view invoice items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view invoice items" ON public.invoice_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (i.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: leaves Users can view leaves in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view leaves in their tenant" ON public.leaves FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: activity_logs Users can view logs in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view logs in their tenant" ON public.activity_logs FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: maintenances Users can view maintenances in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view maintenances in their tenant" ON public.maintenances FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: obras Users can view obras in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view obras in their tenant" ON public.obras FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: obras_progresso Users can view obras_progresso in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view obras_progresso in their tenant" ON public.obras_progresso FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: payrolls Users can view payrolls in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view payrolls in their tenant" ON public.payrolls FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: pdv_cash_operations Users can view pdv cash operations of their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view pdv cash operations of their tenant" ON public.pdv_cash_operations FOR SELECT USING ((public.user_belongs_to_tenant(tenant_id, auth.uid()) OR public.is_superadmin(auth.uid())));


--
-- Name: pdv_operators Users can view pdv operators of their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view pdv operators of their tenant" ON public.pdv_operators FOR SELECT USING ((public.user_belongs_to_tenant(tenant_id, auth.uid()) OR public.is_superadmin(auth.uid())));


--
-- Name: pdv_sale_items Users can view pdv sale items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view pdv sale items" ON public.pdv_sale_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.pdv_sales s
  WHERE ((s.id = pdv_sale_items.sale_id) AND (public.user_belongs_to_tenant(s.tenant_id, auth.uid()) OR public.is_superadmin(auth.uid()))))));


--
-- Name: pdv_sales Users can view pdv sales of their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view pdv sales of their tenant" ON public.pdv_sales FOR SELECT USING ((public.user_belongs_to_tenant(tenant_id, auth.uid()) OR public.is_superadmin(auth.uid())));


--
-- Name: pdv_sessions Users can view pdv sessions of their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view pdv sessions of their tenant" ON public.pdv_sessions FOR SELECT USING ((public.user_belongs_to_tenant(tenant_id, auth.uid()) OR public.is_superadmin(auth.uid())));


--
-- Name: pdv_terminals Users can view pdv terminals of their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view pdv terminals of their tenant" ON public.pdv_terminals FOR SELECT USING ((public.user_belongs_to_tenant(tenant_id, auth.uid()) OR public.is_superadmin(auth.uid())));


--
-- Name: position_categories Users can view position categories in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view position categories in their tenant" ON public.position_categories FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: profiles Users can view profiles in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view profiles in their tenant" ON public.profiles FOR SELECT TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) OR (id = auth.uid())));


--
-- Name: reminders Users can view reminders from their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view reminders from their tenant" ON public.reminders FOR SELECT USING ((tenant_id IN ( SELECT user_roles.tenant_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: user_roles Users can view roles in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view roles in their tenant" ON public.user_roles FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: serial_numbers Users can view serial numbers in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view serial numbers in their tenant" ON public.serial_numbers FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: service_order_items Users can view service order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view service order items" ON public.service_order_items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.service_orders so
  WHERE ((so.id = service_order_items.service_order_id) AND (so.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: service_order_technicians Users can view service order technicians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view service order technicians" ON public.service_order_technicians FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.service_orders so
  WHERE ((so.id = service_order_technicians.service_order_id) AND (so.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: stock_audits Users can view stock audits in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view stock audits in their tenant" ON public.stock_audits FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: stock_movements Users can view stock movements in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view stock movements in their tenant" ON public.stock_movements FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: team_members Users can view team members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view team members" ON public.team_members FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.teams t
  WHERE ((t.id = team_members.team_id) AND (t.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: teams Users can view teams in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view teams in their tenant" ON public.teams FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: permission_templates Users can view templates in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view templates in their tenant" ON public.permission_templates FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: user_permissions Users can view their own permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own permissions" ON public.user_permissions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: tenants Users can view their own tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tenant" ON public.tenants FOR SELECT TO authenticated USING ((id = public.get_user_tenant_id(auth.uid())));


--
-- Name: notifications Users can view their tenant notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their tenant notifications" ON public.notifications FOR SELECT USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: fechamentos_mensais Users can view their tenant's closed months; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their tenant's closed months" ON public.fechamentos_mensais FOR SELECT USING ((tenant_id IN ( SELECT profiles.tenant_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))));


--
-- Name: vacations Users can view vacations in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view vacations in their tenant" ON public.vacations FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: vehicles Users can view vehicles in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view vehicles in their tenant" ON public.vehicles FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: invoices Warehouse can view invoices in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Warehouse can view invoices in their tenant" ON public.invoices FOR SELECT TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role))));


--
-- Name: products Warehouse can view products in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Warehouse can view products in their tenant" ON public.products FOR SELECT TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role))));


--
-- Name: suppliers Warehouse can view suppliers in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Warehouse can view suppliers in their tenant" ON public.suppliers FOR SELECT TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role) OR public.has_role(auth.uid(), 'warehouse'::public.app_role))));


--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: asset_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: diario_obras; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.diario_obras ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_epc_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_epc_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_epi_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_epi_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_ferramentas_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_ferramentas_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: employee_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee_history ENABLE ROW LEVEL SECURITY;

--
-- Name: employees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

--
-- Name: fechamentos_mensais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fechamentos_mensais ENABLE ROW LEVEL SECURITY;

--
-- Name: fiscal_note_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fiscal_note_items ENABLE ROW LEVEL SECURITY;

--
-- Name: fiscal_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fiscal_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: fuel_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: invoice_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: leaves; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

--
-- Name: maintenances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: obras; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

--
-- Name: obras_progresso; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.obras_progresso ENABLE ROW LEVEL SECURITY;

--
-- Name: payrolls; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;

--
-- Name: pdv_cash_operations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pdv_cash_operations ENABLE ROW LEVEL SECURITY;

--
-- Name: pdv_operators; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pdv_operators ENABLE ROW LEVEL SECURITY;

--
-- Name: pdv_sale_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pdv_sale_items ENABLE ROW LEVEL SECURITY;

--
-- Name: pdv_sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pdv_sales ENABLE ROW LEVEL SECURITY;

--
-- Name: pdv_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pdv_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: pdv_terminals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pdv_terminals ENABLE ROW LEVEL SECURITY;

--
-- Name: permission_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: position_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.position_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: serial_numbers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;

--
-- Name: service_order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: service_order_technicians; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_order_technicians ENABLE ROW LEVEL SECURITY;

--
-- Name: service_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_audits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_audits ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: teams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

--
-- Name: technicians; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

--
-- Name: tenant_features; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: user_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: vacations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;