export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/tiff", "image/webp"];
export function uploadError(file: { name: string; size: number; type: string }): string | null {
  if (!file.name || file.size === 0) return "Choose a file that isn't empty.";
  if (!DOCUMENT_MIME_TYPES.includes(file.type)) return "Choose a PDF, PNG, JPEG, TIFF, or WebP file.";
  if (file.size > MAX_DOCUMENT_BYTES) return "This file is too large. Choose a file under 10 MiB.";
  return null;
}
