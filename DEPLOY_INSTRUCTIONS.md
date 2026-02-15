# Instruções de Deploy - Sistema ERP

## Pré-requisitos

1. **Banco de Dados Supabase** - Projeto ativo com URL e chave de serviço
2. **Node.js 18+** e **npm/bun** instalados
3. **Supabase CLI** instalado (`npm install -g supabase`)

## 1. Configuração do Banco de Dados

### Opção A: Via Lovable Cloud (Recomendado)
Se estiver usando Lovable Cloud, o banco já está configurado automaticamente.

### Opção B: Novo Projeto Supabase
1. Crie um novo projeto no Supabase Dashboard
2. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
3. Preencha as variáveis:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon
   VITE_SUPABASE_PROJECT_ID=seu-project-id
   ```

### Executar Migrations
```bash
# Link ao projeto Supabase
supabase link --project-ref SEU_PROJECT_ID

# Executar todas as migrations
supabase db push
```

## 2. Inicialização Automática

O sistema inicializa automaticamente quando detecta um banco de dados novo:

1. **Ao acessar o sistema**, a edge function `check-system-status`:
   - Verifica se existe um SuperAdmin
   - Se não existir, **cria automaticamente** com as credenciais padrão

2. **Credenciais do SuperAdmin Padrão**:
   ```
   Email: superadmin@admin.local
   Senha: @Volluty123
   ```

3. **Tenant System** é criado automaticamente com tema padrão:
   - Primary Color: `#3b82f6` (Azul)
   - Secondary Color: `#f1f5f9` (Cinza claro)
   - Menu Color: `#1e3a5f` (Azul marinho)

⚠️ **IMPORTANTE**: Após o primeiro login, altere a senha do SuperAdmin nas configurações.

## 3. Estrutura de Hierarquia

### Roles Disponíveis (app_role):
- `superadmin` - Acesso total ao sistema e todas empresas
- `admin` - Administrador de uma empresa/tenant
- `diretor` - Acesso geral à empresa sem filial específica
- `manager` - Gerente de filial
- `technician` - Técnico/Funcionário
- `warehouse` - Almoxarifado
- `caixa` - Operador de caixa (PDV)

### Fluxo de Cadastro:
1. **Sistema cria automaticamente** o SuperAdmin padrão
2. **SuperAdmin** cria empresas (tenants) e filiais via painel `/superadmin`
3. **SuperAdmin** cria admins para cada empresa
4. **Admin** cria usuários e define permissões via perfis de acesso
5. **Usuários** acessam conforme suas permissões

## 5. Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `tenants` | Empresas/organizações |
| `branches` | Filiais de cada empresa |
| `profiles` | Perfis de usuários |
| `user_roles` | Roles atribuídas aos usuários |
| `user_permissions` | Permissões granulares |
| `permission_templates` | Templates de perfis de acesso |
| `tenant_features` | Módulos habilitados por empresa |

## 6. Funções de Segurança

Funções RLS críticas implementadas:
- `has_role(user_id, role)` - Verifica se usuário tem determinada role
- `is_superadmin(user_id)` - Verifica se é superadmin
- `get_user_tenant_id(user_id)` - Retorna tenant do usuário
- `get_user_branch_id(user_id)` - Retorna filial do usuário
- `user_belongs_to_tenant(user_id, tenant_id)` - Verifica pertencimento
- `is_tenant_admin(user_id, tenant_id)` - Verifica se é admin do tenant
- `can_manage_users_in_tenant(user_id, tenant_id)` - Permissão de gestão

## 7. Triggers Automáticos

| Trigger | Descrição |
|---------|-----------|
| `on_auth_user_created` | Cria perfil ao cadastrar usuário |
| `on_new_tenant` | Cria features e filial matriz |
| `on_new_user_role` | Cria permissões iniciais |
| `update_*_updated_at` | Atualiza timestamps |

## 8. Edge Functions

| Função | Descrição |
|--------|-----------|
| `check-system-status` | Verifica estado do sistema (banco novo/configurado) |
| `create-superadmin` | Cria superadmin (inicial ou adicional) |
| `create-tenant-admin` | Cria admin de empresa/filial |
| `create-tenant-user` | Cria usuário comum |
| `get-tenant-users` | Lista usuários de uma empresa |
| `update-user-password` | Atualiza senha de usuário |
| `get-public-branding` | Retorna branding público |

## 9. Variáveis de Ambiente

### Frontend (Vite)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

### Edge Functions (Secrets do Backend)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPERADMIN_INIT_TOKEN= (token seguro para criar primeiro superadmin)
```

## 10. Fluxo de Login

1. Usuário acessa `/auth`
2. Seleciona local (Geral ou Filial específica)
3. Sistema valida:
   - SuperAdmin → só acesso "Geral"
   - Diretor (admin/manager sem filial) → acesso "Geral"
   - Usuários comuns → só filial atribuída
4. Após login, redireciona para `/dashboard` ou `/superadmin`

## 11. Migração para Novo Banco

Para migrar o sistema para um novo banco de dados:

1. **Exporte o código** (já está versionado no Git)

2. **Crie novo projeto Supabase**

3. **Execute as migrations**:
   ```bash
   supabase link --project-ref NOVO_PROJECT_ID
   supabase db push
   ```

4. **Configure as Secrets**:
   - `SUPERADMIN_INIT_TOKEN` com um token seguro

5. **Atualize as variáveis de ambiente**:
   ```
   VITE_SUPABASE_URL=https://novo-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=nova-chave-anon
   VITE_SUPABASE_PROJECT_ID=novo-project-id
   ```

6. **Deploy e acesse o sistema**:
   - O sistema detectará automaticamente que é um banco novo
   - Você será redirecionado para `/setup`
   - Configure o primeiro SuperAdmin com o token

## 12. Verificação de Saúde

Após deploy, verifique:
```sql
-- Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Verificar funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Verificar roles
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role');
```

## Suporte

Em caso de problemas, verifique:
1. Logs do Backend → Edge Function Logs
2. Console do navegador para erros frontend
3. Status do sistema via endpoint `check-system-status`
