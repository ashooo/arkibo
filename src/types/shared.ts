export type ApplicationType = "new" | "renewal";
export type OcrStatus = "pending" | "complete" | "failed";
export type ChecklistStatus = "missing" | "uploaded" | "prepared" | "needs_attention";

export interface StudentProfile { id: string; displayName: string; applicationType: ApplicationType; }
export interface AcademicTerm { id: string; studentId: string; academicYear: string; semester: string; }

export interface StoredDocument {
  id: string;
  studentId: string | null;
  originalName: string;
  mimeType: string;
  category: string;
  providerDocumentId: string | null;
  ocrText: string | null;
  ocrStatus: OcrStatus;
  ocrError: string | null;
  uploadedAt: string;
  tags: string[];
  classification: import("@/lib/ai/document-classification").ClassificationSuggestion | null;
  classificationStatus: string;
  classificationError: string | null;
  classificationConfirmedAt: string | null;
  metadataVersion: number;
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
