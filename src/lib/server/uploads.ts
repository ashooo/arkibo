import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/tiff", "image/webp"]);

export class UploadValidationError extends Error {}
export function getUploadDirectory() {
  return path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads"));
}

export function validateUpload(file: File) {
  if (!file.name) throw new UploadValidationError("A file name is required.");
  if (!ACCEPTED_MIME_TYPES.has(file.type)) throw new UploadValidationError("Only PDF, PNG, JPEG, TIFF, and WebP files are supported.");
  if (file.size === 0) throw new UploadValidationError("The uploaded file is empty.");
  if (file.size > MAX_DOCUMENT_BYTES) throw new UploadValidationError("The uploaded file exceeds the 10 MiB limit.");
}

function safeExtension(name: string) {
  const extension = path.extname(name).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

export async function storeUpload(file: File) {
  validateUpload(file);
  const directory = getUploadDirectory();
  await mkdir(directory, { recursive: true });
  const storagePath = path.join(/* turbopackIgnore: true */ directory, `${randomUUID()}${safeExtension(file.name)}`);
  await writeFile(storagePath, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
  return storagePath;
}

export async function removeStoredUpload(storagePath: string) {
  const resolvedPath = resolveUploadPath(storagePath);
  await unlink(resolvedPath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
}

export async function readStoredUpload(storagePath: string) { return readFile(resolveUploadPath(storagePath)); }

function resolveUploadPath(storagePath: string) {
  const root = getUploadDirectory();
  const resolvedPath = path.resolve(storagePath);
  if (!resolvedPath.startsWith(`${root}${path.sep}`)) throw new Error("Refusing to access a file outside the upload directory.");
  return resolvedPath;
}
