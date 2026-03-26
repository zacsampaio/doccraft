import { NextRequest, NextResponse } from "next/server";
import { buildStyledDocumentHtml } from "@marktype/document-styles";
import { auth } from "@/auth";
import { markdownToHtml } from "@/lib/markdown";
import { isValidTemplate } from "@/lib/templates";
import type { Template } from "@/lib/types";
import { persistExportRecord, toDataUrl, uploadExportFile } from "@/lib/exports";
import { userFacingPdfErrorMessage } from "@/lib/pdf-export-errors";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Não esperar rede (fontes, imagens no HTML); só o DOM pronto. */
const PDF_CONTENT_WAIT: "domcontentloaded" = "domcontentloaded";
const PDF_CONTENT_TIMEOUT_MS = 25_000;

const MAX_INLINE_PDF_BYTES = 2_500_000;

async function renderPdfFromHtml(html: string): Promise<Buffer> {
  const isVercel = Boolean(process.env.VERCEL);
  if (isVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = await import("puppeteer-core");
    const executablePath = await chromium.executablePath();
    // @sparticuz/chromium 137+ inclui --headless na lista `args`; usar headless: false no Puppeteer.
    const browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: false,
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
              "O PDF ficou grande demais para enviar sem armazenamento configurado. Peça ao administrador para rever o Supabase (bucket e chave de serviço) ou use um documento mais curto.",
            ...(process.env.MARKTYPE_DEBUG_PDF === "1"
              ? { debug: errorMessage ?? "" }
              : {}),
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
    const raw =
      err instanceof Error ? err.message : String(err ?? "unknown");
    console.error("[generate-pdf]", err);
    const debugPdf = process.env.MARKTYPE_DEBUG_PDF === "1";
    const body: { error: string; debug?: string } = {
      error: userFacingPdfErrorMessage(raw),
    };
    if (debugPdf) {
      body.debug = raw;
    }
    return NextResponse.json(body, { status: 500 });
  }
}
