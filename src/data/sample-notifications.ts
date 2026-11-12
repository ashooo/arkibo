export interface Announcement { id: string; title: string; body: string; category: "scholarship" | "allowance" | "spes"; isSample: boolean; publishedAt: string; sourceUrl?: string; }

export const sampleNotifications: Announcement[] = [];
