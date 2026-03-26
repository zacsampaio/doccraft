"use client";

import { useMemo } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { markdownToHtml, parseMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import type { Template } from "@/lib/types";
import { TEMPLATE_OPTIONS } from "@/lib/templates";
import {
  ComplianceTemplate,
  DocumentTemplate,
  ModernTemplate,
  ProfessionalTemplate,
  SaasTemplate,
} from "@/components/preview-templates";

interface PreviewPanelProps {
  markdown: string;
  template: Template;
  onTemplateChange: (t: Template) => void;
  onExportPdf: () => void;
  exportingPdf: boolean;
  exportStatus: "idle" | "loading" | "success" | "error";
  /** Mensagem vinda da API ou do cliente quando exportStatus === "error" */
  exportErrorDetail?: string | null;
}

export function PreviewPanel({
  markdown,
  template,
  onTemplateChange,
  onExportPdf,
  exportingPdf,
  exportStatus,
  exportErrorDetail,
}: PreviewPanelProps) {
  const { html, parsed } = useMemo(() => {
    const parsed = parseMarkdown(markdown);
    const html = markdownToHtml(markdown);
    return { html, parsed };
  }, [markdown]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-ink-200/90 bg-gradient-to-b from-white to-ink-50/30 px-5 py-3 sm:px-6">
        <label
          htmlFor="preview-template-select"
          className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-ink-500"
        >
          Modelo do documento
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="min-w-0 flex-1">
            <select
              id="preview-template-select"
              value={template}
              onChange={(e) => onTemplateChange(e.target.value as Template)}
              className="w-full rounded-lg border border-ink-200 bg-white py-2.5 pl-3 pr-8 text-sm font-medium text-ink-900 shadow-sm outline-none focus:border-ink-950 focus:ring-2 focus:ring-ink-950/10"
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onExportPdf}
            disabled={exportingPdf}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md transition-all duration-200 sm:min-w-[140px]",
              "bg-ink-950 text-parchment hover:bg-ink-900 hover:shadow-lg",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 disabled:shadow-sm"
            )}
          >
            {exportingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Gerando PDF…
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" aria-hidden />
                Exportar PDF
              </>
            )}
          </button>
        </div>
        {exportStatus === "success" && (
          <p className="mt-2 text-xs font-medium text-jade" role="status">
            PDF gerado — download iniciado.
          </p>
        )}
        {exportStatus === "error" && (
          <p className="mt-2 text-xs text-red-700" role="alert">
            {exportErrorDetail?.trim()
              ? exportErrorDetail
              : "Não foi possível exportar o PDF. Tente novamente."}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          {template === "professional" && (
            <ProfessionalTemplate
              html={html}
              title={parsed.title}
              description={parsed.description}
            />
          )}
          {template === "modern" && (
            <ModernTemplate
              html={html}
              title={parsed.title}
              description={parsed.description}
            />
          )}
          {template === "saas" && (
            <SaasTemplate
              html={html}
              title={parsed.title}
              description={parsed.description}
            />
          )}
          {template === "document" && (
            <DocumentTemplate
              html={html}
              title={parsed.title}
              description={parsed.description}
            />
          )}
          {template === "compliance" && (
            <ComplianceTemplate
              html={html}
              title={parsed.title}
              description={parsed.description}
            />
          )}
        </div>
      </div>
    </div>
  );
}
