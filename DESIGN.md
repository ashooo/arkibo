# Arkibo — Design System & Frontend Handoff (DESIGN.md)

**System:** Arkibo — Pasig City College Scholarship & Renewal Portal
**Theme:** *Civic Academic Minimal* (Google Stitch Reference with Full Dark Mode & Sonner Toasts)  
**Author:** Developer 4 (UI/UX & Senior Frontend Lead)  
**Target Audience:** Developer 1 (Core OCR/Scanner/Grades), Developer 2 (Checklist), Developer 3 (News/Notifications)  
**Version:** 2.0 (OVERCLOCK 2026 Hackathon)

---

## 1. Senior UI/UX Design Principles Applied

Arkibo follows proven interaction design principles to deliver an intuitive experience for tertiary students:

1. **Fitts’s Law & Large Hit Targets:** Interactive elements (buttons, filter chips, checkboxes, table rows) feature minimum hit areas of `44px x 44px` on mobile and `36px` on desktop, with tactile press feedback (`active:scale-[0.98]`).
2. **Hick’s Law & Cognitive Load Reduction:** Bureaucratic jargon has been stripped out. The student is presented with clear choices (Renewal vs New Applicant) and single-action hierarchies on each screen.
3. **Immediate System Feedback (Nielsen Heuristic #1):** Every status change, track switch, upload action, or copy command triggers an instant contextual toast notification via **Sonner** (`bottom-right`), accompanied by visual highlights.
4. **Dark Mode & Contrast Compliance (WCAG AA):** Complete light and dark themes using `next-themes`. High contrast ratios (minimum 4.5:1 for body copy and 3:1 for large headlines) are maintained across both modes.
5. **Aesthetic-Usability Effect:** Modern slate surfaces, subtle elevation lifts (`hover:-translate-y-0.5 hover:shadow-card`), and clean geometric rounded corners (`rounded-xl` for cards, `rounded-md` for buttons/inputs) inspire trust and dependability.

---

## 2. Design Tokens & Styling Architecture

All tokens are pre-configured in `tailwind.config.ts`, `postcss.config.mjs`, and `src/app/globals.css`.

### 2.1 Color Palette & Dark Mode Matrix

| Token Name | Light Hex | Dark Hex | Tailwind Class | Semantic Usage |
|:---|:---|:---|:---|:---|
| **Primary** | `#1D4ED8` | `#3B82F6` | `bg-primary`, `text-primary` | Primary CTAs, active route states, interactive buttons |
| **Primary Soft** | `#EFF6FF` | `#1E3A8A / 30%` | `bg-primary-soft dark:bg-blue-950/40` | Matched OCR rows, focus rings, active chip backdrops |
| **Secondary (Success)** | `#10B981` | `#10B981` | `bg-secondary`, `text-secondary` | Validated requirements, compliant GWA, verified status |
| **Secondary Soft** | `#ECFDF5` | `#064E3B / 40%` | `bg-secondary-soft dark:bg-emerald-950/60` | Verified badge backgrounds, confirmation banners |
| **Tertiary (Warning)** | `#F59E0B` | `#F59E0B` | `bg-tertiary`, `text-tertiary` | Pending documents, items needing student review |
| **Tertiary Soft** | `#FFFBEB` | `#78350F / 40%` | `bg-tertiary-soft dark:bg-amber-950/60` | Pending pills, review highlight backgrounds |
| **Error** | `#BA1A1A` | `#EF4444` | `bg-error`, `text-error` | Missing required files, failed OCR scans |
| **Error Soft** | `#FEF2F2` | `#7F1D1D / 30%` | `bg-error-soft dark:bg-red-950/30` | Missing requirement card highlight, error alerts |
| **Canvas Background** | `#FAF8FF` | `#090D16` | `bg-surface dark:bg-dark-bg` | Main application background |
| **Surface / Card** | `#FFFFFF` | `#131B2E` | `bg-white dark:bg-dark-card` | Resting cards, modals, table rows |
| **Surface Low** | `#F2F3FF` | `#0F172A` | `bg-surface-low dark:bg-dark-surface` | Sidebar, secondary sub-panels |
| **Text Dominant** | `#131B2E` | `#F8FAFC` | `text-on-surface dark:text-slate-100` | Headings, student name, primary values |
| **Text Muted / Body** | `#434655` | `#94A3B8` | `text-on-surface-variant dark:text-slate-400`| Body descriptions, helper notes |
| **Border Default** | `#E2E8F0` | `#232D42` | `border-slate-border dark:border-dark-border` | Standard card and input outlines |

### 2.2 Typography Scale

- **Headings & Body:** `Plus Jakarta Sans` (`font-sans`)
- **Numbers, Grades & IDs:** `JetBrains Mono` (`font-mono`)

```tsx
// Page Title
<h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface dark:text-slate-100 tracking-tight">

// Card Title
<h2 className="text-lg sm:text-xl font-bold text-on-surface dark:text-slate-100">

// Body text
<p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">

// Monospace grade/ID
<span className="font-mono text-sm font-bold text-on-surface dark:text-slate-100">1.44</span>
```

---

## 3. Toast Notifications System (`sonner`)

Mount `<Toaster position="bottom-right" richColors theme="system" />` in your layout (already provided in `src/app/layout.tsx`).

### 3.1 Standard Toast Triggers

```tsx
import { toast } from "sonner";

// 1. Success Notification
toast.success("Document attached: Official Grade Report", {
  description: "Linked to requirement and ready for verification.",
});

// 2. Action Required / Error
toast.error("Assessment Slip Missing", {
  description: "Stamped accounting slip required for term renewal.",
  action: {
    label: "Upload Now",
    onClick: () => router.push("/scanner"),
  },
});

// 3. Informational Notification
toast.info("Lumen OCR Extraction Started", {
  description: "Reading text and tabular grades from your uploaded scan...",
});

// 4. Warning Notification
toast.warning("Grade Discrepancy Found", {
  description: "IT 201 grade extracted as 1.75. Please review and verify.",
});
```

---

## 4. Copywriting Standards: Plain Language (No Bureaucratic Jargon)

To maintain student clarity, adhere to these terminology guidelines:

| Do NOT Use (Bureaucratic Jargon) | USE (Clean Student Language) |
|:---|:---|
| *"AY 2024–2025 Batch 1 Endorsement Packet"* | **"Renewal Checklist"** or **"My Requirements"** |
| *"Independent Student Portal for Pasig College Students"* | **"Pasig College Scholar Portal"** |
| *"LGU Pasig Renewal Stream"* | **"Pasig Scholarship"** |
| *"Packet Progress"* | **"Readiness"** or **"Progress"** |
| *"Civic Affirmation Banner"* | **"Welcome Notice"** |
| *"Batch 1 Freeze: 12 Days Left"* | **"Deadline: Feb 28 (12 days left)"** |
| *"Execute OCR Extraction Pipeline"* | **"Scan & Extract Text"** |

---

## 5. Component Usage Reference for Devs 1, 2, and 3

### 5.1 Button (`src/components/ui/button.tsx`)

```tsx
import { Button } from "@/components/ui/button";
import { Upload, Check } from "lucide-react";

<Button variant="primary" size="md">
  <Upload className="w-4 h-4 mr-2" />
  Upload File
</Button>

<Button variant="secondary" size="md">
  Cancel
</Button>

<Button variant="outline" size="sm">
  View Details
</Button>

<Button variant="success" size="md">
  <Check className="w-4 h-4 mr-2" />
  Confirm Verified Grades
</Button>
```

### 5.2 Card (`src/components/ui/card.tsx`)

Cards are automatically dark-mode enabled (`bg-white dark:bg-dark-card border-slate-border dark:border-dark-border`):

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

<Card className="p-5 sm:p-6 hover:shadow-card hover:-translate-y-0.5 transition-all">
  <CardHeader className="p-0 mb-3">
    <CardTitle>Official Grade Report (OGR)</CardTitle>
    <CardDescription>Scanned from registrar copy • AY 2024–2025</CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    {/* Body content */}
  </CardContent>
</Card>
```

### 5.3 Badge (`src/components/ui/badge.tsx`)

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="success" size="sm">Validated</Badge>
<Badge variant="warning" size="sm">3 Left</Badge>
<Badge variant="error" size="sm">Required</Badge>
<Badge variant="primary" size="sm">Lumen OCR</Badge>
<Badge variant="neutral" size="sm">AY 2024-2025</Badge>
```

### 5.4 Theme Toggle (`src/components/ui/theme-toggle.tsx`)

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

<ThemeToggle />
```

---

## 6. Screen Specifications for Teammates

### 6.1 Developer 1 — Core Systems (OCR Scanner, Documents, Grade History)

* **Scanner (`/scanner`):**
  * Split-screen: 50% left canvas (`bg-slate-100 dark:bg-dark-cardAlt`), 50% right extracted text editor with monospace highlighting (`mark` in amber).
  * Status badges: `pending` (amber), `complete` (emerald), `failed` (red).
  * Trigger `toast.info("Extracting text via Lumen OCR...")` when user uploads.
* **Grade History (`/grades`):**
  * Group grades by semester term.
  * Show GWA qualification pill (`≤ 2.00` = `Qualified` in green, `> 2.00` = `Needs Attention` in amber).
  * Every grade number rendered in `font-mono font-bold`.
  * Trigger `toast.success("Grades verified and saved for Term 1")` upon confirmation.

### 6.2 Developer 2 — Scholarship Checklist (`/checklist`)

* Connect to `useStudent()` to read `applicationType` (`"new"` vs `"renewal"`).
* Display status pills: `missing`, `uploaded`, `prepared`, `needs_attention`.
* **Product Rule:** Attaching a document never silently marks an item `prepared`. The student must click "Mark Prepared".
* Trigger `toast.success("Document attached: " + docName)` upon attachment.

### 6.3 Developer 3 — News & Notifications (`/notifications`)

* Filter chips: `All`, `Scholarship`, `Allowance`, `SPES`.
* Every demo announcement card must feature `<Badge variant="warning" size="sm">Sample</Badge>`.
* Provide direct links to verified sources (e.g., Pasig City Public Information Office).

---

## 7. Accessibility Checklist

- [ ] All clickable elements have minimum `44px x 44px` touch target.
- [ ] Keyboard navigation: `Tab` moves through links, `Enter`/`Space` activates buttons.
- [ ] Color contrast passes WCAG AA in both Light and Dark modes.
- [ ] Form controls have visible focus rings (`focus-visible:ring-2 focus-visible:ring-primary`).
- [ ] Empty states show an informative icon, title, and actionable button.
