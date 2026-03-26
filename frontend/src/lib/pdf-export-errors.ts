/**
 * Mensagens para o utilizador final (sem jargão de dev).
 * Detalhe técnico só em logs do servidor ou com MARKTYPE_DEBUG_PDF=1.
 */

export function isTimeoutLikeMessage(msg: string): boolean {
  return /timeout|timed out|navigation timeout|net::err/i.test(msg);
}

function isLaunchOrBinaryError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("could not find chrome") ||
    m.includes("failed to launch") ||
    m.includes("executable") ||
    m.includes("browser process") ||
    m.includes("spawn enoent") ||
    m.includes("no such file")
  );
}

function isResourceError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("enospc") ||
    m.includes("out of memory") ||
    m.includes("epipe") ||
    m.includes("heap") ||
    m.includes("allocation failed")
  );
}

export function userFacingPdfErrorMessage(raw: string): string {
  if (/brotli files|chromium\/bin|chromium bin ausente/i.test(raw)) {
    return "O PDF não pôde ser preparado no servidor de alojamento. Volte a publicar a aplicação; se continuar, confirme que o projeto na Vercel usa a pasta «frontend» e instalação a partir da raiz do monorepo.";
  }
  if (isTimeoutLikeMessage(raw)) {
    return "A geração do PDF demorou demais. Tente novamente; se o texto tiver muitas imagens ou ligações lentas, simplifique o conteúdo.";
  }
  if (isLaunchOrBinaryError(raw)) {
    return "O serviço de PDF não arrancou corretamente no servidor. Tente de novo mais tarde; se repetir, avise quem gere a infraestrutura (o detalhe técnico fica nos registos do servidor).";
  }
  if (isResourceError(raw)) {
    return "O documento é grande demais ou o servidor ficou sem recursos. Tente reduzir imagens ou o tamanho do texto.";
  }
  return "Não foi possível gerar o PDF. Atualize a página e tente novamente.";
}
