# Guia de Implantação - Sistema ERP

Este documento descreve o processo completo de implantação do sistema ERP para novos clientes.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Criação do Projeto](#criação-do-projeto)
3. [Configuração Inicial](#configuração-inicial)
4. [Criação de Usuários](#criação-de-usuários)
5. [Configuração de Módulos](#configuração-de-módulos)
6. [Dados Iniciais](#dados-iniciais)
7. [Personalização Visual](#personalização-visual)
8. [Verificação Final](#verificação-final)
9. [Entrega ao Cliente](#entrega-ao-cliente)

---

## 1. Pré-requisitos

Antes de iniciar a implantação, certifique-se de ter:

- [ ] Contrato assinado com o cliente
- [ ] Dados cadastrais da empresa (CNPJ, Razão Social, Endereço)
- [ ] Informações das filiais (se houver)
- [ ] Logo da empresa (formatos: PNG ou SVG, fundo transparente)
- [ ] Cores da marca (primária e secundária em formato HEX)
- [ ] Lista de usuários iniciais com emails

---

## 2. Criação do Projeto

### 2.1. Clonar o Projeto Base

1. Acesse o projeto base no Lovable
2. Clique em **Settings** → **Remix this project**
3. Nomeie o projeto: `erp-[nome-cliente]`
4. Aguarde a criação do novo projeto

### 2.2. Configurar Domínio (Opcional)

Se o cliente tiver domínio próprio:

1. Vá em **Settings** → **Domains**
2. Adicione o domínio personalizado
3. Configure os DNS conforme instruções

---

## 3. Configuração Inicial

### 3.1. Primeiro Acesso como SuperAdmin

1. Acesse `/setup-inicial`
2. Crie o primeiro superadmin com suas credenciais
3. Anote o token de inicialização (se necessário)

### 3.2. Criar o Tenant (Empresa)

1. Acesse **SuperAdmin** → **Empresas**
2. Clique em **Nova Empresa**
3. Preencha os dados:
   - Nome da empresa
   - CNPJ
   - Slug (identificador único, ex: `empresa-abc`)
   - Email do administrador da matriz
   - Cores do tema (primária e secundária)
4. O sistema criará automaticamente:
   - O tenant
   - A filial "Matriz"
   - O usuário admin da matriz

### 3.3. Criar Filiais Adicionais

Para cada filial:

1. Acesse **SuperAdmin** → **Filiais**
2. Clique em **Nova Filial**
3. Preencha:
   - Nome da filial
   - CNPJ (se diferente)
   - Endereço completo
   - Email e telefone de contato

---

## 4. Criação de Usuários

### 4.1. Hierarquia de Papéis

| Papel | Escopo | Descrição |
|-------|--------|-----------|
| SuperAdmin | Sistema | Gerencia módulos, permissões e todos os tenants |
| Admin (Matriz) | Empresa | Gerencia matriz e todas as filiais |
| Admin (Filial) | Filial | Gerencia apenas sua filial específica |
| Manager | Filial | Gerente com permissões ampliadas |
| Warehouse | Filial | Almoxarife - gestão de estoque |
| Technician | Filial | Técnico de campo |

### 4.2. Criar Usuários

1. Acesse **SuperAdmin** → **Usuários**
2. Clique em **Novo Usuário**
3. Preencha:
   - Nome completo
   - Email (será o login)
   - Senha forte (8+ caracteres, maiúscula, minúscula, número, especial)
   - Filial de acesso
   - Perfil de permissão

### 4.3. Requisitos de Senha

A senha deve conter:
- ✅ Mínimo 8 caracteres
- ✅ Uma letra maiúscula
- ✅ Uma letra minúscula
- ✅ Um número
- ✅ Um caractere especial (!@#$%^&*...)

---

## 5. Configuração de Módulos

### 5.1. Módulos Disponíveis

| Módulo | Descrição |
|--------|-----------|
| Dashboard | Painel principal com indicadores |
| Estoque | EPI, EPC, Ferramentas, Materiais, Equipamentos |
| Obras | Gestão de obras e diário de obras |
| Ordens de Serviço | Ordens de serviço técnico |
| Frota | Veículos, combustível, manutenções |
| RH | Funcionários, férias, afastamentos, folha |
| Clientes | Cadastro de clientes |
| Fornecedores | Cadastro de fornecedores |
| Notas Fiscais | Entrada e registro de notas |
| Equipes | Gestão de equipes técnicas |
| Relatórios | Relatórios gerenciais |
| Auditoria | Auditoria de estoque |

### 5.2. Ativar/Desativar Módulos

1. Acesse **SuperAdmin** → **Módulos**
2. Selecione o tenant
3. Ative/desative os módulos conforme contrato

---

## 6. Dados Iniciais

### 6.1. Dados Carregados Automaticamente

O sistema cria automaticamente:
- Filial Matriz
- Categorias padrão de estoque
- Tipos de manutenção
- Status de obras
- Tipos de afastamento

### 6.2. Dados a Configurar

O admin da empresa deve configurar:
- [ ] Categorias de produtos personalizadas
- [ ] Fornecedores
- [ ] Clientes
- [ ] Veículos da frota
- [ ] Funcionários

---

## 7. Personalização Visual

### 7.1. Logo da Empresa

1. Acesse **SuperAdmin** → **Tema**
2. Faça upload da logo (modo claro)
3. Faça upload da logo (modo escuro, se houver)
4. Recomendações:
   - Formato: PNG com fundo transparente
   - Altura recomendada: 80-120px
   - Largura máxima: 300px

### 7.2. Cores do Tema

1. Defina a cor primária (botões, links, destaques)
2. Defina a cor secundária (fundos, elementos de suporte)
3. Defina a cor do menu lateral
4. Visualize em tempo real antes de salvar

### 7.3. Imagem de Fundo (Login)

1. Faça upload de uma imagem de fundo para a tela de login
2. Recomendações:
   - Resolução: 1920x1080 ou maior
   - Formato: JPG ou PNG
   - Imagem que represente a empresa/setor

---

## 8. Verificação Final

### 8.1. Checklist de Validação

- [ ] Login funcionando para todos os usuários
- [ ] Módulos corretos habilitados
- [ ] Logo e cores aplicados corretamente
- [ ] Filiais criadas e configuradas
- [ ] Permissões de usuários testadas
- [ ] Notificações push funcionando
- [ ] Relatórios acessíveis
- [ ] Mobile responsivo testado

### 8.2. Testes por Perfil

Teste o acesso com cada tipo de usuário:
1. **Admin Matriz**: deve ver todas as filiais
2. **Admin Filial**: deve ver apenas sua filial
3. **Técnico**: deve ver apenas funcionalidades permitidas

---

## 9. Entrega ao Cliente

### 9.1. Informações de Acesso

Forneça ao cliente:
- URL de acesso ao sistema
- Credenciais do admin da matriz
- Este guia de uso básico

### 9.2. Treinamento

Agende sessões de treinamento:
- [ ] Treinamento para admins
- [ ] Treinamento para gestores
- [ ] Treinamento para técnicos

### 9.3. Suporte

Informe os canais de suporte:
- WhatsApp: [seu número]
- Horário de atendimento: [seu horário]

---

## Atualizações

### Política de Atualização

- O cliente decide quando atualizar
- Atualizações são testadas em ambiente de homologação
- Comunicar mudanças importantes com antecedência

### Como Atualizar

1. Faça backup dos dados (se necessário)
2. Sincronize o projeto com a versão mais recente
3. Teste as principais funcionalidades
4. Comunique o cliente sobre as novidades

---

## Troubleshooting

### Problemas Comuns

| Problema | Solução |
|----------|---------|
| Usuário não consegue logar | Verificar se selecionou a filial correta |
| Módulo não aparece | Verificar se está habilitado para o tenant |
| Erro de permissão | Verificar perfil de permissão do usuário |
| Notificações não funcionam | Verificar permissão do navegador |

### Contato para Suporte Técnico

Em caso de problemas técnicos, entre em contato com a equipe de desenvolvimento.

---

*Última atualização: Dezembro 2025*
