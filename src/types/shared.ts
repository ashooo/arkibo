export type ApplicationType = "new" | "renewal";
export type OcrStatus = "pending" | "complete" | "failed";
export type ChecklistStatus = "missing" | "uploaded" | "prepared" | "needs_attention";

export interface StoredDocument {
  id: string;
  originalName: string;
  mimeType: string;
  category: string;
  ocrText: string | null;
  ocrStatus: OcrStatus;
}

export interface ChecklistItem {
  id: string;
  requirementId: string;
  status: ChecklistStatus;
  documentIds: string[];
  notes?: string;
}

export interface GradeEntry {
  id: string;
  termId: string;
  sourceDocumentId: string | null;
  subjectCode: string;
  subjectName: string;
  grade: string;
  verified: boolean;
}
