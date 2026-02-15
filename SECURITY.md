# Relatório de Integridade e Políticas de Segurança

**Projeto:** Concip Brasil - Sistema ERP  
**Data da análise:** 2025-02-15

---

## 1. Resumo executivo

O sistema utiliza **Supabase** para backend (PostgreSQL + Auth + Storage + Edge Functions), com **React + Vite** no frontend. A análise cobre autenticação, autorização, RLS, Edge Functions, tratamento de segredos e riscos de XSS/path traversal.

**Conclusão:** A base está sólida (RLS, funções SECURITY DEFINER, auth nas APIs sensíveis). Foram identificados pontos de melhoria e uma correção aplicada (path traversal em `serve-attachment` e `.env` no `.gitignore`).

---

## 2. Autenticação e identidade

| Aspecto | Status | Detalhes |
|--------|--------|----------|
| Cliente Supabase | OK | Uso de `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (chave anônima, adequada para o browser). |
| Sessão | OK | `localStorage`, `persistSession: true`, `autoRefreshToken: true`. |
| Login | OK | `signInWithPassword` em `useAuth.ts`; erros tratados e sem expor detalhes sensíveis em excesso. |
| Logout | OK | `signOut` limpa estado local antes de chamar Supabase. |

**Recomendações:**
- Manter a **chave anônima (publishable)** apenas no frontend; nunca usar a **service role** no cliente.
- Considerar políticas de senha no Supabase (complexidade, expiração) conforme política interna.

---

## 3. Autorização e multi-tenant

### 3.1 Funções SQL (RLS)

- **`get_user_tenant_id(_user_id uuid)`** – retorna `tenant_id` do perfil; `STABLE SECURITY DEFINER`, `search_path` fixo.
- **`has_role(_user_id, _role)`** – verifica papel em `user_roles`; `SECURITY DEFINER`.
- **`is_superadmin(_user_id)`** – verifica papel `superadmin`; `SECURITY DEFINER`.

Uso consistente de `auth.uid()` nas políticas e isolamento por `tenant_id` + roles (admin, manager, technician, warehouse, etc.).

### 3.2 Row Level Security (RLS)

- RLS habilitado nas tabelas críticas (ex.: employees, service_providers, invoices, profiles, branches, pdv_*).
- Políticas por tenant: `tenant_id = get_user_tenant_id(auth.uid())` e restrições por `has_role` / `is_tenant_admin` / `is_superadmin`.
- Superadmin com políticas específicas onde necessário (“Superadmin can manage all …”).

**Integridade:** As políticas garantem que usuários só acessem dados do próprio tenant e conforme o papel.

---

## 4. Edge Functions – políticas de segurança

| Função | Autenticação | Autorização | Validação de entrada |
|--------|--------------|-------------|------------------------|
| **serve-attachment** | Bearer token + `getUser()` | tenant do path = tenant do perfil ou superadmin | Path obrigatório; **path traversal bloqueado** (correção aplicada). |
| **create-stock-entry** | Bearer token | tenant do perfil; branch opcional | Zod (invoice + itens, UUIDs, números). |
| **update-user-password** | Bearer token | admin ou superadmin; mesmo tenant (exceto superadmin) | user_id + new_password; senha mín. 6 caracteres. |
| **create-tenant-admin** | Bearer token | Apenas superadmin | Zod (tenant, branch, admin, slug, etc.). |
| **get-tenant-users** | Bearer token | Admin (role ou template) do tenant | Nenhum parâmetro arbitrário crítico. |
| **pdv-auth** | Nenhuma | N/A | Zod (action, tenant_id, terminal_id, operator_id, pin). |
| **create-public-ticket** | Nenhuma (público) | N/A | Campos obrigatórios e tamanhos máximos. |

**Pontos importantes:**

1. **pdv-auth**  
   - Não exige JWT; qualquer um que conheça a URL pode chamar.  
   - Login por PIN em texto no corpo; PIN é armazenado em texto na tabela `pdv_operators`.  
   - **Recomendações:**  
     - Restringir origem (CORS ou rede) e/ou adicionar um token compartilhado por tenant/PDV.  
     - Armazenar PIN com hash (ex.: bcrypt) e comparar com hash no login.

2. **create-public-ticket**  
   - Endpoint público; aceita `tenantId` e `branchId` no body.  
   - **Recomendações:**  
     - Validar que `tenantId` (e `branchId` se usado) existem e estão ativos.  
     - Rate limiting por IP e/ou por tenant para evitar abuso e spam.

3. **CORS**  
   - Todas as funções usam `Access-Control-Allow-Origin: '*'`.  
   - **Recomendação:** Em produção, restringir a origens conhecidas (ex.: domínio do frontend).

---

## 5. Segredos e variáveis de ambiente

| Item | Status |
|------|--------|
| `.env` no repositório | **Corrigido** – `.env` e `.env.local` adicionados ao `.gitignore`. |
| `.env.example` | OK – apenas placeholders, sem valores reais. |
| Frontend | OK – apenas variáveis `VITE_*` (URL e chave anônima). |
| Edge Functions | OK – uso de `Deno.env.get('SUPABASE_URL')`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`) definidos no projeto Supabase. |

**Recomendação:** Nunca commitar `.env`; garantir que em CI/CD e em produção as variáveis venham do ambiente ou de um cofre de segredos.

---

## 6. Frontend – XSS e conteúdo dinâmico

| Local | Risco | Medida |
|-------|--------|--------|
| **Frota.tsx** | Uso de `ref.current.innerHTML` em `document.write()` para impressão. | Conteúdo vem do DOM já renderizado pelo React (dados de frota/abastecimento). Risco baixo se esses dados forem sempre controlados pela aplicação; evitar no futuro campos de texto livre (ex.: observações) renderizados como HTML. |
| **chart.tsx** | `dangerouslySetInnerHTML` para CSS de temas. | Conteúdo gerado a partir de `THEMES` e `colorConfig`, com `sanitizeCssId` e validação de cor. Risco baixo. |

**Recomendação geral:** Para qualquer novo campo de texto livre exibido na UI, usar escape/HTML sanitizado ou componentes que não interpretem HTML.

---

## 7. Path traversal (serve-attachment) – correção aplicada

Foi adicionada validação em **serve-attachment** para rejeitar:

- Caminhos contendo `..`
- Caminhos que comecem com `/`

Assim evita-se acesso a objetos fora do prefixo esperado no bucket (ex.: `tenant_id/../outro_tenant/arquivo.pdf`).

---

## 8. Checklist de políticas de segurança (resumo)

- [x] Autenticação Supabase no frontend com chave anônima
- [x] RLS habilitado nas tabelas sensíveis com políticas por tenant e role
- [x] Funções auxiliares (`get_user_tenant_id`, `has_role`, `is_superadmin`) com SECURITY DEFINER e search_path controlado
- [x] Edge Functions sensíveis exigem Bearer token e verificam tenant/role
- [x] Validação de entrada com Zod nas funções que recebem JSON
- [x] `.env` ignorado pelo Git
- [x] Path traversal bloqueado em serve-attachment
- [x] **CORS:** Edge Functions usam `ALLOWED_ORIGINS` (env). Em produção, defina origens específicas no projeto Supabase.
- [x] **pdv-auth:** PIN armazenado com hash bcrypt; verificação via RPC `verify_pdv_operator_pin`; trigger hasheia ao inserir/atualizar.
- [x] **create-public-ticket:** Validação de tenant (existente e ativo) e de branch; rate limit de 10 req/min por IP.

---

## 9. Referências úteis

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
