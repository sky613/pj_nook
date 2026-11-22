"use client";

import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Calibration, SheetSpec } from "@/lib/types";
import { A4, PT_PER_MM } from "@/lib/units";
import { computeLabelLayout, type LabelLayoutInput, type TextMeasurer } from "@/lib/labels/layout";
import { qrDataUrl, dataUrlToBytes } from "@/lib/labels/qr";
import { emojiToPngDataUrl } from "@/lib/labels/emoji";
import { cellsPerPage, computeCellRects, expandByQty, paginate, textBaselinePdfY, toPdfRect } from "./layout";
import { loadFontBytes } from "./fonts";

export interface PrintItem {
  id: string; // label id
  qty: number;
  input: Omit<LabelLayoutInput, "width" | "height">;
}

export interface PrintOptions {
  spec: SheetSpec;
  calibration: Calibration;
  startIndex: number;
  items: PrintItem[];
  /** 칸 테두리 */
  drawCellBorders?: boolean;
}

export interface PrintResult {
  bytes: Uint8Array;
  pages: number;
  nextStartIndex: number;
  warnings: string[];
}

const hex = (h: string) => {
  const m = h.replace("#", "");
  const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/** 폰트에 없는 문자(이모지 등) 제거 */
const sanitize = (s: string) => s.replace(/[\p{Extended_Pictographic}️‍]/gu, "").replace(/\s+/g, " ").trim();

async function setupFonts(doc: PDFDocument) {
  doc.registerFontkit(fontkit);
  const [reg, bold] = await Promise.all([loadFontBytes("regular"), loadFontBytes("bold")]);
  const fontR = await doc.embedFont(reg, { subset: true });
  const fontB = await doc.embedFont(bold, { subset: true });
  const measure: TextMeasurer = (text, size, b) => ((b ? fontB : fontR).widthOfTextAtSize(sanitize(text) || " ", size) * 25.4) / 72;
  return { fontR, fontB, measure };
}

function drawCellBorder(page: PDFPage, x: number, y: number, w: number, h: number) {
  const r = toPdfRect(x, y, w, h);
  page.drawRectangle({ ...r, borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.4, color: undefined });
}

/** 라벨 PDF 생성 */
export async function generateLabelsPdf(opts: PrintOptions): Promise<PrintResult> {
  const { spec, calibration, startIndex } = opts;
  const doc = await PDFDocument.create();
  doc.setTitle("방라벨");
  const { fontR, fontB, measure } = await setupFonts(doc);
  const cells = computeCellRects(spec, calibration);
  const perPage = cellsPerPage(spec);
  const expanded = expandByQty(opts.items);
  const { placements, pages, nextStartIndex } = paginate(expanded.length, startIndex, perPage);
  const warnings: string[] = [];

  const qrCache = new Map<string, PDFImage>();
  const emojiCache = new Map<string, PDFImage | null>();
  const pageObjs: PDFPage[] = [];
  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([A4.widthMm * PT_PER_MM, A4.heightMm * PT_PER_MM]);
    pageObjs.push(page);
    if (opts.drawCellBorders) for (const c of cells) drawCellBorder(page, c.x, c.y, c.w, c.h);
  }

  for (const pl of placements) {
    const page = pageObjs[pl.page];
    const cell = cells[pl.cell];
    const item = expanded[pl.itemIndex];
    const layout = computeLabelLayout({ ...item.input, width: cell.w, height: cell.h }, measure);
    for (const w of layout.warnings) if (!warnings.includes(w)) warnings.push(w);

    for (const el of layout.elements) {
      const ox = cell.x;
      const oy = cell.y;
      switch (el.type) {
        case "text": {
          const text = sanitize(el.text);
          if (!text) break;
          const font: PDFFont = el.bold ? fontB : fontR;
          const tw = (font.widthOfTextAtSize(text, el.size) * 25.4) / 72;
          const x = el.align === "center" ? el.x + Math.max(0, (el.w - tw) / 2) : el.x;
          page.drawText(text, {
            x: (ox + x) * PT_PER_MM,
            y: textBaselinePdfY(oy + el.y, el.h, el.size),
            size: el.size,
            font,
            color: hex(el.color),
          });
          break;
        }
        case "qr": {
          let img = qrCache.get(el.data);
          if (!img) {
            img = await doc.embedPng(dataUrlToBytes(await qrDataUrl(el.data, 384)));
            qrCache.set(el.data, img);
          }
          page.drawImage(img, toPdfRect(ox + el.x, oy + el.y, el.size, el.size));
          break;
        }
        case "icon": {
          let img = emojiCache.get(el.emoji);
          if (img === undefined) {
            const url = emojiToPngDataUrl(el.emoji, 160);
            img = url ? await doc.embedPng(dataUrlToBytes(url)) : null;
            emojiCache.set(el.emoji, img);
          }
          if (img) page.drawImage(img, toPdfRect(ox + el.x, oy + el.y, el.size, el.size));
          break;
        }
        case "line":
          page.drawLine({
            start: { x: (ox + el.x1) * PT_PER_MM, y: (A4.heightMm - oy - el.y1) * PT_PER_MM },
            end: { x: (ox + el.x2) * PT_PER_MM, y: (A4.heightMm - oy - el.y2) * PT_PER_MM },
            thickness: el.width * PT_PER_MM,
            color: hex(el.color),
          });
          break;
        case "rect":
          page.drawRectangle({
            ...toPdfRect(ox + el.x, oy + el.y, el.w, el.h),
            borderColor: hex(el.color),
            borderWidth: el.width * PT_PER_MM,
            color: el.fill ? hex(el.fill) : undefined,
          });
          break;
      }
    }
  }

  const bytes = await doc.save();
  return { bytes, pages, nextStartIndex, warnings };
}

/** 테스트 인쇄: 칸 테두리와 번호만 */
export async function generateTestSheetPdf(spec: SheetSpec, calibration: Calibration): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("방라벨 테스트 인쇄");
  const { fontR } = await setupFonts(doc);
  const page = doc.addPage([A4.widthMm * PT_PER_MM, A4.heightMm * PT_PER_MM]);
  const cells = computeCellRects(spec, calibration);
  for (const c of cells) {
    drawCellBorder(page, c.x, c.y, c.w, c.h);
    // 십자 중심 표식
    const cx = (c.x + c.w / 2) * PT_PER_MM;
    const cy = (A4.heightMm - c.y - c.h / 2) * PT_PER_MM;
    page.drawLine({ start: { x: cx - 4, y: cy }, end: { x: cx + 4, y: cy }, thickness: 0.3, color: rgb(0.7, 0.7, 0.7) });
    page.drawLine({ start: { x: cx, y: cy - 4 }, end: { x: cx, y: cy + 4 }, thickness: 0.3, color: rgb(0.7, 0.7, 0.7) });
    page.drawText(String(c.index + 1), {
      x: (c.x + 1.5) * PT_PER_MM,
      y: (A4.heightMm - c.y - 4) * PT_PER_MM,
      size: 6,
      font: fontR,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
  const info = `${spec.name} · ${spec.cols}x${spec.rows} · ${spec.labelWidth}x${spec.labelHeight}mm · 보정 dx ${calibration.dx} / dy ${calibration.dy}`;
  page.drawText(sanitize(info), { x: 5 * PT_PER_MM, y: 3 * PT_PER_MM, size: 6, font: fontR, color: rgb(0.5, 0.5, 0.5) });
  return doc.save();
}

export function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
