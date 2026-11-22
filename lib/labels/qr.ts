import QRCode from "qrcode";

export async function qrDataUrl(data: string, px = 256): Promise<string> {
  return QRCode.toDataURL(data, { margin: 0, width: px, errorCorrectionLevel: "M" });
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** QR 에 들어갈 절대 URL. 설정의 base 가 없으면 현재 origin */
export function qrUrl(path: string, baseUrl?: string): string {
  const base = baseUrl?.trim() || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base.replace(/\/$/, "")}${path}`;
}
