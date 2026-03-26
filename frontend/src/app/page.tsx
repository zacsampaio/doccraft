"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { PENDING_IMPORT_STORAGE_KEY } from "@/lib/pending-import";
import { Header } from "@/components/Header";
import { EditorPanel } from "@/components/EditorPanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { StatusBar } from "@/components/StatusBar";
import { SiteFooter } from "@/components/SiteFooter";
import { WorkspaceTabs, type WorkspaceMobileTab } from "@/components/WorkspaceTabs";
import { WorkspaceChrome } from "@/components/WorkspaceChrome";
import { cn } from "@/lib/utils";
import type { Template } from "@/lib/types";

const DEFAULT_MARKDOWN = `# MarkType

> Transform your README into beautiful documentation.

## Features

- 📝 **Paste Markdown** or import directly from GitHub
- 🎨 **Multiple Templates** — Professional ABNT or Modern styles
- 📄 **Export PDF** with a single click
- ⚡ **Live Preview** as you type

## Installation

\`\`\`bash
npm install marktype
cd my-project
npx marktype init
\`\`\`

## Usage

\`\`\`typescript
import { MarkType } from 'marktype';

const doc = new MarkType({
  template: 'professional',
  output: 'pdf',
});

await doc.generate('./README.md');
\`\`\`

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| template | string | \`modern\` | Document template |
| output | string | \`pdf\` | Output format |
| lang | string | \`en\` | Document language |

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
`;

export default function Home() {
  const pathname = usePathname();
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [importedRepoLabel, setImportedRepoLabel] = useState<string | null>(
    null
  );
  const [importToken, setImportToken] = useState(0);
  const [template, setTemplate] = useState<Template>("modern");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [exportErrorDetail, setExportErrorDetail] = useState<string | null>(
    null
  );
  const [mobileTab, setMobileTab] = useState<WorkspaceMobileTab>("edit");

  useEffect(() => {
    if (pathname !== "/") return;
    const raw = sessionStorage.getItem(PENDING_IMPORT_STORAGE_KEY);
    if (!raw) return;
    try {
      const p = JSON.parse(raw) as { markdown?: string; repoName?: string };
      if (typeof p.markdown === "string") {
        setMarkdown(p.markdown);
        setImportedRepoLabel(p.repoName ?? null);
        setImportToken((t) => t + 1);
      }
    } catch {
      /* ignore */
    } finally {
      sessionStorage.removeItem(PENDING_IMPORT_STORAGE_KEY);
    }
  }, [pathname]);

  const triggerDownload = useCallback(async (url: string, filename: string) => {
    if (url.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    try {
      const fileRes = await fetch(url, { mode: "cors" });
      if (!fileRes.ok) {
        throw new Error("fetch not ok");
      }
      const blob = await fileRes.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }, []);

  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    setExportStatus("loading");
    setExportErrorDetail(null);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown, template }),
      });
      let data: { url?: string; error?: string; note?: string } = {};
      try {
        data = await res.json();
      } catch {
        setExportErrorDetail("Resposta inválida do servidor.");
        setExportStatus("error");
        return;
      }
      if (!res.ok || typeof data.error === "string") {
        setExportErrorDetail(
          typeof data.error === "string"
            ? data.error
            : "Não foi possível concluir o pedido. Tente novamente."
        );
        setExportStatus("error");
        return;
      }
      if (data.url) {
        await triggerDownload(data.url, "documento.pdf");
        setExportStatus("success");
        if (data.note) {
          console.info("[export]", data.note);
        }
      } else {
        setExportErrorDetail(
          "O servidor não devolveu URL do PDF. Confira Supabase e variáveis de ambiente."
        );
        setExportStatus("error");
      }
    } catch {
      setExportErrorDetail("Erro de rede ou ao iniciar o download.");
      setExportStatus("error");
    } finally {
      setExportingPdf(false);
    }
  }, [markdown, template, triggerDownload]);

  return (
    <div className="marktype-app flex min-h-dvh flex-col bg-parchment bg-paper-texture">
      <Header />

      <div className="flex min-h-0 flex-1 flex-col px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden rounded-2xl border border-ink-200/90 bg-white/95 shadow-[0_4px_6px_-1px_rgba(35,30,24,0.06),0_20px_40px_-12px_rgba(35,30,24,0.12)] backdrop-blur-sm">
          <WorkspaceTabs active={mobileTab} onChange={setMobileTab} />

          <WorkspaceChrome mobileTab={mobileTab} template={template} />

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <section
              className={cn(
                "flex min-h-[min(420px,55vh)] min-w-0 flex-1 flex-col border-ink-200/80 bg-parchment-50/90 lg:min-h-0",
                "border-b lg:border-b-0 lg:border-r",
                mobileTab !== "edit" && "hidden lg:flex"
              )}
              aria-label="Editor de Markdown"
            >
              <EditorPanel
                markdown={markdown}
                onMarkdownChange={setMarkdown}
                importedRepoName={importedRepoLabel}
                importToken={importToken}
                onImportedRepoConsumed={() => setImportedRepoLabel(null)}
              />
            </section>

            <section
              className={cn(
                "flex min-h-[min(420px,55vh)] min-w-0 flex-1 flex-col bg-white lg:min-h-0",
                mobileTab !== "preview" && "hidden lg:flex"
              )}
              aria-label="Pré-visualização"
            >
              <PreviewPanel
                markdown={markdown}
                template={template}
                onTemplateChange={setTemplate}
                onExportPdf={handleExportPdf}
                exportingPdf={exportingPdf}
                exportStatus={exportStatus}
                exportErrorDetail={exportErrorDetail}
              />
            </section>
          </div>

          <StatusBar markdown={markdown} template={template} />
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
