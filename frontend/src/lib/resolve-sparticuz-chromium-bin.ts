import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Localiza a pasta `bin` (ficheiros .br) do @sparticuz/chromium em runtime.
 * Não usar require.resolve aqui — o Webpack tenta analisar o ESM do pacote.
 * Na Vercel, `cwd` é `/var/task` e o trace deve incluir `node_modules/.../bin`.
 */
export function resolveSparticuzChromiumBinDir(): string {
  const cwd = process.cwd();
  const candidates = [
    join(cwd, "node_modules", "@sparticuz", "chromium", "bin"),
    join(cwd, "..", "node_modules", "@sparticuz", "chromium", "bin"),
  ];
  const tried: string[] = [];
  for (const p of candidates) {
    tried.push(p);
    if (existsSync(p)) return p;
  }
  throw new Error(
    `Chromium bin ausente no servidor (tentativas: ${tried.join(" | ")}).`
  );
}
