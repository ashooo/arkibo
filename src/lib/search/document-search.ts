export type SearchMatchType = "exact" | "category" | "ocr" | "synonym" | "full_text" | "fuzzy";

const SYNONYMS: Record<string, readonly string[]> = {
  cor: ["certificate of registration"],
  cr: ["certificate of registration"],
  coe: ["certificate of enrollment"],
  ogr: ["official grade report", "report of grades"],
  or: ["official receipt"],
  id: ["student id", "identification card"],
  grades: ["ogr", "official grade report", "report of grades"],
  enrollment: ["certificate of enrollment", "certificate of registration"],
  tuition: ["tuition fee", "assessment of fees"],
  "proof of enrollment": ["certificate of registration", "certificate of enrollment"],
  "report card": ["official grade report", "academic records"],
  itr: ["income tax return"],
  "proof of income": ["income tax return"],
  "proof of residency": ["certificate of residency", "barangay certificate"],
};

const IDENTIFIER_ALIASES = new Set(["cor", "cr", "coe", "ogr", "or", "id"]);

export function normalizeSearchText(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function expandSearchTerms(query: string) {
  const original = normalizeSearchText(query);
  if (!original) return [];
  const expanded = new Set([original]);
  for (const token of original.split(" ")) {
    for (const equivalent of SYNONYMS[token] ?? []) expanded.add(normalizeSearchText(equivalent));
  }
  for (const [alias, equivalents] of Object.entries(SYNONYMS)) {
    const includesPhrase = (phrase: string) => ` ${original} `.includes(` ${normalizeSearchText(phrase)} `);
    if (includesPhrase(alias)) equivalents.forEach((equivalent) => expanded.add(normalizeSearchText(equivalent)));
    if (equivalents.some(includesPhrase)) expanded.add(alias);
  }
  return [...expanded];
}

export function isExactOnlySearch(query: string) {
  const normalized = normalizeSearchText(query);
  return /^\d{4,}$/.test(normalized) || /^[a-z]{1,6}\s?\d{2,6}$/.test(normalized) || IDENTIFIER_ALIASES.has(normalized);
}

export function matchTypeForDocument(input: { originalName: string; category: string; ocrText: string | null; searchMetadata?: string }, query: string, terms: string[]): SearchMatchType {
  const normalizedQuery = normalizeSearchText(query);
  const name = normalizeSearchText(input.originalName);
  const category = normalizeSearchText(`${input.category} ${input.searchMetadata ?? ""}`);
  const ocr = normalizeSearchText(input.ocrText ?? "");
  if (name === normalizedQuery) return "exact";
  if (category === normalizedQuery) return "category";
  if (ocr.includes(normalizedQuery)) return "ocr";
  if (terms.some((term) => term !== normalizedQuery && (name.includes(term) || category.includes(term) || ocr.includes(term)))) return "synonym";
  if (name.includes(normalizedQuery) || category.includes(normalizedQuery) || ocr.includes(normalizedQuery)) return "full_text";
  return "fuzzy";
}

export const SEARCH_SIMILARITY_THRESHOLD = 0.5;
