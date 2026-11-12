import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { uploadError } from "../document-upload";

export class UploadValidationError extends Error {}
export function getUploadDirectory() {
  return path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads"));
}

export function validateUpload(file: File) {
  const error = uploadError(file);
  if (error) throw new UploadValidationError(error);
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
