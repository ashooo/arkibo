export const topics = {
  allowance: /\b(allowances?|pay[ -]?outs?|stipends?|disbursements?)\b/i,
  spes: /\b(spes|special program for employment of students)\b/i,
  scholarship: /\b(scholarships?|scholars?|iskolar)\b/i,
};

export function classifyAnnouncement(text) {
  const normalized = text.normalize("NFKC");
  return Object.entries(topics).filter(([, pattern]) => pattern.test(normalized)).map(([topic]) => topic);
}
