import { NextRequest, NextResponse } from "next/server";
import { buildStyledDocumentHtml } from "@marktype/document-styles";
import { auth } from "@/auth";
import { markdownToHtml } from "@/lib/markdown";
import { isValidTemplate } from "@/lib/templates";
import type { Template } from "@/lib/types";
import { persistExportRecord, toDataUrl, uploadExportFile } from "@/lib/exports";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Não esperar rede (fontes, imagens no HTML); só o DOM pronto. */
const PDF_CONTENT_WAIT: "domcontentloaded" = "domcontentloaded";
const PDF_CONTENT_TIMEOUT_MS = 25_000;

const MAX_INLINE_PDF_BYTES = 2_500_000;

function isTimeoutLikeMessage(msg: string): boolean {
  return /timeout|timed out|navigation timeout|net::err/i.test(msg);
}

async function renderPdfFromHtml(html: string): Promise<Buffer> {
  const isVercel = Boolean(process.env.VERCEL);
  if (isVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = await import("puppeteer-core");
    const executablePath = await chromium.executablePath();
    const browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: PDF_CONTENT_WAIT,
        timeout: PDF_CONTENT_TIMEOUT_MS,
      });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "24mm", right: "20mm", bottom: "24mm", left: "20mm" },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  const puppeteer = await import("puppeteer");
  const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  const browser = await puppeteer.default.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: PDF_CONTENT_WAIT,
      timeout: PDF_CONTENT_TIMEOUT_MS,
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "24mm", right: "20mm", bottom: "24mm", left: "20mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { markdown, template: rawTemplate } = (await req.json()) as {
      markdown: string;
      template: string;
    };

    if (!markdown) {
      return NextResponse.json({ error: "markdown is required" }, { status: 400 });
    }

    if (!rawTemplate || !isValidTemplate(rawTemplate)) {
      return NextResponse.json({ error: "template inválido" }, { status: 400 });
    }

    const template = rawTemplate as Template;
    const html = markdownToHtml(markdown);
    const fullHtml = buildStyledDocumentHtml(html, template, {
      skipRemoteFonts: true,
    });
    const pdfBuffer = await renderPdfFromHtml(fullHtml);
    const filename = `docs/${Date.now()}-${template}.pdf`;
    const { publicUrl, errorMessage } = await uploadExportFile(
      filename,
      pdfBuffer,
      "application/pdf"
    );

    if (!publicUrl) {
      console.error("[generate-pdf] Supabase upload error:", errorMessage);
      if (pdfBuffer.length > MAX_INLINE_PDF_BYTES) {
        return NextResponse.json(
          {
            error:
              "Upload no Supabase falhou e o PDF é grande demais para enviar sem Storage. Confirma SUPABASE_SERVICE_ROLE_KEY, o bucket «pdfs» e as migrations. Detalhe: " +
              (errorMessage ?? "desconhecido"),
          },
          { status: 503 }
        );
      }
      return NextResponse.json({
        url: toDataUrl("application/pdf", pdfBuffer),
        note: "Upload no Supabase falhou; retornando arquivo direto em base64.",
      });
    }

    const session = await auth();
    const sessionSub =
      session?.user?.id && session.user.id.length > 0
        ? session.user.id
        : null;

    await persistExportRecord({
      markdown,
      template,
      fileUrl: publicUrl,
      title: "Generated PDF",
      sessionSub,
    });

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[generate-pdf]", err);
    const raw =
      err instanceof Error ? err.message : String(err ?? "PDF generation failed");
    const debugPdf =
      process.env.NODE_ENV === "development" ||
      process.env.MARKTYPE_DEBUG_PDF === "1";
    if (isTimeoutLikeMessage(raw)) {
      return NextResponse.json(
        {
          error: debugPdf
            ? raw
            : "Timeout ao gerar o PDF. Reduz imagens externas no Markdown ou define PUPPETEER_EXECUTABLE_PATH se o Chromium embutido falhar.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        error: debugPdf
          ? raw
          : "Falha ao gerar o PDF (Puppeteer/Chromium). Em dev vê o terminal do Next; ou MARKTYPE_DEBUG_PDF=1 para mensagem completa na API.",
      },
      { status: 500 }
    );
  }
}
