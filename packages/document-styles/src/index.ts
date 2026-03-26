/**
 * HTML/CSS shell for PDF (Puppeteer) and fallback browser export.
 * Keep template ids in sync with frontend `lib/templates.ts`.
 */

const FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&family=JetBrains+Mono:wght@400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

function baseRules(): string {
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  p { margin-bottom: 0.8rem; }
  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9pt;
    background: #edeae3;
    color: #9a4f10;
    padding: 0.15em 0.4em;
    border-radius: 3px;
  }
  pre {
    background: #0f0e0c;
    color: #f5f0e8;
    padding: 1rem;
    border-radius: 6px;
    margin: 1rem 0;
    overflow: hidden;
    page-break-inside: avoid;
  }
  pre code {
    background: none;
    color: inherit;
    padding: 0;
    font-size: 9pt;
    white-space: pre-wrap;
    word-break: break-all;
  }
  ul, ol { padding-left: 1.5rem; margin-bottom: 0.8rem; }
  li { margin-bottom: 0.2rem; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; page-break-inside: avoid; }
  th { background: #0f0e0c; color: #f5f0e8; padding: 0.5rem 0.75rem; text-align: left; font-size: 9pt; font-weight: 600; }
  td { border: 1px solid #d8d3c8; padding: 0.5rem 0.75rem; font-size: 9pt; }
  tr:nth-child(even) td { background: #f5f0e8; }
  a { color: #2563eb; text-decoration: underline; }
  hr { border: none; border-top: 1px solid #d8d3c8; margin: 1.5rem 0; }
  img { max-width: 100%; height: auto; }
  strong { font-weight: 700; }
  em { font-style: italic; }
`;
}

function templateSpecificCss(template: string): string {
  switch (template) {
    case "professional":
      return `
  body {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 11pt;
    color: #0f0e0c;
    background: white;
    line-height: 1.7;
  }
  h1 {
    font-size: 26pt;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 0.5rem;
    border-bottom: 2px solid #0f0e0c;
    padding-bottom: 0.5rem;
    page-break-after: avoid;
  }
  h2 {
    font-size: 15pt;
    font-weight: 600;
    margin-top: 1.8rem;
    margin-bottom: 0.5rem;
    border-left: 4px solid #c0651a;
    padding-left: 0.75rem;
    page-break-after: avoid;
  }
  h3 { font-size: 12pt; font-weight: 600; margin-top: 1.2rem; margin-bottom: 0.4rem; page-break-after: avoid; }
  blockquote {
    border-left: 4px solid #c0651a;
    padding: 0.5rem 1rem;
    margin: 1rem 0;
    color: #5a4d3f;
    font-style: italic;
  }
  a { color: #c0651a; }
`;

    case "modern":
      return `
  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 11pt;
    color: #0f0e0c;
    background: white;
    line-height: 1.7;
  }
  h1 {
    font-size: 26pt;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 0.5rem;
    color: #0f0e0c;
    page-break-after: avoid;
  }
  h2 {
    font-size: 15pt;
    font-weight: 600;
    margin-top: 1.8rem;
    margin-bottom: 0.5rem;
    color: #2d6a4f;
    page-break-after: avoid;
  }
  h3 { font-size: 12pt; font-weight: 600; margin-top: 1.2rem; margin-bottom: 0.4rem; page-break-after: avoid; }
  blockquote {
    border-left: 4px solid #2d6a4f;
    padding: 0.5rem 1rem;
    margin: 1rem 0;
    color: #5a4d3f;
    font-style: italic;
    background: #f5f0e8;
    border-radius: 0 6px 6px 0;
  }
  a { color: #c0651a; }
`;

    case "saas":
      return `
  body {
    font-family: 'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif;
    font-size: 10.5pt;
    color: #0f172a;
    background: #f8fafc;
    line-height: 1.65;
  }
  h1 {
    font-size: 24pt;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 0.35rem;
    color: #0f172a;
    page-break-after: avoid;
  }
  h2 {
    font-size: 14pt;
    font-weight: 600;
    margin-top: 1.6rem;
    margin-bottom: 0.45rem;
    color: #1d4ed8;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.25rem;
    page-break-after: avoid;
  }
  h3 { font-size: 11.5pt; font-weight: 600; margin-top: 1rem; color: #334155; page-break-after: avoid; }
  blockquote {
    border-left: 3px solid #3b82f6;
    background: #eff6ff;
    padding: 0.6rem 1rem;
    margin: 1rem 0;
    color: #1e3a5f;
    border-radius: 0 8px 8px 0;
    font-style: normal;
  }
  th { background: #1e293b; }
  a { color: #2563eb; }
`;

    case "document":
      return `
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    color: #111;
    background: white;
    line-height: 1.55;
    max-width: 100%;
  }
  h1 {
    font-size: 18pt;
    font-weight: 700;
    margin-bottom: 0.75rem;
    page-break-after: avoid;
  }
  h2 {
    font-size: 13pt;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.35rem;
    page-break-after: avoid;
  }
  h3 { font-size: 11.5pt; font-weight: 600; margin-top: 1rem; page-break-after: avoid; }
  blockquote {
    border-left: 2px solid #999;
    padding-left: 0.75rem;
    margin: 0.75rem 0;
    color: #444;
    font-style: italic;
  }
  pre { background: #f3f3f3; color: #111; border: 1px solid #ddd; }
  pre code { color: #111; }
  th { background: #333; }
  td { border-color: #ccc; }
  tr:nth-child(even) td { background: #fafafa; }
  code { background: #f0f0f0; color: #222; }
  a { color: #111; text-decoration: underline; }
`;

    case "compliance":
      return `
  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 10.5pt;
    color: #1a1a1a;
    background: white;
    line-height: 1.6;
  }
  .compliance-banner {
    border: 2px solid #1a1a1a;
    padding: 0.65rem 1rem;
    margin-bottom: 1.25rem;
    font-size: 9pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: #f4f4f4;
  }
  h1 {
    font-size: 22pt;
    font-weight: 700;
    margin-bottom: 0.5rem;
    page-break-after: avoid;
  }
  h2 {
    font-size: 13pt;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.4rem;
    counter-increment: none;
    border: 1px solid #333;
    padding: 0.35rem 0.6rem;
    background: #fafafa;
    page-break-after: avoid;
  }
  h3 { font-size: 11pt; font-weight: 600; margin-top: 1rem; page-break-after: avoid; }
  blockquote {
    border: 1px dashed #666;
    padding: 0.5rem 0.75rem;
    margin: 1rem 0;
    font-size: 9.5pt;
    color: #333;
    background: #fffdf7;
  }
  a { color: #0f0f0f; }
`;

    default:
      return templateSpecificCss("modern");
  }
}

function complianceBannerHtml(template: string): string {
  if (template !== "compliance") return "";
  return `<div class="compliance-banner">Documento para fins de conformidade e auditoria — revisar controles internos aplicáveis.</div>`;
}

export type BuildStyledDocumentOptions = {
  /**
   * Quando true (recomendado no servidor/Puppeteer), não carrega Google Fonts
   * por rede — evita timeouts se fonts.googleapis.com estiver lento ou bloqueado.
   * O CSS já define fallbacks (system-ui, Georgia, etc.).
   */
  skipRemoteFonts?: boolean;
};

/** Full HTML document for Puppeteer / print / data-URL fallback. */
export function buildStyledDocumentHtml(
  html: string,
  template: string,
  options?: BuildStyledDocumentOptions
): string {
  const css = templateSpecificCss(template);
  const banner = complianceBannerHtml(template);
  const skipFonts = options?.skipRemoteFonts === true;
  const fontLinks = skipFonts
    ? ""
    : `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="${FONTS}" rel="stylesheet"/>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
${fontLinks}
<style>
${baseRules()}
${css}
</style>
</head>
<body>${banner}${html}</body>
</html>`;
}
