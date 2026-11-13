export interface GradeDraft { subjectCode: string; subjectName: string; grade: string; }

// OCR layouts vary by school. These drafts deliberately require student review before saving.
export function parseGradeDrafts(ocrText: string): GradeDraft[] {
  const rows = new Map<string, GradeDraft>();
  for (const rawLine of ocrText.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    const match = line.match(/^([A-Z]{2,6}\s?\d{2,4}(?:\s+(?:LAB|LEC))?)\s+(.+?)\s+([0-5](?:\.\d{1,2})?|[A-DF][+-]?)$/i);
    if (!match) continue;
    const draft = { subjectCode: match[1].toUpperCase(), subjectName: match[2].trim(), grade: match[3].toUpperCase() };
    rows.set(`${draft.subjectCode}:${draft.subjectName}`, draft);
  }
  return [...rows.values()];
}
