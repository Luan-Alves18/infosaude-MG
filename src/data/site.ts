// Dados do portal InfoSaúde MG. PAINEIS importados do site oficial info.saude.mg.gov.br

export const AREAS_TEMATICAS = [
  { id: 1, slug: "vigilancia-epidemiologica", nome: "Vigilância Epidemiológica", descricao: "Monitoramento de doenças, agravos e eventos de saúde pública.", icon: "Activity", cor: "from-rose-500 to-red-600" },
  { id: 5, slug: "estudos-tecnicos", nome: "Estudos Técnicos", descricao: "Análises e relatórios técnicos sobre a saúde em Minas Gerais.", icon: "FileSearch", cor: "from-blue-500 to-indigo-600" },
  { id: 7, slug: "gestao", nome: "Gestão", descricao: "Indicadores de gestão administrativa e financeira do SUS-MG.", icon: "Briefcase", cor: "from-violet-500 to-purple-600" },
  { id: 8, slug: "regulacao", nome: "Regulação do Acesso a Serviços de Saúde", descricao: "Acompanhamento da regulação assistencial e fluxos de atendimento.", icon: "Network", cor: "from-cyan-500 to-teal-600" },
  { id: 10, slug: "atencao-primaria", nome: "Atenção Primária", descricao: "Indicadores da APS, ESF e cobertura assistencial municipal.", icon: "HeartHandshake", cor: "from-emerald-500 to-green-600" },
  { id: 11, slug: "regionalizacao", nome: "Regionalização", descricao: "Dados por regiões ampliadas e macrorregiões de saúde de MG.", icon: "Map", cor: "from-amber-500 to-orange-600" },
  { id: 14, slug: "auditoria-sus", nome: "Auditoria do SUS-MG", descricao: "Painéis e indicadores das auditorias do SUS em Minas.", icon: "ClipboardCheck", cor: "from-pink-500 to-rose-600" },
  { id: 16, slug: "atencao-especializada", nome: "Atenção Especializada", descricao: "Atenção ambulatorial e hospitalar de média e alta complexidade.", icon: "Stethoscope", cor: "from-teal-500 to-emerald-600" },
];

export const INDICADORES_HOME = [
  { label: "Municípios cobertos", valor: "853", sub: "100% de Minas Gerais" },
  { label: "Painéis publicados", valor: "19", sub: "em 8 áreas temáticas" },
  { label: "Atualização", valor: "Diária", sub: "dados de fontes oficiais" },
  { label: "Acessos/mês", valor: "+120 mil", sub: "gestores e cidadãos" },
];


export const NOTICIAS = [
  { titulo: "Novo painel de Mortalidade Infantil e Materna é publicado", categoria: "Vigilância", data: "2025-03-18", resumo: "Ferramenta interativa permite acompanhar indicadores por município e regional de saúde em Minas Gerais." },
  { titulo: "Observatório de Vacinação atualiza dados de cobertura vacinal", categoria: "Imunização", data: "2025-03-12", resumo: "Painel apresenta cobertura por imunobiológico e faixa etária, com séries históricas desde 2015." },
  { titulo: "Integração de informações em saúde do SUS-MG ganha novo módulo", categoria: "Saúde Digital", data: "2025-02-28", resumo: "Módulo de Saúde Digital reúne produtos de dados e ferramentas para apoio à decisão clínica e gestora." },
  { titulo: "Painéis de Regionalização ampliam visão por macrorregião", categoria: "Gestão", data: "2025-02-14", resumo: "Novos recortes territoriais facilitam a análise comparada entre regiões de saúde." },
];

// Auto-gerado a partir do site oficial info.saude.mg.gov.br

export type Painel = {
  id: number;
  titulo: string;
  areaId: number;
  areaSlug: string;
  areaNome: string;
  embedUrl: string;
  restrito?: boolean;
};

export const PAINEIS: Painel[] = [
  // Vigilância Epidemiológica — públicos
  { id: 22, titulo: "Meningites - Monitoramento", areaId: 1, areaSlug: "vigilancia-epidemiologica", areaNome: "Vigilância Epidemiológica", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiZjBkMWVmZTgtMmJiNS00M2IxLTk0NDctZTA5MDlhNjkzNGE5IiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },
  { id: 34, titulo: "Doença de Chagas Crônica (DCC)", areaId: 1, areaSlug: "vigilancia-epidemiologica", areaNome: "Vigilância Epidemiológica", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiZTIwNmE5YjktYzk5Ny00ZGUwLTlkMzYtYmMxMzVkZjBhMmU1IiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },
  { id: 52, titulo: "Vigilância da Resistência no Tratamento da Hanseníase", areaId: 1, areaSlug: "vigilancia-epidemiologica", areaNome: "Vigilância Epidemiológica", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiMGJmZDQxNDgtOGUxZS00YWY1LWEzZjQtNGE0YTNjNjI2ZWZlIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },
  { id: 66, titulo: "Violência", areaId: 1, areaSlug: "vigilancia-epidemiologica", areaNome: "Vigilância Epidemiológica", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiNzA0NmQzYzAtZGI2ZS00NTkzLWFkZTktYTdkMjcyYjVhOTU2IiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },
  { id: 67, titulo: "Olhares Sobre a Violência Contra as Mulheres", areaId: 1, areaSlug: "vigilancia-epidemiologica", areaNome: "Vigilância Epidemiológica", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiMzM0NTZiMWYtYzU3Mi00MGQzLTlkZDQtNTdlYmZmYjU3OWJhIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },

  // Estudos Técnicos
  { id: 16, titulo: "Análise de Acidentes de Trânsito em MG", areaId: 5, areaSlug: "estudos-tecnicos", areaNome: "Estudos Técnicos", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiYTRhZmRkNTItMzYwMC00NTRjLTliZTEtMzA4YTkwYzFmNDRjIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },

  // Gestão — público
  { id: 75, titulo: "Planejamento Anual de Compras", areaId: 7, areaSlug: "gestao", areaNome: "Gestão", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiMDhhYzk2NzAtOTA2Ny00MDA2LWIzYzMtZWU0ZTQyZTVkYzRjIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },

  // Regulação — públicos
  { id: 30, titulo: "Arboviroses - Dados Públicos de Regulação do Acesso", areaId: 8, areaSlug: "regulacao", areaNome: "Regulação do Acesso a Serviços de Saúde", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiMmYxMzJjOTUtY2VkOC00M2E2LWFhMzQtODg2NjllYzJlZTQzIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },
  { id: 31, titulo: "Síndromes Respiratórias - Dados Públicos de Regulação do Acesso", areaId: 8, areaSlug: "regulacao", areaNome: "Regulação do Acesso a Serviços de Saúde", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiNTFkNDIzYjAtYmM1Yi00MTA0LTg3NDYtOTNlNTg2YjFlN2YzIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },
  { id: 32, titulo: "Observatório da Demanda por Acesso - Dados Públicos", areaId: 8, areaSlug: "regulacao", areaNome: "Regulação do Acesso a Serviços de Saúde", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiMzAzM2I2ODgtNTk4OC00OGE4LWIwN2ItMjkzMGQzMjJlY2MzIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },

  // Regionalização
  { id: 37, titulo: "Monitoramento PDR", areaId: 11, areaSlug: "regionalizacao", areaNome: "Regionalização", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiZjYwZjhmNTQtMGEwMy00MDllLWI1NzAtOTkyOWIwZWRkNTBjIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9&amp;pageName=286b5974720719adf65f" },

  // Auditoria do SUS-MG
  { id: 70, titulo: "Painel de Auditoria do SUS-MG", areaId: 14, areaSlug: "auditoria-sus", areaNome: "Auditoria do SUS-MG", embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiMjAyZjRlZDUtNzllMC00OTQ2LThiMWMtODEwZDNjZGRkYmJjIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },


  // Painéis restritos
  { id: 1001, titulo: "Arboviroses - Lista de Solicitações em Aberto", areaId: 8, areaSlug: "regulacao", areaNome: "Regulação do Acesso a Serviços de Saúde", restrito: true, embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiYTI4NmIyNmYtM2ViNi00Zjg3LWFhNDUtNWYwNjg0NmY1MDExIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },
  { id: 1002, titulo: "Monitoramento - Câncer de Mama", areaId: 16, areaSlug: "atencao-especializada", areaNome: "Atenção Especializada", restrito: true, embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiNjRiODg0NjgtZjNlZS00OTc4LTg1ZmEtNjQ0ZGY4NTkyNTViIiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },
  { id: 1006, titulo: "Monitoramento Infecções Respiratórias", areaId: 10, areaSlug: "atencao-primaria", areaNome: "Atenção Primária", restrito: true, embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiMzdhOTc3MWYtNDViOS00MThhLThhYzgtYzBkYmQyZjA0ZjQ0IiwidCI6IjVjMGUxMWNkLWEyZTMtNDAxNS1hNzM3LTIxOWFlMDcxOWUwOCJ9" },
  { id: 1009, titulo: "Observatório do Acesso - Lista de Solicitações em Aberto", areaId: 8, areaSlug: "regulacao", areaNome: "Regulação do Acesso a Serviços de Saúde", restrito: true, embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiNmVmODY4NTYtZmM0NC00NzdmLWFjNzgtYWU1MDEzMzcxMDA3IiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },
  
  { id: 1013, titulo: "Síndromes Respiratórias - Lista de Solicitações em Aberto", areaId: 8, areaSlug: "regulacao", areaNome: "Regulação do Acesso a Serviços de Saúde", restrito: true, embedUrl: "https://app.powerbi.com/view?r=eyJrIjoiYjExMTQyY2QtNzcyYS00NjIyLWI0ZWItYWM3NTkwMWIwMzM1IiwidCI6Ijg3ZTRkYTJiLTgyZGYtNDhmNi05MTU3LTY5YzNjYTYwMGRmMiIsImMiOjR9" },
];
// Compat: usado em algumas telas antigas
export const PAINEIS_VIGILANCIA = PAINEIS;
