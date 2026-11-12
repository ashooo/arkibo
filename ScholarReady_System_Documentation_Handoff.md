# ScholarReady

**System Documentation & Development Handoff**  
**OVERCLOCK 2026 — Team ASCII**  
**Version:** 1.1 (Hackathon MVP specification - revised team assignments)  
**Prepared:** November 12, 2026  
**Submission deadline:** November 13, 2026, 2:00 PM (Philippine time)

> **Document status:** Agreed implementation direction, not proof of a completed application. API paths, schema, and interfaces below are proposed internal contracts. The exact Lumen endpoint and request format still require validation against the event documentation.

## 1. Executive summary

ScholarReady is a web application for Pasig City college students preparing a new scholarship application or renewal. It provides a **scholarship requirements checklist**, a **searchable scanned-document library**, and an **editable academic grade history**, with a single dashboard for progress and announcements.

**Key principle:** The **Scholarship Checklist** and **Document Scanner** are different, standalone features. The checklist tracks preparation; the scanner uses Lumen OCR to read text inside images or PDFs and make those documents searchable. Students can optionally link a scanned document to a checklist requirement. The Grade History can reuse OCR text from an OGR after user verification.

**Challenge alignment:** Working web app; at least one **real, functioning Lumen OCR or Lumen AI Chat call**; specific Philippine user group; SDG 4 (Quality Education). Potential stakeholder: Pasig City Education Department / scholarship office; **no partnership is claimed**.

### 1.1 Target users

- **New applicants:** Follow application requirements and prepare supporting documents, essay, and interview items.
- **Renewal scholars:** Track updated academic records, proof of enrollment, and renewal paperwork.

### 1.2 What the MVP must demonstrate

1. Select New Applicant or Renewal Scholar.
2. View a requirement checklist and change item status manually.
3. Upload a demo image/PDF; successfully send it to the real Lumen OCR service.
4. Store its text and **search inside the scanned document**.
5. Attach an existing stored document to a checklist item.
6. Open an OGR, review/edit extracted grades, and save them under a semester.

## 2. Scope and priorities

| Priority | Feature | MVP acceptance condition |
|:--|:--|:--|
| P0 | Scholarship Checklist | Separate new/renewal lists; manual status updates; attach existing document |
| P0 | Lumen OCR gateway | Real authenticated API request succeeds; errors are shown honestly |
| P0 | Document Scanner & Search | Image/PDF upload, OCR text stored, keyword search across extracted text |
| P0 | My Documents | View uploaded files, file metadata, OCR status, and associated records |
| P0 | Grade History | Grades grouped by term; editable extraction review; save verified entries |
| P0 | Dashboard | Navigation, application type, progress overview |
| P1 | Notifications | Clearly labeled *sample* allowance/SPES scholarship announcements |
| P2 | Essay/interview assistant | Simple guidance only if core functionality is complete |

**Out of scope for the hackathon:** Official scholarship submission, government account integration, online payment, live allowance tracking, AI eligibility/approval decisions, production multi-user authentication, cloud file synchronization, mobile app, semantic/vector search, and automatic official verification of documents.

### 2.1 Important product rules

- The checklist works without uploading or scanning documents.
- The scanner works independently of the checklist.
- **Attaching** a document does not mean the scholarship office verified it.
- Scanning a file does **not** automatically mark any requirement complete.
- OCR is a reading aid. **Students verify and correct** text/grades before confirming them.
- Do not claim that sample announcements are live or official.
- Requirement wording must be verified against official Pasig scholarship information before public release; label sample content clearly in the demo.

## 3. Functional specifications

### 3.1 Onboarding and Dashboard (Developer 4 - UI/UX)

**Inputs:** Application type (`new` or `renewal`); optional local demo profile.  
**Outputs:** Relevant checklist, progress counts, recently uploaded files, grade summary, and sample announcements.

**Behavior:** The student selects application type. The dashboard displays the corresponding checklist, shows progress based on student-confirmed states, and links to Scanner, Documents, Grades, and Checklist. For the hackathon, a clearly labeled single demo profile is sufficient.

### 3.2 Scholarship Checklist (Developer 2)

**Purpose:** Track which scholarship requirements are missing, uploaded, prepared, or need attention. This is **not an OCR tool**.

**Capabilities:**

- Separate templates for new application and renewal.
- Manual status changes; progress totals; requirement notes.
- Attach/detach an **existing** document from the shared library, or navigate to upload.
- Review attachment name and preview it.
- Mark a requirement **Prepared** only upon student action.

**Statuses:** `missing`, `uploaded`, `prepared`, `needs_attention`.  
**Rule:** A document association can set a visual `uploaded` state if the user accepts that change; it must **never** silently set `prepared`.

### 3.3 Document Scanner & Search (Developer 1)

**Purpose:** Let students find information *inside images and PDFs*, not merely search filenames.

**Flow:** Upload → save original → request Lumen OCR → save extracted text → search keywords → open matched document and see its relevant text snippet.

**Required behavior:**

- Accept JPG, PNG, and PDF in the UI; validate server-side file type/size.
- Preserve the original file for preview/reuse.
- Save OCR status: `pending`, `complete`, or `failed`.
- Search filename and OCR-extracted text; return matching snippets.
- Allow OCR retry on failure and manual metadata edits.
- Treat OCR text as untrusted extracted content, not authoritative data.

**Search implementation:** Start with PostgreSQL `ILIKE` for filenames and extracted text; use parameterized queries via Drizzle. A full-text index (`tsvector`/GIN) is optional, not a prerequisite. Exact word highlighting *inside the image* is optional and requires reliable OCR coordinates.

**Example:** Search “student number” → find that phrase within a scanned Certificate of Registration and show the matching excerpt.

### 3.4 My Documents (Developer 1)

**Purpose:** Shared library for all uploaded files. The scanner is the OCR/search interaction, while My Documents is the collection/management view.

**Functions:** Upload, list, categorize, preview/download, delete, see scan status, and select existing documents from Checklist or Grade History. Supported example categories: Student ID, OGR, OR, CR, enrollment proof, others. Categories do **not** imply mandatory scholarship requirements.

**Storage:** Local original files in a non-public server directory; metadata and OCR text in PostgreSQL. Keep stable IDs so other features reference the same original rather than making copies.

### 3.5 Grade History (Developer 1)

**Purpose:** View grades by school year/semester and reduce manual re-entry from OGRs.

**Flow:** Select academic year/semester → choose existing OGR or upload one → obtain OCR text → propose rows (subject code, name, grade) → user edits/adds/removes entries → user explicitly confirms → save.

**Fallback:** Manual grade entry must work if parsing is inaccurate. OCR returns **text**, not necessarily structured grade data. The application parser creates tentative rows; parsing mistakes must never overwrite confirmed records without review.

### 3.6 News & Notifications (Developer 3, P1)

A standalone news and announcements section covering scholarship announcements, allowance-related notices, and SPES opportunities. For this MVP, show **clearly labeled demo/sample cards** or manually curated **official source links** with a source and publication date. Never imply that sample data is live, current, or from an official partner. No push system or live-feed API is necessary. Developer 3 owns the feature data, filtering, cards, and optional read/unread state; Developer 4 owns the shared visual design system.

## 4. Agreed technology stack

| Layer | Decision | Notes |
|:--|:--|:--|
| App | **Next.js App Router + TypeScript** | Frontend and backend in one repository |
| UI | **Tailwind CSS + shadcn/ui** | Consistent reusable components |
| API | **Next.js Route Handlers** | File processing and server-side Lumen access |
| Database | **Local PostgreSQL** | Free; run on each developer's machine or Docker |
| ORM | **Drizzle ORM** | Typed schema and versioned migrations |
| Files | **Local filesystem** | Store outside `/public`; do not commit uploads |
| OCR | **Lumen OCR API** | Actual external API must be confirmed/tested |
| Search | **PostgreSQL `ILIKE`** | Simple OCR text search for the MVP |
| Source control | **Public GitHub repository** | Create before coding; commit regularly |
| Demo | **Locally hosted Next.js + Postgres** | Keep demo machine and database running |

**Deployment note:** A local PostgreSQL instance and local upload folder cannot be consumed directly by a normal independently hosted Vercel app. The simplest demo is a locally running web app on a laptop. A tunnel is optional if remote access is truly required, with security safeguards and only synthetic demo data.

## 5. System architecture

```text
Browser (Next.js UI)
  ├─ Dashboard / Onboarding
  ├─ Scholarship Checklist
  ├─ Document Scanner + Search
  ├─ My Documents
  ├─ Grade History
  └─ News & Notifications
             │ HTTP
             ▼
Next.js Route Handlers (server)
  ├─ Document upload / preview / search
  ├─ Checklist and document associations
  ├─ Academic history APIs
  ├─ Optional news/notification feed
  └─ Lumen OCR proxy ───────► External Lumen API
             │
      ┌──────┴───────────┐
      ▼                  ▼
 Local PostgreSQL    Local uploads directory
 (metadata, OCR,      (image/PDF originals)
  grades, checklist)
```

**Integration boundaries:** The scanner sends files to the OCR gateway; My Documents is the **single source** of stored document metadata/text; the checklist saves references to document IDs; Grade History can reuse a document's extracted text. Avoid duplicating OCR and file-storage code in separate features.

## 6. Suggested database model

| Table | Key columns | Purpose / relationships |
|:--|:--|:--|
| `students` | `id`, `display_name`, `application_type` | Single demo student for MVP; no production auth claim |
| `documents` | `id`, `student_id`, `original_name`, `mime_type`, `storage_path`, `category`, `ocr_text`, `ocr_status`, `uploaded_at` | Original file plus extracted searchable text |
| `requirements` | `id`, `application_type`, `title`, `description`, `sort_order`, `source_note` | Checklist templates |
| `checklist_items` | `id`, `student_id`, `requirement_id`, `status`, `notes`, `updated_at` | Student-specific progress |
| `checklist_documents` | `checklist_item_id`, `document_id` | Many-to-many checklist attachments |
| `academic_terms` | `id`, `student_id`, `academic_year`, `semester` | Grade grouping |
| `grade_entries` | `id`, `term_id`, `source_document_id`, `subject_code`, `subject_name`, `grade`, `verified` | Verified or draft grades |
| `notifications` | `id`, `title`, `body`, `is_sample`, `published_at` | Optional sample messages |

**Database principles:** All IDs are stable UUIDs; foreign keys enforce references; `checklist_documents` has a composite unique key; do not store original file bytes inside Postgres for this MVP. `documents.ocr_text` can be nullable until extraction finishes. Seed demo requirements and optional sample notifications using versioned scripts, not manual untracked database edits.

## 7. API contracts and shared types

These are **internal ScholarReady routes** (not Lumen's external endpoint). All APIs should return explicit success/error states and appropriate HTTP status codes.

| Route | Method | Owner | Responsibility |
|:--|:--|:--|:--|
| `/api/ocr` | POST | Dev 1 | Multipart `file` → `{ text: string }`; calls real Lumen |
| `/api/documents` | POST / GET | Dev 1 | Upload/list documents; optional `?q=` text search |
| `/api/documents/[id]` | GET / DELETE | Dev 1 | File metadata/preview access and deletion |
| `/api/documents/[id]/text` | PATCH | Dev 1 | Save OCR text/status after scan result |
| `/api/checklist` | GET | Dev 2 | Get active application's requirements and statuses |
| `/api/checklist/[id]` | PATCH | Dev 2 | Update status and notes |
| `/api/checklist/[id]/documents` | POST / DELETE | Dev 2 | Attach/detach existing `documentId` |
| `/api/terms` | GET / POST | Dev 1 | List/create academic terms |
| `/api/grades` | GET / POST / PATCH | Dev 1 | List/create/update grade records |
| `/api/notifications` (optional) | GET | Dev 3 | Return demo/curated announcement cards; can instead use local seed data |

**OCR response (normalized):**

```json
{
  "text": "Student Number: 2023-001234\nSemester: First Semester..."
}
```

**Document metadata (conceptual):**

```ts
type OcrStatus = "pending" | "complete" | "failed";
type ChecklistStatus = "missing" | "uploaded" | "prepared" | "needs_attention";
type ApplicationType = "new" | "renewal";

interface StoredDocument {
  id: string;
  originalName: string;
  mimeType: string;
  category: string;
  ocrText: string | null;
  ocrStatus: OcrStatus;
}

interface ChecklistItem {
  id: string;
  requirementId: string;
  status: ChecklistStatus;
  documentIds: string[];
  notes?: string;
}
```

**Lumen note:** `LUMEN_API_BASE_URL`, exact OCR path, auth header and payload format are **to be verified** in the official event documentation. Do not hardcode or expose actual API credentials to the frontend or repository. The internal `/api/ocr` contract can stay stable even if the external provider format changes.

## 8. Project folder structure

```text
scholarready/
├── public/
│   └── demo/                   # Synthetic examples only
├── src/
│   ├── app/
│   │   ├── page.tsx            # Landing/onboarding
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── checklist/page.tsx
│   │   │   ├── scanner/page.tsx
│   │   │   ├── documents/page.tsx
│   │   │   ├── grades/page.tsx
│   │   │   └── notifications/page.tsx
│   │   └── api/
│   │       ├── ocr/route.ts
│   │       ├── documents/
│   │       ├── checklist/
│   │       ├── terms/
│   │       ├── grades/
│   │       └── notifications/      # Optional API
│   ├── features/
│   │   ├── scanner/
│   │   ├── documents/
│   │   ├── checklist/
│   │   ├── grades/
│   │   ├── notifications/
│   │   └── dashboard/
│   ├── components/
│   │   ├── ui/
│   │   └── layout/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── client.ts
│   │   └── migrations/
│   ├── lib/
│   │   ├── server/lumen.ts
│   │   ├── server/uploads.ts
│   │   └── utils.ts
│   ├── types/
│   │   ├── document.ts
│   │   ├── checklist.ts
│   │   ├── grade.ts
│   │   └── ocr.ts
│   └── data/
│       ├── requirements.ts
│       └── sample-notifications.ts
├── data/uploads/               # Runtime only; .gitignore
├── .env.example
├── .gitignore
├── compose.yaml                # Optional local Postgres
├── drizzle.config.ts
├── package.json
└── README.md
```

**Working rule:** `app/` defines routes and thin page wrappers. Dev 4 owns `components/ui/`, `components/layout/`, the global dashboard shell, onboarding, and design tokens. Devs 1-3 own their feature code and feature-specific screens. External secrets and Lumen requests remain server-only. Dev 1 maintains the Drizzle schema/migrations, with all changes agreed before implementation.

## 9. Team responsibilities and parallel development (4 developers)

This is the **final four-developer split**. Legacy batch numbers are retained only as feature groupings: Dev 1 takes the original Batches 1, 2, and 4 **except the dashboard UI**, which belongs to Dev 4.

| Developer | Feature ownership | Deliverable / definition of done | Files owned |
|:--|:--|:--|:--|
| **Dev 1 - Core Systems** | Original Batches 1, 2, and 4: OCR, Scanner, Documents, Grade History, data layer | Real Lumen call; upload and save originals; search OCR text; CRUD for stored files; editable grades by semester; shared PostgreSQL/Drizzle migrations | `app/api/ocr/`, `app/api/documents/`, `app/api/grades/`, `app/api/terms/`, `features/scanner/`, `features/documents/`, `features/grades/`, `lib/server/`, `db/` |
| **Dev 2 - Scholarship Checklist** | New and renewal requirements, progress and file attachments | Both application checklists work; statuses persist; attach/detach saved document ID; no automatic Prepared status | `features/checklist/`, `app/api/checklist/`, `data/requirements.ts` |
| **Dev 3 - News & Notifications** | Scholarship news, allowance notices, SPES opportunities | Independent announcements page; demo items clearly tagged; categories/filters; source links and dates; optional read/unread markers | `features/notifications/`, `app/(dashboard)/notifications/page.tsx`, `data/sample-notifications.ts`, optional `app/api/notifications/` |
| **Dev 4 - UI/UX & Dashboard** | Shared design system, navigation, onboarding, dashboard, responsiveness | Reusable UI components; consistent desktop/mobile layouts; accessible forms and loading/error/empty states; functioning dashboard shell | `components/ui/`, `components/layout/`, `features/dashboard/`, `app/(dashboard)/layout.tsx`, `app/(dashboard)/dashboard/page.tsx`, `app/page.tsx`, global styles |

### 9.1 Work boundaries and dependency rules

- **Dev 1 is the critical-path owner** because Lumen integration is mandatory. Build OCR + searchable document persistence before polishing Grade History. Dev 1 owns database schemas and migrations and publishes API response examples to the team.
- **Dev 2 works independently** with hard-coded requirement templates and mock document picker options until Dev 1's document listing endpoint is available. Checklist marking must not depend on OCR.
- **Dev 3 works independently** using clearly marked sample announcements and links to verified official sources, not a claimed live feed. Database persistence is optional; the page can render versioned local seed data.
- **Dev 4 owns shared presentation**, including global layout and navigation. Devs 1-3 own feature-specific layouts/forms/cards but use Dev 4's shared design components. Dev 4 should publish the sidebar, page wrapper, button, input, card, and responsive conventions early.
- If two developers need to edit the same page wrapper, shared type, `package.json`, or global CSS, coordinate the change through the integrator rather than editing it concurrently.

### 9.2 Shared foundation (before coding in parallel)

1. Create the public Git repository **before project coding**, as required by OVERCLOCK.
2. Initialize Next.js/TypeScript, Tailwind, shadcn/ui, Drizzle, and local PostgreSQL conventions.
3. Agree on shared `StoredDocument`, `ChecklistItem`, `GradeEntry`, and `Announcement` shapes; assign Dev 1 as migration owner.
4. Commit placeholder routes/fixtures so every developer can work without waiting for other modules.
5. Assign one integrator for merging. Dev 4 owns visual consistency; Dev 1 approves server/database contract changes.

### 9.3 Feature branches

- `feature/core-ocr-scanner-grades` - Dev 1
- `feature/scholarship-checklist` - Dev 2
- `feature/news-notifications` - Dev 3
- `feature/ui-dashboard` - Dev 4

Merge small tested increments; do not defer all integration until finalization. Keep `.env.local`, uploads, and database dumps out of Git.

### 9.4 Integration order

1. Dev 4 merges the basic layout and shared UI primitives (other devs can begin against mock components immediately).
2. Dev 1 verifies the actual Lumen OCR request and document upload/search API.
3. Dev 2 connects the checklist document selector to Dev 1's `GET /api/documents` and uses stable `documentId` values.
4. Dev 1 connects OGR OCR text to the Grade History correction-and-save workflow.
5. Dev 3 connects news/notification cards to the dashboard announcements preview, if available.
6. Test all four areas together, run the production build, and prepare a safe demo with synthetic student files.

### 9.5 Developer-level acceptance checks

| Developer | Required handoff test |
|:--|:--|
| Dev 1 | Upload sample OGR -> successful real Lumen OCR -> saved searchable text -> grade correction persists |
| Dev 2 | Switch new/renewal -> change requirement status -> attach saved document -> status survives refresh |
| Dev 3 | Open announcements -> filter Scholarship / Allowance / SPES -> inspect sample/source label |
| Dev 4 | Navigate all pages on desktop/mobile -> no broken layout -> dashboard and onboarding work |

## 10. Local development setup

**Prerequisites:** Node.js (current supported LTS), npm, Git, PostgreSQL locally or Docker Desktop / Docker Engine with Compose. Each teammate should run their **own** database instance; share schema/migrations through Git, not by exposing one teammate's laptop database.

**Example environment (`.env.example`, placeholders only):**

```dotenv
DATABASE_URL=postgresql://scholarready:localdev@localhost:5432/scholarready
UPLOAD_DIR=./data/uploads
LUMEN_API_BASE_URL=https://REPLACE_WITH_VERIFIED_HOST
LUMEN_OCR_PATH=/REPLACE_WITH_VERIFIED_PATH
LUMEN_API_KEY=REPLACE_LOCALLY_ONLY
```

**Proposed npm scripts:** `dev`, `build`, `lint`, `db:generate`, `db:migrate`, `db:seed`. Exact commands are implemented in `package.json` after scaffold; do not assume they already exist.

**Local runbook:**

1. Clone the public repository and install dependencies (`npm install`).
2. Start local Postgres; create the `scholarready` database (or start the team's Compose setup).
3. Copy `.env.example` to `.env.local` and supply local values and personal Lumen key.
4. Apply the committed Drizzle migrations; seed synthetic checklist/demo data.
5. Start `npm run dev` and open `http://localhost:3000`.
6. Use synthetic files for testing; check that OCR works end to end and search survives a restart.

**Security:** Put `.env.local`, `data/uploads/`, database dumps and personal student files in `.gitignore`. The local demo should not accept real personal files; if LAN/tunnel access is enabled, treat all demo data as visible to other users unless authenticated access controls have been implemented.

## 11. QA and acceptance tests

| Test ID | Area | Action | Expected result |
|:--|:--|:--|:--|
| T01 | Onboarding | Choose New / Renewal | Corresponding checklist shown |
| T02 | Checklist | Change an item to Prepared | Status and progress update after reload |
| T03 | OCR | Upload synthetic scan | Real Lumen response produces extracted text |
| T04 | OCR failure | Simulate invalid file/API error | Clear error; no false success message |
| T05 | Search | Search phrase found only inside image text | Matching document and snippet returned |
| T06 | Documents | Reopen stored upload | Original file and OCR text are available |
| T07 | Integration | Attach scanned document to requirement | Link persists; status not silently Prepared |
| T08 | Grades | Import OGR OCR and correct a row | User-edited grade saved and displayed by semester |
| T09 | Persistence | Restart web app | Postgres records and local files remain available |
| T10 | Build | Run production build | No fatal TypeScript/build errors |
| T11 | News/Notifications | Open, filter, and inspect an announcement | Cards show correct category and honest demo/source labels |
| T12 | UI/UX | Navigate all features on narrow and desktop screens | Shared navigation and layouts remain usable |

**Required end-to-end demo:** Open Dashboard → go to Scanner → upload synthetic OGR → run real Lumen OCR → search inside scanned text → open Checklist and attach that document → open Grade History and verify/edit extracted grades → return to Dashboard.

## 12. Schedule and deliverables

**Tonight (November 12):** Initialize repo and contracts; validate Lumen; develop modules in parallel; integrate one vertical slice; commit regularly.  
**Tomorrow (November 13):** Registration at **7:00 AM**; opening at **8:00 AM**; finalize/test/polish from **8:30 AM**; target internal freeze by **1:00–1:30 PM**; **official code freeze and submission at 2:00 PM**.

**Submission package (per event instructions):**

- Link to the **public GitHub repository**, with compliant commit history.
- Presentation deck of **at most 10 slides**.
- Short README explaining the problem, solution, Lumen usage, and how to run the application.

**Suggested 8-slide pitch:** Title; problem; target users; solution; features; Lumen OCR + user correction; live workflow; impact and SDG 4.

## 13. Risks and fallback decisions

| Risk | Mitigation / fallback |
|:--|:--|
| Lumen authentication/path uncertainty | Verify provider path, HTTP method, headers and payload first; do not assume a 403 means invalid key |
| OCR extracts poor grades | Editable grade table and manual entry; never pretend the text is verified |
| API remains unavailable | Keep scanner UI usable, but clearly state that simulated data does **not** satisfy mandatory Lumen integration; investigate alternate allowed Lumen tool |
| Merge conflicts | Respect four-developer ownership: Dev 1 owns DB/API; Dev 4 owns shared UI; integrator handles shared changes |
| File storage issues | Store originals outside `/public`, use UUID filenames and MIME/type checks |
| UI exceeds timeline | Drop sample notifications/essay helper before core features |
| Demo laptop/network issue | Run local Postgres and Next.js beforehand; have a short tested demo path and synthetic files |

## 14. Unresolved technical decisions

- **Lumen specification:** Confirm the exact external OCR URL, authentication scheme, supported file types/limits and response structure from hackathon docs.
- **Requirement dataset:** Confirm current new/renewal items and source date against the appropriate Pasig City announcements; do not present drafts as current official criteria.
- **Upload limits:** Team to select a practical max file size and enforce it on client and server.
- **Demo user model:** Single local demo profile unless time permits separate local profiles (no production account system promised).
- **Migrations:** Dev 1 approves and commits Drizzle schema changes after discussing contracts with the other developers.

---

**Team handoff summary:** Dev 1 owns OCR, Scanner, Documents, Grade History and the data layer; Dev 2 owns Checklist; Dev 3 owns News/Notifications; Dev 4 owns UI/UX and Dashboard. Build a single Next.js application backed by **local PostgreSQL**, **Drizzle**, and **local filesystem storage**. Keep **Checklist** independent from **Scanner**, and integrate them through document IDs in the shared library. The main AI feature is **real Lumen OCR** and searchable extracted text. Grade History reuses OCR text but requires **student review/correction**. Prioritize the complete demo flow and submission before the 2:00 PM deadline.
