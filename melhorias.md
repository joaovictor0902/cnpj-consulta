# Melhorias — Consulta CNPJ (ATOPY)

Análise feita em 06/08/2026 sobre o projeto `cnpj-consulta` (React 18 + TypeScript + Vite + Tailwind v4).
Itens organizados por prioridade e impacto. O build atual (`npm run build`) passa, mas há bastante espaço de melhoria.

---

## 1. Código morto (limpeza)

| Arquivo | Situação |
| --- | --- |
| `src/components/DynamicJson.tsx` | Nunca é importado. `DynamicJsonSection` não aparece em `App.tsx`. |
| `src/components/JsonTools.tsx` | Nunca é importado (não há mais "Ver JSON bruto" na tela). |
| `src/utils/count.ts` | Só é usado por `JsonTools.tsx` (morto junto). |
| `src/components/Icons.tsx` → `BuildingIcon`, `CodeIcon` | Não usados (grep não encontra import fora do próprio arquivo). |
| `src/utils/format.ts` → `formatField`, `humanizeKey`, `formatCpf`, `formatCurrencyBRL`, `FormattedValue` | Só usados pelo `DynamicJson.tsx` morto. |
| `data-html2canvas-ignore="true"` em `SummaryCard.tsx:69` | Atributo legado da época do html2canvas; o PDF agora é gerado com jsPDF puro. Remover. |

**Ação:** excluir `DynamicJson.tsx`, `JsonTools.tsx`, `count.ts` e o que sobrar sem uso; rodar `npm run build` depois (o `noUnusedLocals` não acusa exports não usados, então precisa ser manual).

## 2. Dependências

- **`html2canvas-pro` está no `package.json` mas não é mais usado** — o `generatePdf.ts` desenha direto com jsPDF ("sem dependência de html2canvas"). Remover da lista de dependências e rodar `npm install`.
- **Vendor tarballs (`vendor/*.tgz` com `file:` no package.json + `overrides`)** — `@jridgewell/*`, `postcss`, `tapable` pinados de arquivos locais. Isso trava o projeto a builds offline e impede updates. Se foi workaround de rede/certificado (aparenta ser, pelo aviso do FortiGate no build), documentar o motivo; idealmente voltar às versões do npm registry.
- **Dependências com versões antigas:** React 18 → avaliar React 19. `typescript` 5.6 → atual (5.9+).
- **Sem ferramentas de qualidade:** não há ESLint, Prettier, lint-staged ou hooks de git. Instalar ESLint + Prettier (ou Biome, mais leve) e configurar script `npm run lint`.

## 3. Qualidade de código / manutenção

- **Duplicação de extração de dados** entre `SummaryCard.tsx` e `generatePdf.ts` (~70 linhas repetidas: `iePrincipal`, `cnaePrincipal`, `telefone`, `endereço`, `situacao`, etc.). Extrair para um helper único (ex.: `src/utils/extractCnpjData.ts`) que recebe `CnpjResponse` e devolve um objeto tipado. Reduz divergências entre tela e PDF.
- **Tipos muito soltos:** todos os campos de `types.ts` são opcionais, sem validação. Considerar:
  - Validar a resposta da API com **zod** no `fetchCnpj` (garante que o que chega é o esperado e o restante do app não quebra em runtime);
  - Ou documentar os campos obrigatórios do `publica.cnpj.ws`.
- **`generatePdf.ts` é um arquivo gigante (336 linhas) com desenho manual** — funciona, mas seria mais testável extraindo as funções de layout (`drawRow`, `wrapText`, `calcCellHeight`) para um módulo separado.
- **Sem testes:** nenhum framework de teste. Prioridade: testes unitários de `masks.ts` (validação de dígito verificador) e `format.ts` (formatações), e testes de render com Vitest + Testing Library para `CnpjForm` e `SummaryCard`.

## 4. Performance

- **Bundle grande:** `index-CUGHJPeH.js` = **590 kB** (203 kB gzip), acima do limite de 500 kB do Vite. Principais contribuintes:
  - `jspdf` (~180 kB) — carregado no bundle inicial junto com o app;
  - `LOGO_BASE64` (27 kB de base64 em `src/assets/logoBase64.ts`) — embutido em JS e usado no card + PDF;
  - **Ação:** `import()` dinâmico do `generatePdf`/`jspdf` só no clique de "Baixar PDF" (code-splitting) e carregar o logo como asset do Vite (`/logo/ATOPY LOGO.png` já existe em `public/`).
- **`public/logo/` tem 6+ imagens de logo não utilizadas** (1.png, "ATOPY FOGUETE CURVAS 2.jpg", etc.) e o `dist/` replica tudo. Limpar arquivos que não são usados em tela/PDF.
- **`logo/` na raiz duplica `public/logo/`** — manter só uma origem.
- **Reconsulta sem cache:** clicar numa consulta recente refaz a chamada à API. Como a API limita a 3 req/min, vale **cachear o último resultado (ou resultados) no localStorage** (ex.: 24h de TTL) e mostrar "dados de X atrás".

## 5. UX / funcionalidade

- **Erro de PDF usa `alert()`** (`App.tsx:50`); usar o mesmo padrão de toast já existente (e incluir o toast no card de erro, com variante de erro).
- **Toast sem cleanup de timer:** `showToast` cria `setTimeout` sem guardar referência; se chamado duas vezes seguidas, timers concorrentes podem esconder o toast cedo demais. Usar ref + `clearTimeout`.
- **Sem autofocus no input de CNPJ** — página inicial deveria focar o campo (`autoFocus`).
- **Telefone 2 não é exibido:** a API retorna `ddd2`/`telefone2` e o tipo já os modela, mas tela e PDF só mostram o primeiro.
- **`timeAgo` não atualiza sozinho:** texto "X min atrás" fica velho até renderizar de novo. Opcional: re-render periódico (ex.: setInterval 60s) ou trocar por data absoluta.
- **Sem "copiar endereço completo"** para o usuário colar em outro sistema (botão único que copia "logradouro, numero, bairro — municipio/UF, CEP").
- **Título da aba não muda com a consulta:** manter `document.title = "Empresa X — Consulta CNPJ"` após sucesso.
- **Remover botões de remover em mobile:** no `RecentSearches`, o botão "remover" só aparece no hover (`opacity-0 group-hover:opacity-100`) — em touch não existe hover. Tornar sempre visível (ou `sm:`).
- **`situacao_especial`** quando vazio deveria mostrar "—" já no texto (hoje é `situacaoEspecial || '—'` só na tela; ok, mas conferir consistência com o PDF).

## 6. Acessibilidade

- **Ícones apenas decorativos:** botão de remover em `RecentSearches` usa só `title`; adicionar `aria-label="Remover consulta 12.345..."`.
- **Botões de copiar** sem `aria-label` específico em alguns usos (o `label` default "Copiar" é genérico — o prop existe, mas em `SummaryCard` só alguns usos passam `label`).
- **Cores:** `text-ink-muted` (#636366) sobre fundo branco tem contraste ~5.1:1 (ok para texto normal), mas os labels de 9px no card podem ficar difíceis — considerar 10px+ no card.
- **`h1` do header vs `h1` do comprovante (`comprovante-title`)**: dois `h1` na mesma página quando há resultado. Usar `h2` no título do comprovante ou reordenar.

## 7. PDF (`generatePdf.ts`)

- **Sem data/hora de emissão e fonte dos dados** no rodapé do comprovante — um "Comprovante" oficial deveria conter: data de emissão, hora e "Fonte: publica.cnpj.ws". Adicionar rodapé com paginação.
- **Sem "data de atualização"** (`atualizado_em`) do cadastro, que a API retorna.
- **Campos `ddd2`/`telefone2`, `capital_social`** não entram no comprovante (avaliar se faz sentido).
- **Texto do IE com "Inativa"** já existe; ok. Mas `ieText` pode exibir "(SP - Inativa)" com espaçamento inconsistente — revisar formatação.
- **`pdf.addImage` com logo embutida em base64** duplica o peso do bundle; com code-split (item 4) isso se resolve junto.

## 8. Robusteza / segurança

- **API sem timeout:** `fetch` com `AbortSignal` cancela em nova busca, mas não há timeout próprio — uma API travada segura o "Consultando…" indefinidamente. Adicionar timeout (ex.: 10–15s via `AbortSignal.timeout` ou timer próprio).
- **Limite de 3 req/min da API:** além da mensagem de 429, considerar **fila/backoff** no cliente (esperar ~1s entre consultas) para reduzir erros em uso normal.
- **Sem ErrorBoundary:** um crash em `SummaryCard` derruba a página toda. Adicionar ErrorBoundary simples no `main.tsx`.
- **Logs:** `console.error` ok, mas sem qualquer monitoramento (não é crítico para ferramenta interna — opcional).

## 9. Processo / repo

- **`.gitignore` não ignora `vendor/`** (se é workaround local, não deveria subir) nem `logo/` (se duplica `public/logo/`).
- **`README.md` está vazio ("Apenas")** — documentar: como rodar (`npm install`/`npm run dev`), a API usada, o limite de 3 req/min, e as decisões (PDF via jsPDF puro).
- **Sem CI:** adicionar GitHub Actions (ou similar) rodando `npm run build` + lint + testes em cada PR.
- **`prompt.md` descreve uma versão antiga da tela** (botões "Ver JSON bruto / Copiar JSON", seção dinâmica) que não existe mais no código — atualizar ou remover para não confundir.

---

## Priorização sugerida

1. **Rápido e seguro (1–2 h):** remover código morto e dependência `html2canvas-pro`; atributo legado; `autoFocus`; erro de PDF via toast; cleanup de timer do toast.
2. **Performance (2–4 h):** code-split do jspdf/PDF; parar de embutir logo em base64; limpar `public/logo`.
3. **Qualidade (1–2 dias):** extrair lógica duplicada tela/PDF; adicionar zod; ESLint+Prettier; testes de máscara/format.
4. **Funcional (2–3 dias):** cache de resultados; telefone 2; data/hora no PDF; backoff/timeout na API; ErrorBoundary.
5. **Processo (1 dia):** CI, README, gitignore, limpeza de `prompt.md`/vendor.
