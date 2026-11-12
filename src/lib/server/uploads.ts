import path from "node:path";

export function getUploadDirectory() { return path.resolve(process.env.UPLOAD_DIR ?? "./data/uploads"); }
