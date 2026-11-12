import type { ApplicationType } from "@/types/shared";

export interface RequirementTemplate {
  id: string;
  applicationType: ApplicationType;
  title: string;
  description: string;
  sortOrder: number;
  sourceNote: string;
}

// Illustrative checklist content based on common application and renewal tasks.
// Confirm current requirements with Pasig City before relying on these for an application.
export const requirementTemplates: RequirementTemplate[] = [
  { id: "new-profile", applicationType: "new", title: "Complete applicant information", description: "Review your personal, school, and contact details.", sortOrder: 1, sourceNote: "Sample checklist item; confirm with the scholarship office." },
  { id: "new-id", applicationType: "new", title: "Prepare a valid student or government ID", description: "Have a clear copy ready if requested by the application process.", sortOrder: 2, sourceNote: "Sample checklist item; confirm accepted IDs and format." },
  { id: "new-enrollment", applicationType: "new", title: "Prepare proof of enrollment", description: "Examples may include a Certificate of Registration or school certification.", sortOrder: 3, sourceNote: "Sample checklist item; confirm acceptable proof with your school and the scholarship office." },
  { id: "new-grades", applicationType: "new", title: "Request your latest grades", description: "Check whether a certified grade record is needed for your application.", sortOrder: 4, sourceNote: "Sample checklist item; confirm the required term and document format." },
  { id: "new-essay", applicationType: "new", title: "Draft your personal statement", description: "Prepare an essay or statement if it is part of the current application.", sortOrder: 5, sourceNote: "Sample checklist item; confirm whether an essay is required." },
  { id: "new-interview", applicationType: "new", title: "Review interview or screening details", description: "Keep track of any screening schedule and instructions you receive.", sortOrder: 6, sourceNote: "Sample checklist item; follow current official instructions." },
  { id: "renewal-grade-report", applicationType: "renewal", title: "Grade Report", description: "Minimum 2.00 GWA requirement.", sortOrder: 1, sourceNote: "Sample requirement; verify the current standard with the scholarship office." },
  { id: "renewal-registration", applicationType: "renewal", title: "Registration Form", description: "Proof of enrollment and academic units.", sortOrder: 2, sourceNote: "Sample requirement; confirm the accepted form with the scholarship office." },
  { id: "renewal-school-id", applicationType: "renewal", title: "School ID", description: "Valid school identification.", sortOrder: 3, sourceNote: "Sample requirement; confirm the current ID requirements." },
  { id: "renewal-barangay-certificate", applicationType: "renewal", title: "Barangay Certificate", description: "Certificate of residency.", sortOrder: 4, sourceNote: "Sample requirement; confirm whether residency documentation is required." },
  { id: "renewal-receipt", applicationType: "renewal", title: "Official Receipt / Assessment Slip", description: "Proof of tuition payment or assessment.", sortOrder: 5, sourceNote: "Sample requirement; confirm acceptable proof with the scholarship office." },
];
