export interface OcrResult { text: string; }

export async function extractTextWithLumen(_file: File): Promise<OcrResult> {
  throw new Error("Lumen OCR integration has not been configured. Verify the provider endpoint and credentials first.");
}
