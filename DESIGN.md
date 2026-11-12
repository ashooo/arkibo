# ScholarReady — Design System & Frontend Handoff (DESIGN.md)

**System:** ScholarReady — Pasig City College Scholarship & Renewal Portal  
**Theme:** *Civic Academic Minimal* (Google Stitch Reference)  
**Author:** Developer 4 (UI/UX & Dashboard Lead)  
**Target Audience:** Developer 1 (Core OCR/Scanner/Grades), Developer 2 (Checklist), Developer 3 (News/Notifications)  
**Version:** 1.0 (OVERCLOCK 2026 Hackathon)

---

## 1. Executive Design Philosophy

ScholarReady's design language, **Civic Academic Minimal**, bridges modern civic service and focused productivity software. Designed specifically for Pasig City tertiary scholars:
1. **Dependable & Supportive:** Clear administrative hierarchies reduce bureaucratic anxiety.
2. **Affirmative Verification:** Vibrant emerald badges (`#10B981`) affirm verified states; royal blue (`#1D4ED8`) commands action; alert amber (`#F59E0B`) highlights items needing student attention.
3. **High Data Legibility:** Dense document workflows, split-screen verification, and tabular grade comparisons maintain strict typographic hierarchy with **Plus Jakarta Sans** for UI and **JetBrains Mono** for numerical values and student identifiers.
4. **Honest System Feedback:** OCR extractions and sample announcements are explicitly marked; the system never pretends data is verified without the student's explicit confirmation.

---

## 2. Design Tokens & Styling Architecture

All tokens are pre-configured in `tailwind.config.ts` and `src/app/globals.css`.

### 2.1 Color Palette

| Token Name | Hex Code | Tailwind Class | Semantic Usage |
|:---|:---|:---|:---|
| **Primary** | `#1D4ED8` | `bg-primary`, `text-primary` | Primary CTAs, active route states, interactive buttons |
| **Primary Light** | `#2563EB` | `bg-primary-light` | Hover states on primary elements |
| **Primary Soft** | `#EFF6FF` | `bg-primary-soft` | Focus states, matched OCR rows, active chip backgrounds |
| **Primary Dark** | `#0037B0` | `bg-primary-dark` | Active pressed button states |
| **Secondary (Success)** | `#10B981` | `bg-secondary`, `text-secondary` | Validated checklist items, compliant GWA, verified OCR status |
| **Secondary Soft** | `#ECFDF5` | `bg-secondary-soft` | Success badge backgrounds, verified alert banners |
| **Tertiary (Warning)** | `#F59E0B` | `bg-tertiary`, `text-tertiary` | Pending documents, items needing student review |
| **Tertiary Soft** | `#FFFBEB` | `bg-tertiary-soft` | Pending pills, review highlight backgrounds |
| **Error** | `#BA1A1A` | `bg-error`, `text-error` | Missing required files, failed OCR scans |
| **Error Soft** | `#FEF2F2` | `bg-error-soft` | Missing requirement card highlight, error banner backgrounds |
| **Surface** | `#FAF8FF` | `bg-surface` | Global application canvas background |
| **Surface Low** | `#F2F3FF` | `bg-surface-low` | Sidebar background, secondary container panels |
| **Card White** | `#FFFFFF` | `bg-white` | Resting cards, modals, table rows |
| **Text Dominant** | `#131B2E` | `text-on-surface` | Primary headings, table values, student names |
| **Text Variant / Body** | `#434655` | `text-on-surface-variant` | Body descriptions, requirement helper texts |
| **Slate Muted** | `#64748B` | `text-slate-muted` | Metadata labels, breadcrumbs, timestamps |
| **Border Default** | `#E2E8F0` | `border-slate-border` | Standard card and input outlines |

### 2.2 Typography Scale

ScholarReady uses two primary typefaces:
- **Body & Headings:** `Plus Jakarta Sans` (`font-sans`)
- **Numbers, Grades & IDs:** `JetBrains Mono` (`font-mono`)

```tsx
// Heading 1 (Page titles)
<h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">

// Heading 2 (Card titles / Section headers)
<h2 className="text-xl font-bold text-on-surface">

// Heading 3 (Sub-headers / Modal headers)
<h3 className="text-base font-bold text-on-surface">

// Body text
<p className="text-sm text-on-surface-variant leading-relaxed">

// Small metadata
<span className="text-xs text-slate-muted">

// Monospace figures (Grades, student numbers, GWA)
<span className="font-mono text-sm font-bold text-on-surface">1.44</span>
```

### 2.3 Border Radii & Elevation

- **Small (Inputs, buttons, table rows):** `rounded-md` (`8px`)
- **Large (Cards, preview panes, dialogs):** `rounded-xl` (`16px`)
- **Capsule (Status badges, filter chips, navigation pills):** `rounded-full` (`9999px`)
- **Shadows:**
  - `shadow-subtle`: `0 1px 3px rgba(15, 23, 42, 0.04)` (Resting cards)
  - `shadow-card`: `0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)`
  - `shadow-floating`: `0 10px 25px -5px rgba(15, 23, 42, 0.08)` (Modals and dropdowns)

---

## 3. Core Component Library API Guide

All shared UI components are located in `src/components/ui/`. Import them directly:

### 3.1 Button (`src/components/ui/button.tsx`)

```tsx
import { Button } from "@/components/ui/button";
import { Upload, Check } from "lucide-react";

// Primary action
<Button variant="primary" size="md">
  <Upload className="w-4 h-4 mr-2" />
  <span>Upload Document</span>
</Button>

// Secondary / Ghost
<Button variant="secondary" size="md">
  Cancel
</Button>

// Outline
<Button variant="outline" size="sm">
  View Details
</Button>

// Success
<Button variant="success" size="md">
  <Check className="w-4 h-4 mr-2" />
  Confirm Verified Grades
</Button>

// Loading State
<Button variant="primary" isLoading={true}>
  Processing OCR...
</Button>
```

### 3.2 Card (`src/components/ui/card.tsx`)

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card className="p-6">
  <CardHeader className="p-0 mb-4">
    <CardTitle>Official Grade Report (OGR)</CardTitle>
    <CardDescription>Scanned from registrar copy • AY 2024–2025</CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    {/* Body content */}
  </CardContent>
  <CardFooter className="p-0 mt-4 pt-4 border-t border-slate-border">
    {/* Action buttons */}
  </CardFooter>
</Card>
```

### 3.3 Badge (`src/components/ui/badge.tsx`)

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="success" size="sm">Validated</Badge>
<Badge variant="warning" size="sm">3 Pending</Badge>
<Badge variant="error" size="sm">Required</Badge>
<Badge variant="primary" size="sm">Lumen OCR</Badge>
<Badge variant="neutral" size="sm">AY 2024-2025</Badge>
```

### 3.4 Progress Bar (`src/components/ui/progress.tsx`)

```tsx
import { Progress } from "@/components/ui/progress";

// Standard progress (percentage out of 100)
<Progress value={80} indicatorColor="bg-primary" />
<Progress value={100} indicatorColor="bg-secondary" />
```

### 3.5 Input (`src/components/ui/input.tsx`)

```tsx
import { Input } from "@/components/ui/input";

<Input 
  type="text" 
  placeholder="Search inside extracted OCR text..." 
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
```

---

## 4. Feature Implementation Specs for Teammates

### 4.1 Developer 1 — Core Systems (OCR Scanner, Documents, Grade History)

#### 4.1.1 Document Scanner (`/scanner`) — Split-Screen Workflow
Per the Stitch mockup (`Lumen OCR Grade Verification` / `03d1e8870d984f41b1a51b8969aa65a6`):
- **Desktop (1024px+):** 12-column split grid.
  - **Left (6 cols):** Document Viewer Canvas.
    - Top toolbar: Zoom In, Zoom Out, Fit to Width, Rotate.
    - Viewport: `#F1F5F9` canvas backdrop framing the JPG/PNG or PDF with subtle 1px border.
  - **Right (6 cols):** OCR Extraction & Search Panel.
    - Top: Real Lumen OCR API trigger button (`POST /api/ocr`) with loading spinner.
    - Search bar: Real-time query matching keywords inside `ocr_text`.
    - Content box: Monospace text container displaying extracted text with highlighted matches (`<mark className="bg-amber-200 text-amber-900 rounded px-1">`).
- **Mobile (< 768px):** Use a 2-tab segmented controller: `[Preview]` vs `[Extracted Text]`.

```tsx
// Example Split-Screen JSX Pattern for Dev 1:
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  {/* Left: Document Canvas */}
  <Card className="lg:col-span-6 p-4 flex flex-col h-[650px]">
    <div className="flex items-center justify-between pb-3 border-b border-slate-border text-xs text-slate-muted">
      <span className="font-bold text-on-surface">Document Preview</span>
      <Badge variant="primary" size="sm">Original File</Badge>
    </div>
    <div className="flex-1 bg-slate-100 rounded-lg mt-3 overflow-hidden flex items-center justify-center border border-slate-border">
      {/* <img> or <iframe/embed> for PDF preview */}
      <img src={previewUrl} alt="Document" className="max-h-full object-contain" />
    </div>
  </Card>

  {/* Right: OCR Text Editor */}
  <Card className="lg:col-span-6 p-6 flex flex-col h-[650px]">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-base text-on-surface">Extracted OCR Text</h3>
      <Badge variant={ocrStatus === "complete" ? "success" : "warning"} size="sm">
        {ocrStatus}
      </Badge>
    </div>
    <div className="flex-1 overflow-y-auto bg-surface-low rounded-lg p-4 font-mono text-xs border border-slate-border leading-relaxed whitespace-pre-wrap">
      {ocrText || "Upload a document to extract text via Lumen OCR."}
    </div>
  </Card>
</div>
```

#### 4.1.2 Grade History (`/grades`) — Editable Verification Table
Per the Stitch mockup (`Grade History & OCR Verification`):
- Term grouping selector (`AY 2024–2025 • 1st Semester`).
- Summary Header: Term GWA calculated dynamically, with a status badge (`Qualified` if GWA $\le 2.00$, `Needs Attention` if $> 2.00$).
- Tabular card-style rows:
  - Columns: Subject Code, Description, Units, Grade, Verification Pill.
  - Active/matched row: Highlighted with `bg-primary-soft/40 border-primary/30`.
  - Grade inputs: Right-aligned with `font-mono font-bold`.
- Explicit Confirmation Button:
  - A prominent `<Button variant="success">Confirm & Save Verified Grades</Button>` at the bottom.
  - **Rule:** Never save without student clicking Confirm.

---

### 4.2 Developer 2 — Scholarship Checklist (`/checklist`)

#### 4.2.1 Application Track Switching
Connect to `useStudent()` to read `applicationType` (`"new"` vs `"renewal"`):
```tsx
import { useStudent } from "@/lib/student-context";

const { applicationType } = useStudent();
// If "renewal", render Renewal Requirements (OGR, COR, Student ID, Brgy Cert, Assessment Slip).
// If "new", render New Applicant Requirements (Form 138, Admission Slip, Indigency, Voter's Cert).
```

#### 4.2.2 Checklist Item Card Pattern
Each requirement card must present:
1. Status Icon:
   - `prepared`: Solid emerald check icon (`bg-secondary text-white`)
   - `uploaded`: Blue file icon (`bg-primary-soft text-primary`)
   - `missing`: Amber alert icon (`bg-tertiary-soft text-tertiary`)
   - `needs_attention`: Red exclamation icon (`bg-error text-white`)
2. Title & Description.
3. Attached Document Pill: If a document is attached, display its name with an eye preview icon and a detach button.
4. Manual Status Radio / Select: Student can manually mark `Prepared`.
5. **Critical Rule:** Attaching a document does **NOT** automatically mark `Prepared`. The student must explicitly mark it Prepared.

```tsx
// Example Requirement Card JSX for Dev 2:
<Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-secondary-soft text-secondary flex items-center justify-center shrink-0 mt-0.5">
      <Check className="w-4 h-4 stroke-[3]" />
    </div>
    <div>
      <h4 className="text-sm font-bold text-on-surface">Certificate of Registration (COR)</h4>
      <p className="text-xs text-on-surface-variant">Stamped proof of enrollment for current semester.</p>
      {attachedDoc && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-xs text-slate-700 border border-slate-200">
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>{attachedDoc.name}</span>
        </div>
      )}
    </div>
  </div>

  <div className="flex items-center gap-2 self-end sm:self-center">
    <Button variant="secondary" size="sm" onClick={handleAttach}>
      Attach Document
    </Button>
    <Button 
      variant={isPrepared ? "success" : "outline"} 
      size="sm" 
      onClick={handleTogglePrepared}
    >
      {isPrepared ? "Prepared ✓" : "Mark Prepared"}
    </Button>
  </div>
</Card>
```

---

### 4.3 Developer 3 — News & Notifications (`/notifications`)

#### 4.3.1 Honest Sample Tagging
Every announcement card rendered in this section must visibly include an honest sample badge:
```tsx
<Badge variant="warning" size="sm">
  Sample Notice
</Badge>
```

#### 4.3.2 Category Filter Pills
Provide 4 filter chips at the top:
- All (`bg-primary text-white` when active)
- Scholarship Releases
- Allowance Notices
- SPES Opportunities

#### 4.3.3 Announcement Card Pattern
```tsx
<Card className="p-5 flex flex-col justify-between hover:border-primary/40 transition-all">
  <div>
    <div className="flex items-center justify-between gap-2 mb-2">
      <Badge variant="primary" size="sm">{category}</Badge>
      <div className="flex items-center gap-2">
        <Badge variant="warning" size="sm">Sample</Badge>
        <span className="text-xs text-slate-muted">{publishedDate}</span>
      </div>
    </div>
    <h3 className="text-base font-bold text-on-surface mb-1.5">{title}</h3>
    <p className="text-xs text-on-surface-variant leading-relaxed">{body}</p>
  </div>

  <div className="mt-4 pt-3 border-t border-slate-border/50 flex items-center justify-between text-xs">
    <span className="text-slate-muted">Source: {source}</span>
    <a 
      href={sourceUrl} 
      target="_blank" 
      rel="noreferrer" 
      className="text-primary font-bold hover:underline inline-flex items-center gap-1"
    >
      <span>Official Portal Link</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  </div>
</Card>
```

---

## 5. Responsive Breakpoint Rules

ScholarReady supports all screen sizes from mobile to wide monitors:

| Breakpoint | Window Width | Layout Behavior |
|:---|:---|:---|
| **Mobile** | `< 768px` | Sidebar hidden behind hamburger drawer; single-column layouts; split-screen collapses into tab switcher; padding `16px` |
| **Tablet** | `768px - 1023px` | Sidebar collapses to drawer or top bar; 2-column cards stack; padding `24px` |
| **Desktop** | `1024px+` | Permanent `260px` left sidebar; 12-column grid systems; full split-screen OCR viewer; padding `32px` |

---

## 6. Accessibility & Quality Checklist

Before submitting code for review, verify:
- [ ] **Touch Targets:** All buttons, chips, and interactive icons have a clickable target of at least `44px x 44px`.
- [ ] **Contrast Compliance:** All text meets WCAG AA minimum contrast ratio (4.5:1 for body, 3:1 for large headings).
- [ ] **Focus States:** Every interactive element has `focus-visible:ring-2 focus-visible:ring-primary`.
- [ ] **Loading & Empty States:** Every list component includes an empty state card with an icon and clear CTA rather than a blank white box.
- [ ] **No Silent Actions:** Any status alteration, file deletion, or grade submission must trigger visual feedback.

