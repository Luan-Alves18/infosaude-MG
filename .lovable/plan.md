# Plano de implementação

Esta é uma demanda grande, dividida em 6 blocos. Sugiro aprovar tudo de uma vez e eu implemento em sequência, ou aprovar bloco a bloco se preferir revisar entre etapas.

---

## 1. Estatísticas de acesso por painel (aba em "Gerenciar usuários")

**Nova aba "Estatísticas"** em `/admin/usuarios` com:
- Filtro de período: **Semana / Mês / Ano**
- Dois blocos: **Painéis públicos** e **Painéis restritos** (separados)
- Um bloco por **Área temática** (somatório dos painéis da área no período)
- Tabela com: nome do painel/área, total de acessos, gráfico simples de barras

**Backend:**
- A tabela `portal_visits` já existe e registra `path`. Vou usar o `path` (ex.: `/paineis/123`) para extrair o painel.
- Nova server function `getPanelVisitsStats({ period: 'week'|'month'|'year' })` que agrupa visitas por painel e cruza com `PAINEIS` (de `src/data/site.ts`) para classificar como público/restrito e por área.
- Já existe `useLogPortalVisit` — confirmar que está registrando em todas as rotas de painel.

---

## 2. Solicitações de criação de conta na aba "Solicitações pendentes"

- Adicionar **sub-seção** dentro de "Solicitações pendentes" mostrando registros de `account_requests` com status `pendente` (já existe a tabela).
- Cada solicitação exibe: nome, e-mail, instituição, chefia, motivo, data.
- Botão **"Aprovar e criar conta"**: cria o usuário via Supabase Auth Admin (server function com service role), gera senha temporária aleatória, marca request como `aprovado`, e dispara e-mail ao usuário com link de definição de senha (usa fluxo `resetPasswordForEmail`).
- Botão **"Recusar"**: marca como `recusado`.

**Backend:** server function `approveAccountRequest({ requestId })` que usa `supabaseAdmin.auth.admin.createUser` + envia magic link de definição de senha.

---

## 3. Galeria de Painéis — ordenação alfabética com áreas vazias ao final

Em `src/routes/paineis.tsx`:
- Ordenar áreas temáticas por **ordem alfabética** (pt-BR, case-insensitive).
- Áreas **sem painéis visíveis para o usuário** (público sem painéis OU restrito sem permissão) vão para o final, **sem entrar na ordenação alfabética** (mantêm sua ordem original entre si, ou também alfabética — confirmar preferência; vou aplicar alfabética entre as vazias também por consistência).
- A flag "vazia" é calculada **dinamicamente** com base nos painéis liberados ao usuário logado, então áreas voltam à ordenação se o usuário ganhar permissão.
- Os painéis dentro de cada área (e a listagem geral abaixo, se houver) também ordenados alfabeticamente.
- Preservar legendas e edições visuais existentes.

---

## 4. Recuperação de senha na página de login

Em `src/routes/auth.tsx`:
- Adicionar link **"Esqueci minha senha"** abaixo do formulário de login.
- Abre modal/seção com input de e-mail.
- Chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<app>/auth/reset' })`.
- Criar rota `src/routes/auth.reset.tsx` para o usuário definir a nova senha (recebe o token via hash da URL, usa `supabase.auth.updateUser({ password })`).
- Disponível para qualquer usuário (não só não-@saude.mg.gov.br) — restringir apenas visualmente seria confuso; deixo aberto para todos.

---

## 5. Notificações por e-mail para o admin

Usar **Lovable Emails** (e-mail nativo). Preciso configurar o domínio de envio primeiro (botão no chat). Depois:

- **Solicitação de criação de conta** → e-mail para `luanalves.trabalho@gmail.com` no estilo "nova solicitação pendente, verifique em Gerenciar usuários", com link direto.
- **Solicitação de acesso a painel restrito** → mesmo padrão.
- **Formulário "Envie uma mensagem" (Contato)** → e-mail com o conteúdo da mensagem, `reply_to` apontando para o e-mail do remetente, para que o admin responda diretamente pela caixa de e-mail.

**Implementação:** 3 templates React Email + triggers nos pontos de envio (após insert em `account_requests`, `panel_access_requests`, e no submit do formulário de contato).

---

## 6. "Meu perfil" no lugar de "Meu painel"

Substituir o item de menu **Meu painel** → **Meu perfil**, com nova rota `src/routes/perfil.tsx` contendo abas:

- **Dados:** nome (`display_name`) e e-mail (read-only), botão salvar.
- **Favoritos:** lista de painéis salvos. Botão de ⭐ aparece em cada card de painel (públicos e restritos liberados). Nova tabela `user_favorites (user_id, panel_id, created_at)` com RLS por dono.
- **Alterar senha:** form de senha atual + nova senha; usa `supabase.auth.updateUser({ password })` (Supabase não exige senha atual, mas vou pedir e revalidar via `signInWithPassword` por segurança antes de trocar).

---

## Detalhes técnicos

- **Migrations necessárias:**
  - `user_favorites` (id, user_id, panel_id text, created_at) + RLS + GRANTs.
  - Possível índice em `portal_visits(path, visited_at)` para performance das stats.
- **Server functions novas:** `getPanelVisitsStats`, `listAccountRequests`, `approveAccountRequest`, `rejectAccountRequest`, `addFavorite`, `removeFavorite`, `listFavorites`, `updateProfile`, `changePassword`.
- **E-mails:** depende de configuração do domínio Lovable Emails — vou abrir o setup quando chegarmos nesse bloco.
- **Secrets:** nenhum novo (Lovable Emails usa infra interna; admin user creation usa `SUPABASE_SERVICE_ROLE_KEY` que já existe).

---

## Ordem de execução sugerida

1. Galeria — ordenação alfabética (rápido, isolado).
2. Recuperação de senha + página de reset.
3. Meu perfil + favoritos (inclui migration).
4. Estatísticas de acesso (server fn + nova aba).
5. Aprovação de solicitações de conta.
6. E-mails (último porque depende do setup de domínio).

Confirma que posso seguir com tudo nessa ordem?