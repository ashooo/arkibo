import { and, eq, desc, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { matchTypeForDocument, expandSearchTerms, isExactOnlySearch, SEARCH_SIMILARITY_THRESHOLD, type SearchMatchType } from "@/lib/search/document-search";
import { searchSnippet, serializeDocument } from "./documents";

export type RankedDocument = ReturnType<typeof serializeDocument> & { snippet: string | null; matchType: SearchMatchType; score: number };
function makeSnippet(text: string | null, terms: string[]) {
  for (const term of terms) { const snippet = searchSnippet(text, term); if (snippet) return snippet; }
  return null;
}
export async function searchDocuments(query: string, studentId: string): Promise<RankedDocument[]> {
  const terms = expandSearchTerms(query);
  const scope = eq(documents.studentId, studentId);
  if (!terms.length) {
    const rows = await getDb().select().from(documents).where(scope).orderBy(desc(documents.uploadedAt)).limit(50);
    return rows.map((row) => ({ ...serializeDocument(row), snippet: null, matchType: "full_text", score: 0 }));
  }
  const exactOnly = isExactOnlySearch(query);
  const conditions = terms.map((term) => {
    const contains = `%${term}%`;
    const direct = sql`lower(${documents.originalName}) LIKE ${contains} OR lower(${documents.category}) LIKE ${contains} OR lower(${documents.searchMetadata}) LIKE ${contains} OR lower(coalesce(${documents.ocrText}, '')) LIKE ${contains}`;
    if (exactOnly) return sql`(${direct})`;
    return sql`(${direct} OR to_tsvector('simple', concat_ws(' ', ${documents.originalName}, ${documents.category}, ${documents.searchMetadata}, coalesce(${documents.ocrText}, ''))) @@ plainto_tsquery('simple', ${term}) OR similarity(lower(${documents.originalName}), ${term}) >= ${SEARCH_SIMILARITY_THRESHOLD} OR word_similarity(${term}, lower(${documents.searchMetadata})) >= ${SEARCH_SIMILARITY_THRESHOLD} OR word_similarity(${term}, lower(coalesce(${documents.ocrText}, ''))) >= ${SEARCH_SIMILARITY_THRESHOLD})`;
  });
  const scores = terms.map((term) => sql`greatest(
    CASE WHEN lower(${documents.originalName}) = ${term} THEN 100 WHEN lower(${documents.category}) = ${term} THEN 90 ELSE 0 END,
    CASE WHEN lower(${documents.originalName}) LIKE ${`%${term}%`} THEN 80 WHEN lower(${documents.searchMetadata}) LIKE ${`%${term}%`} THEN 78 WHEN lower(${documents.category}) LIKE ${`%${term}%`} THEN 75 WHEN lower(coalesce(${documents.ocrText}, '')) LIKE ${`%${term}%`} THEN 70 ELSE 0 END,
    CASE WHEN ${exactOnly} THEN 0 ELSE similarity(lower(${documents.originalName}), ${term}) * 50 END,
    CASE WHEN ${exactOnly} THEN 0 ELSE greatest(word_similarity(${term}, lower(${documents.searchMetadata})), word_similarity(${term}, lower(coalesce(${documents.ocrText}, '')))) * 40 END)`);
  const score = sql<number>`greatest(${sql.join(scores, sql`, `)})`;
  try {
    const rows = await getDb().select({ ...getTableColumns(documents), score }).from(documents).where(and(scope, sql`(${sql.join(conditions, sql` OR `)})`)).orderBy(desc(score), desc(documents.uploadedAt)).limit(50);
    return rows.map((row) => ({ ...serializeDocument(row), snippet: makeSnippet(row.ocrText, terms), matchType: matchTypeForDocument(row, query, terms), score: Number(row.score) }));
  } catch {
    const rows = await getDb().select().from(documents).where(and(scope, or(...terms.map((term) => or(ilike(documents.originalName, `%${term}%`), ilike(documents.category, `%${term}%`), ilike(documents.searchMetadata, `%${term}%`), ilike(documents.ocrText, `%${term}%`)))))).orderBy(desc(documents.uploadedAt)).limit(50);
    return rows.map((row) => ({ ...serializeDocument(row), snippet: makeSnippet(row.ocrText, terms), matchType: matchTypeForDocument(row, query, terms), score: 0 }));
  }
}
