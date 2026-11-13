import type { ApplicationType } from "@/types/shared";

export interface RequirementTemplate {
  id: string;
  applicationType: ApplicationType;
  title: string;
  description: string;
  sortOrder: number;
}

// Default checklist items supplied by the user. Confirm current requirements with the scholarship office.
export const requirementTemplates: RequirementTemplate[] = [
  { id: "renewal-proof-enrollment", applicationType: "renewal", title: "Proof of Enrollment", description: "Prepare a current document confirming your enrollment.", sortOrder: 1 },
  { id: "renewal-report-card", applicationType: "renewal", title: "Report Card", description: "Prepare your latest report card or academic record.", sortOrder: 2 },
  { id: "renewal-proof-income", applicationType: "renewal", title: "Proof of Income", description: "Prepare the requested proof of household income.", sortOrder: 3 },
  { id: "renewal-residency", applicationType: "renewal", title: "Barangay Certificate of Residency", description: "Request a current certificate confirming your residency.", sortOrder: 4 },
  { id: "renewal-school-id", applicationType: "renewal", title: "School ID", description: "Prepare a clear copy of your school ID.", sortOrder: 5 },
  { id: "new-birth-certificate", applicationType: "new", title: "Birth Certificate", description: "Prepare a copy of your birth certificate.", sortOrder: 1 },
  { id: "new-residency", applicationType: "new", title: "Certificate of Residency", description: "Request a certificate confirming your residency.", sortOrder: 2 },
  { id: "new-bir-income-tax-return", applicationType: "new", title: "BIR Income Tax Return", description: "Prepare the requested BIR income tax return for your household.", sortOrder: 3 },
  { id: "new-report-card", applicationType: "new", title: "Report Card", description: "Prepare your latest report card or academic record.", sortOrder: 4 },
];
