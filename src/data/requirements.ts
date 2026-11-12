import type { ApplicationType } from "@/types/shared";

export interface RequirementTemplate { applicationType: ApplicationType; title: string; description: string; sortOrder: number; sourceNote: string; }

// Draft/demo data only. Verify wording with an official Pasig City source before public use.
export const requirementTemplates: RequirementTemplate[] = [];
