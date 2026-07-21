# Fable 5 — Ajustar identidade visual do Consulta CNPJ (marca ATOPY)

Você é um engenheiro frontend sênior. Ajuste APENAS a parte visual do projeto `cnpj-consulta` para alinhá-lo com a identidade da marca **ATOPY**. Mantenha simples, mas bonito. Não reescreva funcionalidades — apenas o visual/identidade.

## Stack atual
- React 18 + TypeScript + Vite + TailwindCSS v4
- Sem bibliotecas de ícones (SVG inline)

## Identidade visual ATOPY (canônica — igual à landingpage e ao site oficial)

### Branding
- Nome no `<title>`: `ATOPY — Consulta CNPJ`
- Favicon 🚀 (emoji foguete inline como SVG data URI), igual à landingpage
- Logo textual no header: `<A>` laranja + `<TOP>` ink + `<Y>` azul, fonte Poppins 800

### Paleta (use `@theme` no `src/index.css`)
```css
@theme {
  --color-brand-orange: #EF6C1A;
  --color-brand-orange-dark: #C9550E;
  --color-brand-orange-light: #FF8A3D;
  --color-brand-orange-soft: #FFF4EC;
  --color-brand-yellow: #F2BD1D;
  --color-brand-blue: #3BA4F0;
  --color-brand-blue-dark: #2384CF;
  --color-ink: #1C1C1E;
  --color-ink-soft: #3A3A3C;
  --color-ink-muted: #636366;
  --color-bg: #FAFAFA;
  --color-bg-alt: #F2F2F7;
  --color-border-soft: #E5E5EA;
  --color-success: #30B566;
  --color-danger: #E04040;
}
```

### Sombras com glow laranja
```css
--shadow-primary: 0 8px 24px rgba(239, 108, 26, 0.18);
--shadow-primary-lg: 0 16px 48px rgba(239, 108, 26, 0.28);
```

### Tipografia (Google Fonts no `index.html`)
- **Display/headings**: `Poppins` (700/800)
- **Body**: `Inter` (400–700)

## Escopo das mudanças

### 1. `index.html`
- Trocar `<title>` para `ATOPY — Consulta CNPJ`
- Adicionar `<meta name="theme-color" content="#EF6C1A">`
- Adicionar `<link>` do Google Fonts (Poppins + Inter)
- Favicon 🚀 como SVG data URI

### 2. `src/index.css`
- Adicionar `@theme` com a paleta acima
- Configurar `--font-heading: 'Poppins'` e `--font-body: 'Inter'`
- Aplicar `font-family` no `body`
- Background do app: `--color-bg` (#FAFAFA)
- Adicionar utilitários básicos se necessário (shadow-primary)

### 3. Header
- Logo textual ATOPY (A laranja / TOP ink / Y azul) em Poppins 800
- Pequeno subtítulo: "Consulta CNPJ" em ink-muted
- Layout responsivo: sticky no topo, fundo branco com `border-soft` embaixo

### 4. Botão "Consultar"
- Fundo `--color-brand-orange`
- Hover: `--color-brand-orange-dark`
- Texto branco, `font-weight: 600`
- Padding confortável, cantos arredondados (8px)
- `shadow-primary` no hover
- `transition` suave (150ms)

### 5. Input de CNPJ
- Borda `--color-border-soft` por padrão
- `focus`: borda `--color-brand-orange` + `ring` laranja suave
- Placeholder cinza muted

### 6. Cards de resultado (resumo e seção dinâmica)
- Fundo branco
- Borda `--color-border-soft` (1px)
- Cantos arredondados (12px)
- `shadow-sm` por padrão, `shadow-md` no hover (apenas no resumo)
- Título do card em Poppins 700, cor `ink`
- Etiquetas (labels) em `ink-muted`, `text-sm`, uppercase tracking-wide
- Valores em `ink`, com peso apropriado

### 7. Badges de situação cadastral
- Ativa: `--color-success` (fundo suave `#E9F7EE`, texto `#1F8843`)
- Baixada/suspensa/nula: `--color-danger` (fundo suave `#FDECEC`, texto `#B3261E`)
- Outros: cinza neutro

### 8. Estados (loading, erro, empty)
- **Loading**: spinner laranja `--color-brand-orange` + mensagem em `ink-muted`
- **Erro**: card vermelho suave (`#FDECEC`), ícone SVG de alerta, mensagem em `--color-danger`/`ink-soft`
- **Empty state**: ícone foguete SVG outline em `ink-muted` + mensagem curta

### 9. Botões auxiliares (Ver JSON bruto / Copiar JSON)
- Botão secundário: fundo transparente, borda `--color-border-soft`, texto `ink-soft`
- Hover: fundo `--color-bg-alt`, texto `ink`
- Botão de cópia com sucesso: feedback em `--color-success` por 2s ("Copiado!")
- Não use cores laranja nesses botões (reservar para ações primárias)

### 10. Renderização dinâmica (seção automática do JSON)
- Mantenha o comportamento atual — APLIQUE apenas a nova paleta/fontes
- Booleanos `Sim`: texto `--color-success` em negrito; `Não`: `--color-ink-muted`
- Chaves de objetos: em `ink` semibold
- Listas: bullets em `--color-brand-orange`

### 11. Footer (pequeno)
- Texto curto: `ATOPY · Ferramenta interna` em `ink-muted`, `text-xs`
- Alinhado ao centro

## Fora de escopo (NÃO alterar)
- Lógica de consulta, máscaras, formatação, renderização dinâmica
- Estrutura de componentes
- Chamadas à API
- Estrutura de pastas

## Critérios de aceite

1. `<title>` mostra "ATOPY — Consulta CNPJ"; favicon 🚀 aparece na aba.
2. Header exibe o logo ATOPY colorido (A/TOP/Y) em Poppins 800.
3. Fontes Poppins (títulos) e Inter (corpo) carregadas e aplicadas.
4. Botão primário é laranja `#EF6C1A` com hover para `#C9550E`.
5. Inputs têm foco com ring laranja suave.
6. Cards têm cantos 12px, borda `#E5E5EA`, sombra leve.
7. Badges de situação usam cores semânticas (verde/vermelho suaves).
8. Loading, erro e empty state seguem a identidade (laranja/vermelho/cinza).
9. Sem bibliotecas externas de ícones — apenas SVGs inline.
10. Layout permanece responsivo e funcional.
11. `npm run build` passa sem erros de TypeScript.

## Verificação
- `npm run build` (deve passar sem erros)
- `npm run dev` e validar manualmente:
  - Carregar favicon 🚀
  - Consultar CNPJ `11444877000151`
  - Confirmar header, botão, input, cards e badges com a identidade ATOPY
  - Confirmar estados de loading, erro e empty
