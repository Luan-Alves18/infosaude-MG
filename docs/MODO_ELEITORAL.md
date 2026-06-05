# Modo Eleitoral — Guia de uso

Mecanismo para esconder temporariamente conteúdo institucional vedado pela
legislação eleitoral (Lei 9.504/97, art. 73), **sem perder o layout permanente**
do portal e **sem bloquear** novas funcionalidades adicionadas no período.

## Princípio

- O layout atual é **o layout permanente**. Nada é removido do código.
- Elementos vedados são apenas **envolvidos** por um wrapper de visibilidade.
- Uma única flag (`VITE_MODO_ELEITORAL`) liga/desliga o modo restrito.
- Ao desligar a flag após a eleição, o layout volta 100% íntegro, **somado** a
  qualquer funcionalidade nova criada nesse meio-tempo.

## Como ativar / desativar

Edite `.env`:

```
VITE_MODO_ELEITORAL="true"    # período eleitoral (esconde itens vedados)
VITE_MODO_ELEITORAL="false"   # período normal  (layout permanente completo)
```

Depois **republique** o portal (a variável é injetada em build).

## Como marcar conteúdo vedado

Importe os helpers de `@/lib/modoEleitoral`:

```tsx
import {
  HideInModoEleitoral,
  ShowOnlyInModoEleitoral,
  isModoEleitoral,
} from "@/lib/modoEleitoral";
```

### 1. Esconder um bloco inteiro
```tsx
<HideInModoEleitoral>
  <FichaTecnica />
</HideInModoEleitoral>
```

### 2. Substituir por texto neutro
```tsx
<HideInModoEleitoral fallback={<p>Conteúdo temporariamente indisponível.</p>}>
  <BannerInstitucional />
</HideInModoEleitoral>
```

### 3. Renderização condicional pontual
```tsx
{isModoEleitoral() ? "SES-MG" : "Secretaria de Estado de Saúde — Gestão XYZ"}
```

### 4. Mostrar aviso apenas durante o período
```tsx
<ShowOnlyInModoEleitoral>
  <Alert>Informações institucionais temporariamente ocultadas.</Alert>
</ShowOnlyInModoEleitoral>
```

## Checklist típico de itens vedados (a confirmar pelo cliente)

- Nomes/fotos de gestores, secretários e autoridades
- Ficha técnica com nomes de servidores
- Slogans, logos e marcas da gestão atual
- Banners promocionais de programas de governo
- Mensagens de boas-vindas assinadas por autoridade

> Painéis de dados, indicadores técnicos, dados abertos e funcionalidades
> de uso público **não** são afetados.

## Manutenção

Quando adicionar novos componentes institucionais, envolva-os já com
`<HideInModoEleitoral>` para não precisar lembrar depois.
