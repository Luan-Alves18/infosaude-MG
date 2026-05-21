# Plano: Novo fluxo de autenticação e permissões

## 1. Página de Login (`/auth`)
- Manter o botão **"Entrar com a conta Microsoft"** (já existente, com bloqueio para domínios diferentes de `@saude.mg.gov.br` — já implementado em `useAuth`).
- **Remover** as abas "Entrar" / "Criar conta" e o botão "Entrar".
- Deixar apenas os campos **E-mail** e **Senha** + link **"Solicitar criação de conta"**.
- O submit do formulário e-mail/senha chama `signInWithPassword` diretamente (sem aba).
- Mensagem de erro institucional ajustada: *"Erro de login, entre com sua conta institucional SES-MG"* (quando domínio Microsoft inválido).

## 2. Página `/solicitar-conta`
- Formulário com campos obrigatórios: Nome completo, Instituição, Chefia Imediata, E-mail desejado, Senha desejada, Motivo.
- Validação: se algum campo vazio → toast *"Campo(s) sem preenchimento"*.
- Submit grava em nova tabela `account_requests` e dispara e-mail para `luanalves.trabalho@gmail.com` via server function + Lovable Email (gateway transacional). Como ainda não há domínio configurado, irei armazenar a solicitação no banco e usar `fetch` para o gateway `Lovable AI / Resend` somente se possível — caso contrário, deixar registrado e exibir aviso no admin.

## 3. Página `/solicitar-acesso-painel` (usuário logado)
- Campos: Painel(is) desejados (multi-select com lista dos painéis restritos do `PAINEIS`), Motivo.
- Submit grava em `panel_access_requests` e envia e-mail para o mesmo destinatário.

## 4. Header / Perfil do usuário
- Quando logado, menu dropdown com avatar/nome contendo:
  - "Solicitar acesso a painel"
  - "Sair"
  - (se admin) "Gerenciar usuários"

## 5. Página `/admin/usuarios` (apenas admin)
- Lista de usuários (de `profiles` + `auth.users` via server function admin), com:
  - Busca por nome/e-mail
  - Ordenação por mais recentes
  - Nome (derivado do e-mail institucional ou da solicitação) + e-mail
  - Painel lateral por usuário: lista TODOS os painéis restritos (`PAINEIS.filter(p => p.restrito)`) com checkbox para conceder/revogar acesso, gravando em nova tabela `panel_permissions (user_id, panel_id)`.
- Como atualmente não existem painéis restritos no `PAINEIS`, a UI funciona mas a lista lateral fica vazia até serem adicionados — controle já fica pronto.

## 6. Bootstrap do admin `luanalves.trabalho@gmail.com`
- Migração SQL: trigger/handler que ao inserir usuário com esse e-mail concede automaticamente role `admin`.
- O usuário deve criar a conta uma vez via `/solicitar-conta` ou eu posso pré-cadastrar via SQL. **Como o Supabase exige fluxo de signup**, a abordagem é: ao logar pela primeira vez via e-mail/senha (`teste123`), se a conta não existir, eu faço signup automático e atribuo admin. Verificação por código no e-mail: usar `signInWithOtp` apenas para esse e-mail (envia OTP) antes de liberar.
- **Simplificação**: pré-criar usuário admin via migração SQL (`auth.users` insert + `user_roles` insert) com senha `teste123`. Login normal funciona.

## 7. Banco de dados (migração Supabase)
Novas tabelas:
- `account_requests` (nome_completo, instituicao, chefia, email, senha_hash, motivo, status, created_at)
- `panel_access_requests` (user_id, panel_ids text[], motivo, status, created_at)
- `panel_permissions` (user_id, panel_id) — PK composta
- RLS: insert público em `account_requests`; insert autenticado em `panel_access_requests`; admin-only em `panel_permissions` e select de requests.
- Atualizar trigger `handle_new_user` para promover `luanalves.trabalho@gmail.com` a admin automaticamente.

## 8. Envio de e-mail para `luanalves.trabalho@gmail.com`
- Como o projeto não tem domínio de e-mail configurado e não há conector Resend declarado, irei:
  - Armazenar a solicitação no banco (sempre).
  - Tentar enviar via Lovable Email gateway se disponível (server function `send-request-email`).
  - Se não houver domínio, retornar mensagem ao admin de que a solicitação ficou registrada no banco para consulta.
- **Pergunta para o usuário antes de implementar envio real**: precisa configurar domínio de e-mail (Lovable Emails) — irei perguntar no fim, mas já implementar o fallback de registro no banco.

## 9. Ocultação de painéis restritos
- Em `paineis.tsx` e `index.tsx`, filtrar `PAINEIS` para esconder `restrito=true` quando: usuário não logado **OU** sem permissão em `panel_permissions`.
- Em `paineis_.$id.tsx`, bloquear acesso direto se painel restrito e usuário sem permissão.

## Detalhes técnicos
- Server functions com `requireSupabaseAuth` para mutações sensíveis.
- Server function admin (`supabaseAdmin`) para listar usuários e gerenciar permissões.
- React Hook Form + zod para validação dos formulários.
- Toasts para feedback.
- Rota `/admin/usuarios` protegida por `beforeLoad` que verifica role admin.

## Confirmação necessária
Antes de implementar o envio real de e-mail, preciso saber: você quer configurar o domínio de e-mail Lovable agora (para envio automático), ou prefere que as solicitações fiquem apenas no banco e visíveis no painel admin? Sem domínio configurado, não consigo enviar e-mail para `luanalves.trabalho@gmail.com` de forma confiável.