# Arkibo

**Less paperwork. A clearer path to education.**

## The problem

Scholarship applicants often keep enrollment certificates, report cards, IDs, and other requirements across paper folders, phone galleries, and scattered files. Finding the right document and tracking missing requirements becomes repetitive and stressful, especially during applications and renewals.

## Our solution

Arkibo brings scholarship preparation into one workspace for learners across education levels. Users can upload and organize documents, search their contents, track application checklists, review academic grades, and browse announcements. An AI chatbot helps users find relevant documents and understand what their checklist still needs.

## How we use Lumen

Arkibo sends uploaded PDFs and images to **Lumen OCR**, checks their processing status, and retrieves extracted text. This turns scanned paperwork into searchable content. A separate local **Qwen model through Ollama** uses that text to suggest document categories, tags, and checklist matches, and answer document-related questions. Users review suggestions; Arkibo does not approve scholarship eligibility.

## Run locally

Requires Node.js 22.15+, npm, an existing PostgreSQL database with the project schema, Lumen API credentials, and Ollama for AI features.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`. Set `DATABASE_URL`, the `LUMEN_*` values, `OLLAMA_BASE_URL`, and `QWEN_MODEL`.
3. Start Ollama and install the configured model: `ollama pull qwen3.5:2b`.
4. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

Use the existing database as-is. Startup does not migrate, reset, or seed it; any required database changes need explicit approval. Keep credentials and uploaded personal documents out of version control.
