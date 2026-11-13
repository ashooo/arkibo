export type Category = "allowance" | "spes" | "scholarship";

export interface Announcement {
  source: string;
  postId: string;
  title: string;
  body: string;
  categories: Category[];
  sourceUrl: string;
  publishedAt: Date;
}

export function openAnnouncementDb(): { end(): Promise<void> };
export function listAnnouncements(db: ReturnType<typeof openAnnouncementDb>): Promise<Announcement[]>;
