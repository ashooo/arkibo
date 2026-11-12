import { and, eq, desc, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { matchTypeForDocument, expandSearchTerms, isExactOnlySearch, SEARCH_SIMILARITY_THRESHOLD, type SearchMatchType } from "@/lib/search/document-search";
import { searchSnippet, serializeDocument } from "./documents";

export type RankedDocument = ReturnType<typeof serializeDocument> & { snippet: string | null; matchType: SearchMatchType; score: number };

type RawRow = {
  id: string; student_id: string | null; original_name: string; mime_type: string; storage_path: string; category: string;
  provider_document_id: string | null; ocr_text: string | null; ocr_status: "pending" | "complete" | "failed"; ocr_error: string | null; uploaded_at: Date; search_score: string | number;
};

function makeSnippet(text: string | null, terms: string[]) {
  for (const term of terms) { const snippet = searchSnippet(text, term); if (snippet) return snippet; }
  return null;
}

export async function searchDocuments(query: string, studentId: string): Promise<RankedDocument[]> {
  const terms = expandSearchTerms(query);
  if (!terms.length) {
    const rows = await getDb().select().from(documents).where(eq(documents.studentId, studentId)).orderBy(desc(documents.uploadedAt)).limit(50);
    return rows.map((row) => ({ ...serializeDocument(row), snippet: null, matchType: "full_text", score: 0 }));
  }

  const exactOnly = isExactOnlySearch(query);
  const conditions = terms.map((term) => {
    const contains = `%${term}%`;
    const exact = sql`lower(${documents.originalName}) = ${term} OR lower(${documents.category}) = ${term}`;
    const fullText = sql`to_tsvector('simple', concat_ws(' ', ${documents.originalName}, ${documents.category}, coalesce(${documents.ocrText}, ''))) @@ plainto_tsquery('simple', ${term})`;
    if (exactOnly) return sql`(${exact} OR lower(${documents.originalName}) LIKE ${contains} OR lower(${documents.category}) LIKE ${contains} OR lower(coalesce(${documents.ocrText}, '')) LIKE ${contains})`;
    return sql`(${exact} OR ${fullText} OR lower(${documents.originalName}) LIKE ${contains} OR lower(${documents.category}) LIKE ${contains} OR lower(coalesce(${documents.ocrText}, '')) LIKE ${contains} OR similarity(lower(${documents.originalName}), ${term}) >= ${SEARCH_SIMILARITY_THRESHOLD} OR word_similarity(${term}, lower(coalesce(${documents.ocrText}, ''))) >= ${SEARCH_SIMILARITY_THRESHOLD})`;
  });

  const scoreTerms = terms.map((term) => sql`greatest(
    CASE WHEN lower(${documents.originalName}) = ${term} THEN 100 WHEN lower(${documents.category}) = ${term} THEN 90 WHEN lower(coalesce(${documents.ocrText}, '')) LIKE ${`%${term}%`} THEN 70 ELSE 0 END,
    CASE WHEN lower(${documents.originalName}) LIKE ${`%${term}%`} THEN 80 WHEN lower(${documents.category}) LIKE ${`%${term}%`} THEN 75 ELSE 0 END,
    CASE WHEN ${exactOnly} THEN 0 ELSE similarity(lower(${documents.originalName}), ${term}) * 50 END,
    CASE WHEN ${exactOnly} THEN 0 ELSE word_similarity(${term}, lower(coalesce(${documents.ocrText}, ''))) * 40 END
  )`);

  try {
    const result = await getDb().execute<RawRow>(sql`SELECT ${sql.raw('"documents".*')}, greatest(${sql.join(scoreTerms, sql`, `)}) AS search_score FROM ${documents} WHERE ${documents.studentId} = ${studentId} AND (${sql.join(conditions, sql` OR `)}) ORDER BY search_score DESC, ${documents.uploadedAt} DESC LIMIT 50`);
    const rows = ("rows" in result ? result.rows : result) as RawRow[];
    return rows.map((row) => {
      const document = serializeDocument({ id: row.id, studentId: row.student_id, originalName: row.original_name, mimeType: row.mime_type, storagePath: row.storage_path, category: row.category, providerDocumentId: row.provider_document_id, ocrText: row.ocr_text, ocrStatus: row.ocr_status, ocrError: row.ocr_error, uploadedAt: new Date(row.uploaded_at) });
      return { ...document, snippet: makeSnippet(document.ocrText, terms), matchType: matchTypeForDocument(document, query, terms), score: Number(row.search_score) };
    });
  } catch {
    const fallback = await getDb().select().from(documents).where(and(eq(documents.studentId, studentId), or(...terms.map((term) => or(ilike(documents.originalName, `%${term}%`), ilike(documents.category, `%${term}%`), ilike(documents.ocrText, `%${term}%`)))))).orderBy(desc(documents.uploadedAt)).limit(50);
    return fallback.map((row) => ({ ...serializeDocument(row), snippet: makeSnippet(row.ocrText, terms), matchType: matchTypeForDocument(row, query, terms), score: 0 }));
  }
}
