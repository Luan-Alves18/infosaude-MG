## Objetivo

Produzir a documentação técnica acadêmica do portal **InfoSaúde MG**, seguindo o roteiro do anexo *Documentação de um Produto de Software v3.0* (USJT), com linguagem formal, capítulos 1 a 9 completos, diagramas UML em Mermaid e os três marcos obrigatórios destacados: evolução do portal, migração de Lovable Cloud para Supabase externo (NIGD) com SSO Azure AD, e o `VITE_MODO_ELEITORAL`.

## Entregas

1. `docs/DOCUMENTACAO_TECNICA.md` — versionado no repositório, editável.
2. `/mnt/documents/InfoSaude_Documentacao_Tecnica.docx` — gerado a partir do Markdown via `pandoc`, formatado com sumário, estilos de heading, fontes e margens A4, pronto para anexar no TG. Diagramas Mermaid serão renderizados para PNG (mermaid-cli) e incorporados no .docx.

## Estrutura do documento

Seguindo fielmente o índice do anexo:

```text
Prefácio
1. Introdução ao Documento
   1.1 Tema · 1.2 Objetivo · 1.3 Delimitação · 1.4 Justificativa
   1.5 Método de Trabalho · 1.6 Organização · 1.7 Glossário
2. Descrição Geral do Sistema
   2.1 Problema · 2.2 Envolvidos · 2.3 Regras de Negócio
3. Requisitos do Sistema
   3.1 Funcionais (com casos de uso) · 3.2 Não-Funcionais
   3.3 Protótipo · 3.4 Métricas e Cronograma
4. Análise e Design
   4.1 Arquitetura · 4.2 Modelo de Domínio · 4.3 Interação
   4.4 Classes · 4.5 Atividades · 4.6 Estados · 4.7 Componentes
   4.8 Modelo de Dados · 4.9 Ambiente Dev · 4.10 Sistemas Externos
5. Implementação
6. Testes (6.1 Plano · 6.2 Execução)
7. Implantação (7.1 Diagrama · 7.2 Manual)
8. Manual do Usuário
9. Conclusões e Considerações Finais
Bibliografia · Glossário
```

## Conteúdo extraído do código real

Vou ler/citar a base atual para preencher cada tópico com fatos do projeto:

- **Painéis e áreas temáticas:** `src/data/site.ts`, `src/lib/areaColors.ts`.
- **Rotas e fluxo de navegação:** árvore em `src/routes/` (index, paineis, paineis_.$id, buscar, dados-abertos, sobre, contato, perfil, auth, auth.reset, solicitar-conta, solicitar-acesso-painel, admin.usuarios, admin.informacoes-tecnicas).
- **Camada de servidor (TanStack):** `src/lib/*.functions.ts` (favorites, panel-notes, profile, requests, admin, panel-permissions) — usadas como base dos requisitos funcionais e do diagrama de componentes.
- **Autenticação e papéis:** `src/hooks/useAuth.tsx`, `user_roles` + `has_role()`, restrição de domínio `@saude.mg.gov.br` no `handle_new_user`.
- **Modelo de dados:** tabelas `profiles`, `user_roles`, `panel_notes`, `panel_permissions`, `user_favorites`, `account_requests`, `panel_access_requests`, `portal_visits`, e funções `validate_*`, `get_*_visits`, `has_role` — convertidas em modelo lógico e dicionário de dados.
- **Acessibilidade e UX:** `AccessibilityMenu`, `useAccessibility`, otimizações mobile recentes (`src/lib/normalize.ts`, ajustes em `paineis.tsx`, `paineis_.$id.tsx`, `styles.css`).
- **Modo Eleitoral:** `src/lib/modoEleitoral.tsx`, `docs/MODO_ELEITORAL.md`, flag `VITE_MODO_ELEITORAL`.

## Marcos obrigatórios — onde entram

- **Evolução do portal (cap. 5 — Implementação, subseção "Evolução incremental do produto"):** linha do tempo das entregas — estrutura inicial de painéis → Header/Footer institucionais → busca com normalização de acentos → mapa MG e mini-mapa → favoritos por usuário → notas técnicas administrativas → solicitação de conta e de acesso a painéis → área administrativa (usuários, informações técnicas) → recuperação de senha com OTP → otimização ampla para smartphones.
- **Migração Lovable Cloud → Supabase NIGD (cap. 4.1 Arquitetura e cap. 4.9 Ambiente de Desenvolvimento):** narrativa do protótipo inicial no Lovable Cloud, bloqueio por políticas corporativas para SAML SSO, recriação do projeto apontando para o Supabase externo (organização NIGD, ref `jxjxzyqrdnyhbgllxzdm`), adoção de **OAuth 2.0 com provedor `azure` (Microsoft Entra ID)** via Client ID/Secret, restrição por domínio institucional e uso de `SES_SUPABASE_SERVICE_ROLE_KEY` como fallback do service role.
- **`VITE_MODO_ELEITORAL` (cap. 3.3 Regras de Negócio e cap. 5 Implementação):** finalidade jurídica (Lei 9.504/97, art. 73), mecanismo técnico (`isModoEleitoral()`, `HideInModoEleitoral`, `ShowOnlyInModoEleitoral`), critério de ativação por build (`.env` + republicação), itens cobertos (ficha técnica, nomes de gestores, logos/cores institucionais) e garantia de reversibilidade pós-eleição.

## Diagramas UML (Mermaid)

- **4.1 Arquitetura:** diagrama de contexto Cliente ↔ Cloudflare Worker (TanStack Start) ↔ Supabase (Auth/DB/RLS) ↔ Microsoft Entra ID.
- **4.2 Modelo de Domínio:** classes Usuário, Perfil, Papel, Painel, Favorito, NotaTécnica, PermissãoPainel, SolicitaçãoConta, SolicitaçãoAcessoPainel, RegistroVisita.
- **4.3 Interação:** sequência "Solicitar acesso a painel restrito" e "Login via Microsoft (SSO Azure)".
- **4.4 Classes:** detalhamento dos `*.functions.ts` como serviços.
- **4.5 Atividades:** fluxo de aprovação de conta (solicitação → revisão admin → `inviteUserByEmail` → onboarding).
- **4.6 Estados:** estados de `account_requests` (pendente → aprovada/rejeitada).
- **4.7 Componentes:** SiteLayout, Header, Footer, rotas, server functions, integrações Supabase.
- **7.1 Implantação:** Worker Cloudflare + Supabase NIGD + Entra ID.

Cada diagrama Mermaid renderizado para PNG via `mmdc` antes da geração do .docx, para que o Word exiba imagens reais.

## Detalhes técnicos da geração

1. Escrever `docs/DOCUMENTACAO_TECNICA.md` completo (estimativa 25–35 mil caracteres).
2. `bun add -d @mermaid-js/mermaid-cli` em escopo local de `/tmp` (não polui dependências do app) — alternativa: usar `npx --yes @mermaid-js/mermaid-cli` direto.
3. Renderizar cada bloco Mermaid em `/tmp/diagrams/*.png`.
4. Gerar `.docx` com `pandoc docs/DOCUMENTACAO_TECNICA.md -o /mnt/documents/InfoSaude_Documentacao_Tecnica.docx --toc --toc-depth=3 --reference-doc=<referência opcional>`.
5. QA: converter o .docx em PDF/PNG via LibreOffice e inspecionar páginas (sumário, headings, diagramas, quebra de tabelas) antes de entregar.
6. Emitir `<presentation-artifact>` apontando para o `.docx`.

## Fora de escopo

- Não há alteração no código-fonte do app — apenas adição do arquivo de documentação em `docs/`.
- Não serão criadas migrações, secrets, edge functions ou rotas novas.
- Bibliografia listará referências reais (Pressman, Sommerville, docs oficiais TanStack/Supabase/Lei 9.504/97); nenhuma fonte fictícia.
