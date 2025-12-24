export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_assignments: {
        Row: {
          asset_type: string
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          expected_return: string | null
          id: string
          notes: string | null
          product_id: string | null
          quantity: number | null
          returned_at: string | null
          serial_number_id: string | null
          technician_id: string
          tenant_id: string
          vehicle_id: string | null
        }
        Insert: {
          asset_type: string
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expected_return?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number | null
          returned_at?: string | null
          serial_number_id?: string | null
          technician_id: string
          tenant_id: string
          vehicle_id?: string | null
        }
        Update: {
          asset_type?: string
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expected_return?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number | null
          returned_at?: string | null
          serial_number_id?: string | null
          technician_id?: string
          tenant_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          code: string | null
          complement: string | null
          created_at: string | null
          email: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          is_active: boolean | null
          is_main: boolean | null
          logo_dark_url: string | null
          logo_url: string | null
          name: string
          neighborhood: string | null
          number: string | null
          phone: string | null
          razao_social: string | null
          state: string | null
          tenant_id: string
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          code?: string | null
          complement?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          is_active?: boolean | null
          is_main?: boolean | null
          logo_dark_url?: string | null
          logo_url?: string | null
          name: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          razao_social?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          code?: string | null
          complement?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          is_active?: boolean | null
          is_main?: boolean | null
          logo_dark_url?: string | null
          logo_url?: string | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          razao_social?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          branch_id: string | null
          city: string | null
          complement: string | null
          contact_name: string | null
          created_at: string | null
          document: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          neighborhood: string | null
          notes: string | null
          number: string | null
          phone: string | null
          phone2: string | null
          state: string | null
          tenant_id: string
          type: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          city?: string | null
          complement?: string | null
          contact_name?: string | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          phone2?: string | null
          state?: string | null
          tenant_id: string
          type?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          city?: string | null
          complement?: string | null
          contact_name?: string | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          phone2?: string | null
          state?: string | null
          tenant_id?: string
          type?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_obras: {
        Row: {
          atividades_realizadas: string | null
          branch_id: string | null
          clima: string | null
          clima_manha: string | null
          clima_noite: string | null
          clima_tarde: string | null
          created_at: string
          data: string
          equipe_assinaturas: Json | null
          equipe_manha: string | null
          equipe_presente: number | null
          equipe_tarde: string | null
          etapa_id: string | null
          fotos: Json | null
          hora_fim: string | null
          hora_fim_manha: string | null
          hora_fim_tarde: string | null
          hora_inicio: string | null
          hora_inicio_manha: string | null
          hora_inicio_tarde: string | null
          id: string
          km_ida_manha: string | null
          km_ida_tarde: string | null
          km_rodado_manha: string | null
          km_rodado_tarde: string | null
          km_volta_manha: string | null
          km_volta_tarde: string | null
          materiais_utilizados: string | null
          motorista_manha: string | null
          motorista_tarde: string | null
          obra_id: string | null
          observacao_fiscalizacao: string | null
          ocorrencias: string | null
          placa_manha: string | null
          placa_tarde: string | null
          registrado_por: string | null
          responsavel_devolucao_materiais: string | null
          responsavel_entrega_materiais: string | null
          status: string
          supervisor_signature: string | null
          tenant_id: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          veiculo_manha: string | null
          veiculo_tarde: string | null
        }
        Insert: {
          atividades_realizadas?: string | null
          branch_id?: string | null
          clima?: string | null
          clima_manha?: string | null
          clima_noite?: string | null
          clima_tarde?: string | null
          created_at?: string
          data?: string
          equipe_assinaturas?: Json | null
          equipe_manha?: string | null
          equipe_presente?: number | null
          equipe_tarde?: string | null
          etapa_id?: string | null
          fotos?: Json | null
          hora_fim?: string | null
          hora_fim_manha?: string | null
          hora_fim_tarde?: string | null
          hora_inicio?: string | null
          hora_inicio_manha?: string | null
          hora_inicio_tarde?: string | null
          id?: string
          km_ida_manha?: string | null
          km_ida_tarde?: string | null
          km_rodado_manha?: string | null
          km_rodado_tarde?: string | null
          km_volta_manha?: string | null
          km_volta_tarde?: string | null
          materiais_utilizados?: string | null
          motorista_manha?: string | null
          motorista_tarde?: string | null
          obra_id?: string | null
          observacao_fiscalizacao?: string | null
          ocorrencias?: string | null
          placa_manha?: string | null
          placa_tarde?: string | null
          registrado_por?: string | null
          responsavel_devolucao_materiais?: string | null
          responsavel_entrega_materiais?: string | null
          status?: string
          supervisor_signature?: string | null
          tenant_id: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          veiculo_manha?: string | null
          veiculo_tarde?: string | null
        }
        Update: {
          atividades_realizadas?: string | null
          branch_id?: string | null
          clima?: string | null
          clima_manha?: string | null
          clima_noite?: string | null
          clima_tarde?: string | null
          created_at?: string
          data?: string
          equipe_assinaturas?: Json | null
          equipe_manha?: string | null
          equipe_presente?: number | null
          equipe_tarde?: string | null
          etapa_id?: string | null
          fotos?: Json | null
          hora_fim?: string | null
          hora_fim_manha?: string | null
          hora_fim_tarde?: string | null
          hora_inicio?: string | null
          hora_inicio_manha?: string | null
          hora_inicio_tarde?: string | null
          id?: string
          km_ida_manha?: string | null
          km_ida_tarde?: string | null
          km_rodado_manha?: string | null
          km_rodado_tarde?: string | null
          km_volta_manha?: string | null
          km_volta_tarde?: string | null
          materiais_utilizados?: string | null
          motorista_manha?: string | null
          motorista_tarde?: string | null
          obra_id?: string | null
          observacao_fiscalizacao?: string | null
          ocorrencias?: string | null
          placa_manha?: string | null
          placa_tarde?: string | null
          registrado_por?: string | null
          responsavel_devolucao_materiais?: string | null
          responsavel_entrega_materiais?: string | null
          status?: string
          supervisor_signature?: string | null
          tenant_id?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          veiculo_manha?: string | null
          veiculo_tarde?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diario_obras_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_obras_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "obra_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_obras_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_obras_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_obras_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_service_orders: {
        Row: {
          atividades_realizadas: string | null
          branch_id: string | null
          created_at: string
          data: string
          etapa_id: string | null
          fotos: Json | null
          id: string
          materiais_utilizados: string | null
          observacao_fiscalizacao: string | null
          ocorrencias: string | null
          registrado_por: string | null
          service_order_id: string
          status: string
          supervisor_signature: string | null
          tenant_id: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          atividades_realizadas?: string | null
          branch_id?: string | null
          created_at?: string
          data?: string
          etapa_id?: string | null
          fotos?: Json | null
          id?: string
          materiais_utilizados?: string | null
          observacao_fiscalizacao?: string | null
          ocorrencias?: string | null
          registrado_por?: string | null
          service_order_id: string
          status?: string
          supervisor_signature?: string | null
          tenant_id: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          atividades_realizadas?: string | null
          branch_id?: string | null
          created_at?: string
          data?: string
          etapa_id?: string | null
          fotos?: Json | null
          id?: string
          materiais_utilizados?: string | null
          observacao_fiscalizacao?: string | null
          ocorrencias?: string | null
          registrado_por?: string | null
          service_order_id?: string
          status?: string
          supervisor_signature?: string | null
          tenant_id?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diario_service_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_service_orders_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "service_order_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_service_orders_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_service_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diario_service_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_epc_assignments: {
        Row: {
          condition_delivery: string | null
          condition_return: string | null
          created_at: string | null
          delivery_date: string
          description: string
          employee_id: string
          id: string
          location: string | null
          notes: string | null
          product_id: string | null
          quantity: number
          return_date: string | null
          return_reason: string | null
          serial_number: string | null
          signature_url: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          condition_delivery?: string | null
          condition_return?: string | null
          created_at?: string | null
          delivery_date?: string
          description: string
          employee_id: string
          id?: string
          location?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          return_date?: string | null
          return_reason?: string | null
          serial_number?: string | null
          signature_url?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          condition_delivery?: string | null
          condition_return?: string | null
          created_at?: string | null
          delivery_date?: string
          description?: string
          employee_id?: string
          id?: string
          location?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          return_date?: string | null
          return_reason?: string | null
          serial_number?: string | null
          signature_url?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_epc_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_epc_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_epc_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_epc_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_epi_assignments: {
        Row: {
          ca_number: string | null
          created_at: string | null
          delivery_date: string
          description: string
          employee_id: string
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          return_date: string | null
          return_reason: string | null
          signature_url: string | null
          size: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          ca_number?: string | null
          created_at?: string | null
          delivery_date?: string
          description: string
          employee_id: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          return_date?: string | null
          return_reason?: string | null
          signature_url?: string | null
          size?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          ca_number?: string | null
          created_at?: string | null
          delivery_date?: string
          description?: string
          employee_id?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          return_date?: string | null
          return_reason?: string | null
          signature_url?: string | null
          size?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_epi_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_epi_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_epi_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_epi_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_ferramentas_assignments: {
        Row: {
          condition_delivery: string | null
          condition_return: string | null
          created_at: string | null
          delivery_date: string
          description: string
          employee_id: string
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          return_date: string | null
          return_reason: string | null
          serial_number: string | null
          signature_url: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          condition_delivery?: string | null
          condition_return?: string | null
          created_at?: string | null
          delivery_date?: string
          description: string
          employee_id: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          return_date?: string | null
          return_reason?: string | null
          serial_number?: string | null
          signature_url?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          condition_delivery?: string | null
          condition_return?: string | null
          created_at?: string | null
          delivery_date?: string
          description?: string
          employee_id?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          return_date?: string | null
          return_reason?: string | null
          serial_number?: string | null
          signature_url?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_ferramentas_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_ferramentas_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_ferramentas_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_ferramentas_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_history: {
        Row: {
          created_at: string | null
          description: string | null
          employee_id: string
          event_date: string
          event_type: string
          id: string
          new_value: string | null
          old_value: string | null
          registered_by: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          employee_id: string
          event_date: string
          event_type: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          registered_by?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          employee_id?: string
          event_date?: string
          event_type?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          registered_by?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          base_salary: number | null
          birth_date: string | null
          blusa_numero: string | null
          branch_id: string | null
          calca_numero: string | null
          calcado_numero: string | null
          city: string | null
          complement: string | null
          contract_type: Database["public"]["Enums"]["contract_type"] | null
          cpf: string | null
          created_at: string | null
          department: string | null
          dependents: Json | null
          documents: Json | null
          email: string | null
          gender: string | null
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_technician: boolean | null
          marital_status: string | null
          name: string
          nationality: string | null
          neighborhood: string | null
          notes: string | null
          number: string | null
          phone: string | null
          phone2: string | null
          photo_url: string | null
          pix_key: string | null
          position: string | null
          registration_number: string | null
          rg: string | null
          state: string | null
          status: Database["public"]["Enums"]["employee_status"] | null
          tenant_id: string
          termination_date: string | null
          termination_reason: string | null
          updated_at: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          base_salary?: number | null
          birth_date?: string | null
          blusa_numero?: string | null
          branch_id?: string | null
          calca_numero?: string | null
          calcado_numero?: string | null
          city?: string | null
          complement?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          cpf?: string | null
          created_at?: string | null
          department?: string | null
          dependents?: Json | null
          documents?: Json | null
          email?: string | null
          gender?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_technician?: boolean | null
          marital_status?: string | null
          name: string
          nationality?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          phone2?: string | null
          photo_url?: string | null
          pix_key?: string | null
          position?: string | null
          registration_number?: string | null
          rg?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          tenant_id: string
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          base_salary?: number | null
          birth_date?: string | null
          blusa_numero?: string | null
          branch_id?: string | null
          calca_numero?: string | null
          calcado_numero?: string | null
          city?: string | null
          complement?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          cpf?: string | null
          created_at?: string | null
          department?: string | null
          dependents?: Json | null
          documents?: Json | null
          email?: string | null
          gender?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_technician?: boolean | null
          marital_status?: string | null
          name?: string
          nationality?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          phone2?: string | null
          photo_url?: string | null
          pix_key?: string | null
          position?: string | null
          registration_number?: string | null
          rg?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          tenant_id?: string
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamentos_mensais: {
        Row: {
          closed_at: string
          closed_by: string | null
          coupons_count: number | null
          created_at: string
          id: string
          reference_month: number
          reference_year: number
          suppliers_count: number | null
          tenant_id: string
          total_value: number | null
        }
        Insert: {
          closed_at?: string
          closed_by?: string | null
          coupons_count?: number | null
          created_at?: string
          id?: string
          reference_month: number
          reference_year: number
          suppliers_count?: number | null
          tenant_id: string
          total_value?: number | null
        }
        Update: {
          closed_at?: string
          closed_by?: string | null
          coupons_count?: number | null
          created_at?: string
          id?: string
          reference_month?: number
          reference_year?: number
          suppliers_count?: number | null
          tenant_id?: string
          total_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_mensais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fechamentos_mensais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_coupons: {
        Row: {
          branch_id: string | null
          coupon_number: string
          created_at: string
          created_by: string | null
          id: string
          issue_date: string
          notes: string | null
          supplier_id: string | null
          tenant_id: string
          total_value: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          coupon_number: string
          created_at?: string
          created_by?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          supplier_id?: string | null
          tenant_id: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          coupon_number?: string
          created_at?: string
          created_by?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          supplier_id?: string | null
          tenant_id?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_coupons_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_coupons_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_note_items: {
        Row: {
          cfop: string | null
          created_at: string
          description: string
          discount: number | null
          fiscal_note_id: string
          id: string
          ncm: string | null
          product_id: string | null
          quantity: number
          total_price: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          cfop?: string | null
          created_at?: string
          description: string
          discount?: number | null
          fiscal_note_id: string
          id?: string
          ncm?: string | null
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit?: string | null
          unit_price?: number
        }
        Update: {
          cfop?: string | null
          created_at?: string
          description?: string
          discount?: number | null
          fiscal_note_id?: string
          id?: string
          ncm?: string | null
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_note_items_fiscal_note_id_fkey"
            columns: ["fiscal_note_id"]
            isOneToOne: false
            referencedRelation: "fiscal_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_note_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_notes: {
        Row: {
          access_key: string | null
          branch_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          competence_date: string | null
          created_at: string
          created_by: string | null
          customer_document: string | null
          customer_id: string | null
          customer_name: string | null
          deductions: number | null
          discount_value: number | null
          freight_value: number | null
          id: string
          iss_rate: number | null
          iss_value: number | null
          issue_date: string
          note_type: string
          notes: string | null
          numero: string
          operation_nature: string | null
          pdf_url: string | null
          products_value: number | null
          protocol_number: string | null
          serie: string | null
          service_code: string | null
          service_description: string | null
          status: string
          tenant_id: string
          total_value: number
          updated_at: string
          xml_content: string | null
        }
        Insert: {
          access_key?: string | null
          branch_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          competence_date?: string | null
          created_at?: string
          created_by?: string | null
          customer_document?: string | null
          customer_id?: string | null
          customer_name?: string | null
          deductions?: number | null
          discount_value?: number | null
          freight_value?: number | null
          id?: string
          iss_rate?: number | null
          iss_value?: number | null
          issue_date?: string
          note_type: string
          notes?: string | null
          numero: string
          operation_nature?: string | null
          pdf_url?: string | null
          products_value?: number | null
          protocol_number?: string | null
          serie?: string | null
          service_code?: string | null
          service_description?: string | null
          status?: string
          tenant_id: string
          total_value?: number
          updated_at?: string
          xml_content?: string | null
        }
        Update: {
          access_key?: string | null
          branch_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          competence_date?: string | null
          created_at?: string
          created_by?: string | null
          customer_document?: string | null
          customer_id?: string | null
          customer_name?: string | null
          deductions?: number | null
          discount_value?: number | null
          freight_value?: number | null
          id?: string
          iss_rate?: number | null
          iss_value?: number | null
          issue_date?: string
          note_type?: string
          notes?: string | null
          numero?: string
          operation_nature?: string | null
          pdf_url?: string | null
          products_value?: number | null
          protocol_number?: string | null
          serie?: string | null
          service_code?: string | null
          service_description?: string | null
          status?: string
          tenant_id?: string
          total_value?: number
          updated_at?: string
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_notes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          fuel_type: string | null
          full_tank: boolean | null
          id: string
          km_at_fill: number
          liters: number
          notes: string | null
          price_per_liter: number
          supplier_id: string | null
          tenant_id: string
          total_cost: number
          vehicle_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          fuel_type?: string | null
          full_tank?: boolean | null
          id?: string
          km_at_fill: number
          liters: number
          notes?: string | null
          price_per_liter: number
          supplier_id?: string | null
          tenant_id: string
          total_cost: number
          vehicle_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          fuel_type?: string | null
          full_tank?: boolean | null
          id?: string
          km_at_fill?: number
          liters?: number
          notes?: string | null
          price_per_liter?: number
          supplier_id?: string | null
          tenant_id?: string
          total_cost?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          cfop: string | null
          created_at: string | null
          id: string
          invoice_id: string
          ncm: string | null
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          cfop?: string | null
          created_at?: string | null
          id?: string
          invoice_id: string
          ncm?: string | null
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          cfop?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string
          ncm?: string | null
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          discount: number | null
          entry_date: string | null
          freight: number | null
          id: string
          invoice_key: string | null
          invoice_number: string
          invoice_series: string | null
          issue_date: string
          notes: string | null
          pdf_url: string | null
          supplier_id: string | null
          taxes: number | null
          tenant_id: string
          total_value: number | null
          updated_at: string | null
          xml_content: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          entry_date?: string | null
          freight?: number | null
          id?: string
          invoice_key?: string | null
          invoice_number: string
          invoice_series?: string | null
          issue_date: string
          notes?: string | null
          pdf_url?: string | null
          supplier_id?: string | null
          taxes?: number | null
          tenant_id: string
          total_value?: number | null
          updated_at?: string | null
          xml_content?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          entry_date?: string | null
          freight?: number | null
          id?: string
          invoice_key?: string | null
          invoice_number?: string
          invoice_series?: string | null
          issue_date?: string
          notes?: string | null
          pdf_url?: string | null
          supplier_id?: string | null
          taxes?: number | null
          tenant_id?: string
          total_value?: number | null
          updated_at?: string | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          cid: string | null
          created_at: string | null
          crm: string | null
          days: number
          doctor_name: string | null
          document_url: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          notes: string | null
          registered_by: string | null
          start_date: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cid?: string | null
          created_at?: string | null
          crm?: string | null
          days: number
          doctor_name?: string | null
          document_url?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          notes?: string | null
          registered_by?: string | null
          start_date: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cid?: string | null
          created_at?: string | null
          crm?: string | null
          days?: number
          doctor_name?: string | null
          document_url?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          notes?: string | null
          registered_by?: string | null
          start_date?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenances: {
        Row: {
          branch_id: string | null
          completed_date: string | null
          completed_km: number | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          notes: string | null
          scheduled_date: string | null
          scheduled_km: number | null
          status: Database["public"]["Enums"]["maintenance_status"] | null
          supplier: string | null
          tenant_id: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          branch_id?: string | null
          completed_date?: string | null
          completed_km?: number | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          notes?: string | null
          scheduled_date?: string | null
          scheduled_km?: number | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          supplier?: string | null
          tenant_id: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          branch_id?: string | null
          completed_date?: string | null
          completed_km?: number | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"]
          notes?: string | null
          scheduled_date?: string | null
          scheduled_km?: number | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          supplier?: string | null
          tenant_id?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenances_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenances_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          branch_id: string | null
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          priority: string
          read_at: string | null
          tenant_id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          priority?: string
          read_at?: string | null
          tenant_id: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          priority?: string
          read_at?: string | null
          tenant_id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_etapas: {
        Row: {
          created_at: string
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          descricao: string | null
          id: string
          nome: string
          notas: string | null
          obra_id: string
          ordem: number
          percentual_peso: number
          responsavel_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          id?: string
          nome: string
          notas?: string | null
          obra_id: string
          ordem?: number
          percentual_peso?: number
          responsavel_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          notas?: string | null
          obra_id?: string
          ordem?: number
          percentual_peso?: number
          responsavel_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_etapas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_etapas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_etapas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_etapas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          branch_id: string | null
          cep: string | null
          cidade: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          data_conclusao: string | null
          data_inicio: string | null
          descricao: string | null
          endereco: string | null
          estado: string | null
          id: string
          image_url: string | null
          nome: string
          notas: string | null
          previsao_termino: string | null
          progresso: number
          responsavel_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          valor_contrato: number | null
        }
        Insert: {
          branch_id?: string | null
          cep?: string | null
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          image_url?: string | null
          nome: string
          notas?: string | null
          previsao_termino?: string | null
          progresso?: number
          responsavel_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          valor_contrato?: number | null
        }
        Update: {
          branch_id?: string | null
          cep?: string | null
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          image_url?: string | null
          nome?: string
          notas?: string | null
          previsao_termino?: string | null
          progresso?: number
          responsavel_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          valor_contrato?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obras_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      obras_progresso: {
        Row: {
          created_at: string
          data: string
          descricao: string | null
          id: string
          obra_id: string
          percentual_anterior: number
          percentual_atual: number
          registrado_por: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          obra_id: string
          percentual_anterior?: number
          percentual_atual: number
          registrado_por?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          obra_id?: string
          percentual_anterior?: number
          percentual_atual?: number
          registrado_por?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_progresso_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_progresso_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_progresso_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payrolls: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_salary: number | null
          bonuses: number | null
          calculated_at: string | null
          commissions: number | null
          created_at: string | null
          discounts_details: Json | null
          earnings_details: Json | null
          employee_id: string
          fgts_rate: number | null
          fgts_value: number | null
          healthcare_discount: number | null
          id: string
          inss_rate: number | null
          inss_value: number | null
          irrf_rate: number | null
          irrf_value: number | null
          meal_discount: number | null
          net_salary: number | null
          night_shift_hours: number | null
          night_shift_value: number | null
          notes: string | null
          other_discounts: number | null
          other_earnings: number | null
          overtime_hours: number | null
          overtime_value: number | null
          paid_at: string | null
          reference_month: number
          reference_year: number
          status: string | null
          tenant_id: string
          total_discounts: number | null
          total_earnings: number | null
          transport_discount: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_salary?: number | null
          bonuses?: number | null
          calculated_at?: string | null
          commissions?: number | null
          created_at?: string | null
          discounts_details?: Json | null
          earnings_details?: Json | null
          employee_id: string
          fgts_rate?: number | null
          fgts_value?: number | null
          healthcare_discount?: number | null
          id?: string
          inss_rate?: number | null
          inss_value?: number | null
          irrf_rate?: number | null
          irrf_value?: number | null
          meal_discount?: number | null
          net_salary?: number | null
          night_shift_hours?: number | null
          night_shift_value?: number | null
          notes?: string | null
          other_discounts?: number | null
          other_earnings?: number | null
          overtime_hours?: number | null
          overtime_value?: number | null
          paid_at?: string | null
          reference_month: number
          reference_year: number
          status?: string | null
          tenant_id: string
          total_discounts?: number | null
          total_earnings?: number | null
          transport_discount?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_salary?: number | null
          bonuses?: number | null
          calculated_at?: string | null
          commissions?: number | null
          created_at?: string | null
          discounts_details?: Json | null
          earnings_details?: Json | null
          employee_id?: string
          fgts_rate?: number | null
          fgts_value?: number | null
          healthcare_discount?: number | null
          id?: string
          inss_rate?: number | null
          inss_value?: number | null
          irrf_rate?: number | null
          irrf_value?: number | null
          meal_discount?: number | null
          net_salary?: number | null
          night_shift_hours?: number | null
          night_shift_value?: number | null
          notes?: string | null
          other_discounts?: number | null
          other_earnings?: number | null
          overtime_hours?: number | null
          overtime_value?: number | null
          paid_at?: string | null
          reference_month?: number
          reference_year?: number
          status?: string | null
          tenant_id?: string
          total_discounts?: number | null
          total_earnings?: number | null
          transport_discount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payrolls_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payrolls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payrolls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pdv_cash_operations: {
        Row: {
          amount: number
          created_at: string
          id: string
          operation_type: string
          operator_id: string
          reason: string | null
          session_id: string
          tenant_id: string
          terminal_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          operation_type: string
          operator_id: string
          reason?: string | null
          session_id: string
          tenant_id: string
          terminal_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          operation_type?: string
          operator_id?: string
          reason?: string | null
          session_id?: string
          tenant_id?: string
          terminal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdv_cash_operations_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "pdv_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_cash_operations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pdv_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_cash_operations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_cash_operations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_cash_operations_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "pdv_terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      pdv_operators: {
        Row: {
          can_cancel_sale: boolean | null
          can_give_discount: boolean | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_discount_percent: number | null
          name: string
          pin: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          can_cancel_sale?: boolean | null
          can_give_discount?: boolean | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_percent?: number | null
          name: string
          pin: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          can_cancel_sale?: boolean | null
          can_give_discount?: boolean | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_percent?: number | null
          name?: string
          pin?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdv_operators_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_operators_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pdv_sale_items: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pdv_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pdv_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pdv_sales: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cash_received: number | null
          change_given: number | null
          created_at: string | null
          discount: number | null
          id: string
          operator_id: string
          payment_method: string
          sale_number: number
          session_id: string
          status: string | null
          tenant_id: string
          terminal_id: string
          total: number
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cash_received?: number | null
          change_given?: number | null
          created_at?: string | null
          discount?: number | null
          id?: string
          operator_id: string
          payment_method: string
          sale_number?: number
          session_id: string
          status?: string | null
          tenant_id: string
          terminal_id: string
          total: number
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cash_received?: number | null
          change_given?: number | null
          created_at?: string | null
          discount?: number | null
          id?: string
          operator_id?: string
          payment_method?: string
          sale_number?: number
          session_id?: string
          status?: string | null
          tenant_id?: string
          terminal_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pdv_sales_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "pdv_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_sales_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "pdv_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_sales_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pdv_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_sales_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_sales_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "pdv_terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      pdv_sessions: {
        Row: {
          closed_at: string | null
          difference: number | null
          final_value: number | null
          id: string
          initial_value: number
          notes: string | null
          opened_at: string
          operator_id: string
          sales_count: number | null
          status: string | null
          tenant_id: string
          terminal_id: string
          total_credito: number | null
          total_debito: number | null
          total_dinheiro: number | null
          total_pix: number | null
          total_sales: number | null
        }
        Insert: {
          closed_at?: string | null
          difference?: number | null
          final_value?: number | null
          id?: string
          initial_value?: number
          notes?: string | null
          opened_at?: string
          operator_id: string
          sales_count?: number | null
          status?: string | null
          tenant_id: string
          terminal_id: string
          total_credito?: number | null
          total_debito?: number | null
          total_dinheiro?: number | null
          total_pix?: number | null
          total_sales?: number | null
        }
        Update: {
          closed_at?: string | null
          difference?: number | null
          final_value?: number | null
          id?: string
          initial_value?: number
          notes?: string | null
          opened_at?: string
          operator_id?: string
          sales_count?: number | null
          status?: string | null
          tenant_id?: string
          terminal_id?: string
          total_credito?: number | null
          total_debito?: number | null
          total_dinheiro?: number | null
          total_pix?: number | null
          total_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pdv_sessions_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "pdv_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_sessions_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "pdv_terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      pdv_terminals: {
        Row: {
          code: string
          created_at: string | null
          current_operator_id: string | null
          id: string
          initial_value: number | null
          is_active: boolean | null
          last_activity_at: string | null
          name: string
          opened_at: string | null
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          current_operator_id?: string | null
          id?: string
          initial_value?: number | null
          is_active?: boolean | null
          last_activity_at?: string | null
          name: string
          opened_at?: string | null
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          current_operator_id?: string | null
          id?: string
          initial_value?: number | null
          is_active?: boolean | null
          last_activity_at?: string | null
          name?: string
          opened_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdv_terminals_current_operator_id_fkey"
            columns: ["current_operator_id"]
            isOneToOne: false
            referencedRelation: "pdv_operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_terminals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdv_terminals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_templates: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          can_manage_users: boolean | null
          can_view_costs: boolean | null
          can_view_reports: boolean | null
          color: string | null
          created_at: string | null
          default_dashboard: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          page_customers: boolean | null
          page_dashboard: boolean | null
          page_diario_obras: boolean | null
          page_fechamento: boolean | null
          page_fleet: boolean | null
          page_hr: boolean | null
          page_invoices: boolean | null
          page_movimentacao: boolean | null
          page_obras: boolean | null
          page_reports: boolean | null
          page_service_orders: boolean | null
          page_settings: boolean | null
          page_stock: boolean | null
          page_suppliers: boolean | null
          page_teams: boolean | null
          role: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_manage_users?: boolean | null
          can_view_costs?: boolean | null
          can_view_reports?: boolean | null
          color?: string | null
          created_at?: string | null
          default_dashboard?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          page_customers?: boolean | null
          page_dashboard?: boolean | null
          page_diario_obras?: boolean | null
          page_fechamento?: boolean | null
          page_fleet?: boolean | null
          page_hr?: boolean | null
          page_invoices?: boolean | null
          page_movimentacao?: boolean | null
          page_obras?: boolean | null
          page_reports?: boolean | null
          page_service_orders?: boolean | null
          page_settings?: boolean | null
          page_stock?: boolean | null
          page_suppliers?: boolean | null
          page_teams?: boolean | null
          role?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_manage_users?: boolean | null
          can_view_costs?: boolean | null
          can_view_reports?: boolean | null
          color?: string | null
          created_at?: string | null
          default_dashboard?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          page_customers?: boolean | null
          page_dashboard?: boolean | null
          page_diario_obras?: boolean | null
          page_fechamento?: boolean | null
          page_fleet?: boolean | null
          page_hr?: boolean | null
          page_invoices?: boolean | null
          page_movimentacao?: boolean | null
          page_obras?: boolean | null
          page_reports?: boolean | null
          page_service_orders?: boolean | null
          page_settings?: boolean | null
          page_stock?: boolean | null
          page_suppliers?: boolean | null
          page_teams?: boolean | null
          role?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      position_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_driver: boolean | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_driver?: boolean | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_driver?: boolean | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          acquisition_date: string | null
          applicable_norm: string | null
          barcode: string | null
          branch_id: string | null
          brand: string | null
          ca_number: string | null
          ca_validity: string | null
          category: Database["public"]["Enums"]["stock_category"]
          code: string
          condition: string | null
          cost_price: number | null
          created_at: string | null
          current_stock: number | null
          description: string | null
          dimensions: string | null
          epc_type: string | null
          epi_type: string | null
          equipment_type: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_serialized: boolean | null
          location: string | null
          mac_address: string | null
          material_type: string | null
          max_stock: number | null
          min_stock: number | null
          model: string | null
          name: string
          power: string | null
          sale_price: number | null
          size: string | null
          tenant_id: string
          tool_type: string | null
          unit: string | null
          updated_at: string | null
          validity_date: string | null
          voltage: string | null
          warranty_until: string | null
        }
        Insert: {
          acquisition_date?: string | null
          applicable_norm?: string | null
          barcode?: string | null
          branch_id?: string | null
          brand?: string | null
          ca_number?: string | null
          ca_validity?: string | null
          category: Database["public"]["Enums"]["stock_category"]
          code: string
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          dimensions?: string | null
          epc_type?: string | null
          epi_type?: string | null
          equipment_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_serialized?: boolean | null
          location?: string | null
          mac_address?: string | null
          material_type?: string | null
          max_stock?: number | null
          min_stock?: number | null
          model?: string | null
          name: string
          power?: string | null
          sale_price?: number | null
          size?: string | null
          tenant_id: string
          tool_type?: string | null
          unit?: string | null
          updated_at?: string | null
          validity_date?: string | null
          voltage?: string | null
          warranty_until?: string | null
        }
        Update: {
          acquisition_date?: string | null
          applicable_norm?: string | null
          barcode?: string | null
          branch_id?: string | null
          brand?: string | null
          ca_number?: string | null
          ca_validity?: string | null
          category?: Database["public"]["Enums"]["stock_category"]
          code?: string
          condition?: string | null
          cost_price?: number | null
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          dimensions?: string | null
          epc_type?: string | null
          epi_type?: string | null
          equipment_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_serialized?: boolean | null
          location?: string | null
          mac_address?: string | null
          material_type?: string | null
          max_stock?: number | null
          min_stock?: number | null
          model?: string | null
          name?: string
          power?: string | null
          sale_price?: number | null
          size?: string | null
          tenant_id?: string
          tool_type?: string | null
          unit?: string | null
          updated_at?: string | null
          validity_date?: string | null
          voltage?: string | null
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          selected_branch_id: string | null
          team_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          selected_branch_id?: string | null
          team_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          selected_branch_id?: string | null
          team_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_selected_branch_id_fkey"
            columns: ["selected_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          assigned_role: string | null
          assigned_user_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          location: string | null
          notified_day_before: boolean | null
          notified_same_day: boolean | null
          priority: string | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
          reminder_date: string
          reminder_time: string | null
          sector: string | null
          tenant_id: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_role?: string | null
          assigned_user_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          notified_day_before?: boolean | null
          notified_same_day?: boolean | null
          priority?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          reminder_date: string
          reminder_time?: string | null
          sector?: string | null
          tenant_id: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_role?: string | null
          assigned_user_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          notified_day_before?: boolean | null
          notified_same_day?: boolean | null
          priority?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          reminder_date?: string
          reminder_time?: string | null
          sector?: string | null
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_numbers: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          branch_id: string | null
          created_at: string | null
          id: string
          invoice_item_id: string | null
          location: string | null
          notes: string | null
          product_id: string
          purchase_date: string | null
          serial_number: string
          status: Database["public"]["Enums"]["serial_status"] | null
          tenant_id: string
          updated_at: string | null
          warranty_expires: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          branch_id?: string | null
          created_at?: string | null
          id?: string
          invoice_item_id?: string | null
          location?: string | null
          notes?: string | null
          product_id: string
          purchase_date?: string | null
          serial_number: string
          status?: Database["public"]["Enums"]["serial_status"] | null
          tenant_id: string
          updated_at?: string | null
          warranty_expires?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          branch_id?: string | null
          created_at?: string | null
          id?: string
          invoice_item_id?: string | null
          location?: string | null
          notes?: string | null
          product_id?: string
          purchase_date?: string | null
          serial_number?: string
          status?: Database["public"]["Enums"]["serial_status"] | null
          tenant_id?: string
          updated_at?: string | null
          warranty_expires?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serial_numbers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_invoice_item_id_fkey"
            columns: ["invoice_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_numbers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_etapas: {
        Row: {
          created_at: string
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          descricao: string | null
          id: string
          nome: string
          notas: string | null
          ordem: number
          percentual_peso: number
          responsavel_id: string | null
          service_order_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          id?: string
          nome: string
          notas?: string | null
          ordem?: number
          percentual_peso?: number
          responsavel_id?: string | null
          service_order_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          notas?: string | null
          ordem?: number
          percentual_peso?: number
          responsavel_id?: string | null
          service_order_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_etapas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_etapas_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_etapas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_etapas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_items: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          serial_number_id: string | null
          service_order_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          serial_number_id?: string | null
          service_order_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          serial_number_id?: string | null
          service_order_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_items_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_items_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_technicians: {
        Row: {
          created_at: string | null
          hours_worked: number | null
          id: string
          notes: string | null
          service_order_id: string
          technician_id: string
        }
        Insert: {
          created_at?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          service_order_id: string
          technician_id: string
        }
        Update: {
          created_at?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          service_order_id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_technicians_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_order_technicians_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          actual_hours: number | null
          address: string | null
          branch_id: string | null
          city: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          description: string | null
          estimated_hours: number | null
          id: string
          internal_notes: string | null
          labor_cost: number | null
          materials_cost: number | null
          notes: string | null
          order_number: number
          photos: Json | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          progresso: number
          scheduled_date: string | null
          scheduled_time: string | null
          signature_url: string | null
          started_at: string | null
          state: string | null
          status: Database["public"]["Enums"]["service_order_status"] | null
          team_id: string | null
          tenant_id: string
          title: string
          total_cost: number | null
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          address?: string | null
          branch_id?: string | null
          city?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          internal_notes?: string | null
          labor_cost?: number | null
          materials_cost?: number | null
          notes?: string | null
          order_number?: number
          photos?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          progresso?: number
          scheduled_date?: string | null
          scheduled_time?: string | null
          signature_url?: string | null
          started_at?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["service_order_status"] | null
          team_id?: string | null
          tenant_id: string
          title: string
          total_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          address?: string | null
          branch_id?: string | null
          city?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          internal_notes?: string | null
          labor_cost?: number | null
          materials_cost?: number | null
          notes?: string | null
          order_number?: number
          photos?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          progresso?: number
          scheduled_date?: string | null
          scheduled_time?: string | null
          signature_url?: string | null
          started_at?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["service_order_status"] | null
          team_id?: string | null
          tenant_id?: string
          title?: string
          total_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_audits: {
        Row: {
          audit_type: Database["public"]["Enums"]["stock_audit_type"]
          branch_id: string | null
          created_at: string
          description: string
          evidence_urls: Json | null
          id: string
          parent_audit_id: string | null
          product_id: string
          quantity: number
          reported_at: string
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          serial_number_id: string | null
          status: Database["public"]["Enums"]["stock_audit_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          audit_type: Database["public"]["Enums"]["stock_audit_type"]
          branch_id?: string | null
          created_at?: string
          description: string
          evidence_urls?: Json | null
          id?: string
          parent_audit_id?: string | null
          product_id: string
          quantity?: number
          reported_at?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          serial_number_id?: string | null
          status?: Database["public"]["Enums"]["stock_audit_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          audit_type?: Database["public"]["Enums"]["stock_audit_type"]
          branch_id?: string | null
          created_at?: string
          description?: string
          evidence_urls?: Json | null
          id?: string
          parent_audit_id?: string | null
          product_id?: string
          quantity?: number
          reported_at?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          serial_number_id?: string | null
          status?: Database["public"]["Enums"]["stock_audit_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_audits_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_audits_parent_audit_id_fkey"
            columns: ["parent_audit_id"]
            isOneToOne: false
            referencedRelation: "stock_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_audits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_audits_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_audits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_audits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          new_stock: number
          previous_stock: number
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          serial_number_id: string | null
          tenant_id: string
          unit_cost: number | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          new_stock: number
          previous_stock: number
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          serial_number_id?: string | null
          tenant_id: string
          unit_cost?: number | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          movement_type?: Database["public"]["Enums"]["movement_type"]
          new_stock?: number
          previous_stock?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          serial_number_id?: string | null
          tenant_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_serial_number_id_fkey"
            columns: ["serial_number_id"]
            isOneToOne: false
            referencedRelation: "serial_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          branch_id: string | null
          city: string | null
          cnpj: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          city?: string | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          city?: string | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          employee_id: string | null
          id: string
          joined_at: string | null
          team_id: string
          technician_id: string | null
        }
        Insert: {
          employee_id?: string | null
          id?: string
          joined_at?: string | null
          team_id: string
          technician_id?: string | null
        }
        Update: {
          employee_id?: string | null
          id?: string
          joined_at?: string | null
          team_id?: string
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          branch_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          leader_employee_id: string | null
          leader_id: string | null
          name: string
          tenant_id: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          branch_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          leader_employee_id?: string | null
          leader_id?: string | null
          name: string
          tenant_id: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          branch_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          leader_employee_id?: string | null
          leader_id?: string | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_leader_employee_id_fkey"
            columns: ["leader_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          address: string | null
          branch_id: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          employee_id: string | null
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          position: string | null
          rg: string | null
          state: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          employee_id?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          rg?: string | null
          state?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          employee_id?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          rg?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technicians_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technicians_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technicians_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technicians_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_features: {
        Row: {
          created_at: string | null
          default_dashboard_admin: string | null
          default_dashboard_caixa: string | null
          default_dashboard_manager: string | null
          default_dashboard_technician: string | null
          default_dashboard_warehouse: string | null
          enable_cautelas: boolean | null
          enable_customers: boolean | null
          enable_fechamento: boolean | null
          enable_fleet: boolean | null
          enable_hr: boolean | null
          enable_hr_afastamentos: boolean | null
          enable_hr_colaboradores: boolean | null
          enable_hr_ferias: boolean | null
          enable_hr_folha: boolean | null
          enable_invoices: boolean | null
          enable_movimentacao: boolean | null
          enable_nf_emissao: boolean | null
          enable_nf_entrada: boolean | null
          enable_obras: boolean | null
          enable_obras_diario: boolean | null
          enable_obras_projetos: boolean | null
          enable_pdv: boolean | null
          enable_reports: boolean | null
          enable_service_orders: boolean | null
          enable_stock: boolean | null
          enable_stock_auditoria: boolean | null
          enable_stock_epc: boolean | null
          enable_stock_epi: boolean | null
          enable_stock_equipamentos: boolean | null
          enable_stock_ferramentas: boolean | null
          enable_stock_materiais: boolean | null
          enable_teams: boolean | null
          id: string
          pdv_paper_width: number | null
          pdv_print_method: string | null
          pdv_printer_name: string | null
          pdv_receipt_footer: string | null
          pdv_receipt_header: string | null
          pdv_show_company_info: boolean | null
          settings: Json | null
          show_costs: boolean | null
          show_prices: boolean | null
          show_suppliers: boolean | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_dashboard_admin?: string | null
          default_dashboard_caixa?: string | null
          default_dashboard_manager?: string | null
          default_dashboard_technician?: string | null
          default_dashboard_warehouse?: string | null
          enable_cautelas?: boolean | null
          enable_customers?: boolean | null
          enable_fechamento?: boolean | null
          enable_fleet?: boolean | null
          enable_hr?: boolean | null
          enable_hr_afastamentos?: boolean | null
          enable_hr_colaboradores?: boolean | null
          enable_hr_ferias?: boolean | null
          enable_hr_folha?: boolean | null
          enable_invoices?: boolean | null
          enable_movimentacao?: boolean | null
          enable_nf_emissao?: boolean | null
          enable_nf_entrada?: boolean | null
          enable_obras?: boolean | null
          enable_obras_diario?: boolean | null
          enable_obras_projetos?: boolean | null
          enable_pdv?: boolean | null
          enable_reports?: boolean | null
          enable_service_orders?: boolean | null
          enable_stock?: boolean | null
          enable_stock_auditoria?: boolean | null
          enable_stock_epc?: boolean | null
          enable_stock_epi?: boolean | null
          enable_stock_equipamentos?: boolean | null
          enable_stock_ferramentas?: boolean | null
          enable_stock_materiais?: boolean | null
          enable_teams?: boolean | null
          id?: string
          pdv_paper_width?: number | null
          pdv_print_method?: string | null
          pdv_printer_name?: string | null
          pdv_receipt_footer?: string | null
          pdv_receipt_header?: string | null
          pdv_show_company_info?: boolean | null
          settings?: Json | null
          show_costs?: boolean | null
          show_prices?: boolean | null
          show_suppliers?: boolean | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_dashboard_admin?: string | null
          default_dashboard_caixa?: string | null
          default_dashboard_manager?: string | null
          default_dashboard_technician?: string | null
          default_dashboard_warehouse?: string | null
          enable_cautelas?: boolean | null
          enable_customers?: boolean | null
          enable_fechamento?: boolean | null
          enable_fleet?: boolean | null
          enable_hr?: boolean | null
          enable_hr_afastamentos?: boolean | null
          enable_hr_colaboradores?: boolean | null
          enable_hr_ferias?: boolean | null
          enable_hr_folha?: boolean | null
          enable_invoices?: boolean | null
          enable_movimentacao?: boolean | null
          enable_nf_emissao?: boolean | null
          enable_nf_entrada?: boolean | null
          enable_obras?: boolean | null
          enable_obras_diario?: boolean | null
          enable_obras_projetos?: boolean | null
          enable_pdv?: boolean | null
          enable_reports?: boolean | null
          enable_service_orders?: boolean | null
          enable_stock?: boolean | null
          enable_stock_auditoria?: boolean | null
          enable_stock_epc?: boolean | null
          enable_stock_epi?: boolean | null
          enable_stock_equipamentos?: boolean | null
          enable_stock_ferramentas?: boolean | null
          enable_stock_materiais?: boolean | null
          enable_teams?: boolean | null
          id?: string
          pdv_paper_width?: number | null
          pdv_print_method?: string | null
          pdv_printer_name?: string | null
          pdv_receipt_footer?: string | null
          pdv_receipt_header?: string | null
          pdv_show_company_info?: boolean | null
          settings?: Json | null
          show_costs?: boolean | null
          show_prices?: boolean | null
          show_suppliers?: boolean | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          background_url: string | null
          city: string | null
          cnpj: string | null
          complement: string | null
          created_at: string | null
          email: string | null
          id: string
          landing_page_content: Json | null
          logo_dark_url: string | null
          logo_url: string | null
          menu_color: string | null
          name: string
          neighborhood: string | null
          number: string | null
          phone: string | null
          primary_color: string | null
          primary_opacity: number | null
          proprietario: string | null
          razao_social: string | null
          secondary_color: string | null
          secondary_opacity: number | null
          settings: Json | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["tenant_status"] | null
          theme: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          background_url?: string | null
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          landing_page_content?: Json | null
          logo_dark_url?: string | null
          logo_url?: string | null
          menu_color?: string | null
          name: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          primary_color?: string | null
          primary_opacity?: number | null
          proprietario?: string | null
          razao_social?: string | null
          secondary_color?: string | null
          secondary_opacity?: number | null
          settings?: Json | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["tenant_status"] | null
          theme?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          background_url?: string | null
          city?: string | null
          cnpj?: string | null
          complement?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          landing_page_content?: Json | null
          logo_dark_url?: string | null
          logo_url?: string | null
          menu_color?: string | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          phone?: string | null
          primary_color?: string | null
          primary_opacity?: number | null
          proprietario?: string | null
          razao_social?: string | null
          secondary_color?: string | null
          secondary_opacity?: number | null
          settings?: Json | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["tenant_status"] | null
          theme?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          branch_ids: string[] | null
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          can_manage_users: boolean | null
          can_view_costs: boolean | null
          can_view_reports: boolean | null
          created_at: string | null
          dashboard_type: string | null
          id: string
          page_customers: boolean | null
          page_dashboard: boolean | null
          page_diario_obras: boolean | null
          page_fechamento: boolean | null
          page_fleet: boolean | null
          page_hr: boolean | null
          page_invoices: boolean | null
          page_movimentacao: boolean | null
          page_obras: boolean | null
          page_reports: boolean | null
          page_service_orders: boolean | null
          page_settings: boolean | null
          page_stock: boolean | null
          page_suppliers: boolean | null
          page_teams: boolean | null
          template_id: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          branch_ids?: string[] | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_manage_users?: boolean | null
          can_view_costs?: boolean | null
          can_view_reports?: boolean | null
          created_at?: string | null
          dashboard_type?: string | null
          id?: string
          page_customers?: boolean | null
          page_dashboard?: boolean | null
          page_diario_obras?: boolean | null
          page_fechamento?: boolean | null
          page_fleet?: boolean | null
          page_hr?: boolean | null
          page_invoices?: boolean | null
          page_movimentacao?: boolean | null
          page_obras?: boolean | null
          page_reports?: boolean | null
          page_service_orders?: boolean | null
          page_settings?: boolean | null
          page_stock?: boolean | null
          page_suppliers?: boolean | null
          page_teams?: boolean | null
          template_id?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          branch_ids?: string[] | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_manage_users?: boolean | null
          can_view_costs?: boolean | null
          can_view_reports?: boolean | null
          created_at?: string | null
          dashboard_type?: string | null
          id?: string
          page_customers?: boolean | null
          page_dashboard?: boolean | null
          page_diario_obras?: boolean | null
          page_fechamento?: boolean | null
          page_fleet?: boolean | null
          page_hr?: boolean | null
          page_invoices?: boolean | null
          page_movimentacao?: boolean | null
          page_obras?: boolean | null
          page_reports?: boolean | null
          page_service_orders?: boolean | null
          page_settings?: boolean | null
          page_stock?: boolean | null
          page_suppliers?: boolean | null
          page_teams?: boolean | null
          template_id?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "permission_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vacations: {
        Row: {
          acquisition_end: string
          acquisition_start: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          days_taken: number
          employee_id: string
          end_date: string
          id: string
          notes: string | null
          rejection_reason: string | null
          requested_at: string | null
          sold_days: number | null
          start_date: string
          status: Database["public"]["Enums"]["vacation_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          acquisition_end: string
          acquisition_start: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days_taken: number
          employee_id: string
          end_date: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          sold_days?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["vacation_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          acquisition_end?: string
          acquisition_start?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days_taken?: number
          employee_id?: string
          end_date?: string
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          sold_days?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["vacation_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          branch_id: string | null
          brand: string
          chassis: string | null
          color: string | null
          created_at: string | null
          current_km: number | null
          fleet_number: string | null
          fuel_type: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          model: string
          notes: string | null
          plate: string
          renavam: string | null
          tenant_id: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          branch_id?: string | null
          brand: string
          chassis?: string | null
          color?: string | null
          created_at?: string | null
          current_km?: number | null
          fleet_number?: string | null
          fuel_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          model: string
          notes?: string | null
          plate: string
          renavam?: string | null
          tenant_id: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          branch_id?: string | null
          brand?: string
          chassis?: string | null
          color?: string | null
          created_at?: string | null
          current_km?: number | null
          fleet_number?: string | null
          fuel_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          model?: string
          notes?: string | null
          plate?: string
          renavam?: string | null
          tenant_id?: string
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenant_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tenant_landing_pages: {
        Row: {
          background_url: string | null
          id: string | null
          landing_page_content: Json | null
          logo_url: string | null
          name: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string | null
          theme: string | null
        }
        Insert: {
          background_url?: string | null
          id?: string | null
          landing_page_content?: Json | null
          logo_url?: string | null
          name?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          theme?: string | null
        }
        Update: {
          background_url?: string | null
          id?: string | null
          landing_page_content?: Json | null
          logo_url?: string | null
          name?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          theme?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_by_hierarchy: {
        Args: {
          _target_branch_id: string
          _target_team_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      can_edit_branch_settings: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      can_edit_invoices: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_users_in_tenant: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      get_movement_trends: {
        Args: { p_branch_id?: string; p_tenant_id: string }
        Returns: {
          category: string
          movement_date: string
          total_in: number
          total_out: number
        }[]
      }
      get_stock_category_stats: {
        Args: { p_branch_id?: string; p_tenant_id: string }
        Returns: {
          category: string
          low_stock_count: number
          total_items: number
          total_stock: number
          total_value: number
          zero_stock_count: number
        }[]
      }
      get_tenant_id_from_storage_path: {
        Args: { object_path: string }
        Returns: string
      }
      get_user_branch_id: { Args: { _user_id: string }; Returns: string }
      get_user_team_id: { Args: { _user_id: string }; Returns: string }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      get_zero_stock_products: {
        Args: { p_branch_id?: string; p_limit?: number; p_tenant_id: string }
        Returns: {
          category: string
          id: string
          name: string
          sku: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_branch_manager: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
      is_branch_mgr: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      is_team_leader: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_technician_assigned_to_order: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_in_order_team: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_belongs_to_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      user_belongs_to_tenant: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_see_all_branches: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "technician"
        | "warehouse"
        | "superadmin"
        | "caixa"
        | "diretor"
        | "branch_manager"
        | "team_leader"
        | "field_user"
        | "director"
      contract_type: "clt" | "pj" | "estagio" | "temporario" | "autonomo"
      employee_status: "ativo" | "ferias" | "afastado" | "desligado"
      leave_type:
        | "atestado_medico"
        | "licenca_maternidade"
        | "licenca_paternidade"
        | "acidente_trabalho"
        | "falta_justificada"
        | "falta_injustificada"
        | "outro"
      maintenance_status:
        | "agendada"
        | "em_andamento"
        | "concluida"
        | "cancelada"
      maintenance_type: "preventiva" | "corretiva"
      movement_type:
        | "entrada"
        | "saida"
        | "transferencia"
        | "ajuste"
        | "devolucao"
      priority_level: "baixa" | "media" | "alta" | "urgente"
      serial_status: "disponivel" | "em_uso" | "em_manutencao" | "descartado"
      service_order_status:
        | "aberta"
        | "em_andamento"
        | "aguardando"
        | "concluida"
        | "cancelada"
      stock_audit_status:
        | "aberto"
        | "em_analise"
        | "resolvido"
        | "cancelado"
        | "enviado"
        | "recebido"
      stock_audit_type:
        | "defeito"
        | "furto"
        | "garantia"
        | "inventario"
        | "resolucao"
      stock_category:
        | "epi"
        | "epc"
        | "ferramentas"
        | "materiais"
        | "equipamentos"
      tenant_status: "active" | "suspended" | "trial" | "cancelled"
      vacation_status:
        | "pendente"
        | "aprovada"
        | "rejeitada"
        | "em_gozo"
        | "concluida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "manager",
        "technician",
        "warehouse",
        "superadmin",
        "caixa",
        "diretor",
        "branch_manager",
        "team_leader",
        "field_user",
        "director",
      ],
      contract_type: ["clt", "pj", "estagio", "temporario", "autonomo"],
      employee_status: ["ativo", "ferias", "afastado", "desligado"],
      leave_type: [
        "atestado_medico",
        "licenca_maternidade",
        "licenca_paternidade",
        "acidente_trabalho",
        "falta_justificada",
        "falta_injustificada",
        "outro",
      ],
      maintenance_status: [
        "agendada",
        "em_andamento",
        "concluida",
        "cancelada",
      ],
      maintenance_type: ["preventiva", "corretiva"],
      movement_type: [
        "entrada",
        "saida",
        "transferencia",
        "ajuste",
        "devolucao",
      ],
      priority_level: ["baixa", "media", "alta", "urgente"],
      serial_status: ["disponivel", "em_uso", "em_manutencao", "descartado"],
      service_order_status: [
        "aberta",
        "em_andamento",
        "aguardando",
        "concluida",
        "cancelada",
      ],
      stock_audit_status: [
        "aberto",
        "em_analise",
        "resolvido",
        "cancelado",
        "enviado",
        "recebido",
      ],
      stock_audit_type: [
        "defeito",
        "furto",
        "garantia",
        "inventario",
        "resolucao",
      ],
      stock_category: [
        "epi",
        "epc",
        "ferramentas",
        "materiais",
        "equipamentos",
      ],
      tenant_status: ["active", "suspended", "trial", "cancelled"],
      vacation_status: [
        "pendente",
        "aprovada",
        "rejeitada",
        "em_gozo",
        "concluida",
      ],
    },
  },
} as const
