export const schoolName = "Pamantasan ng Lungsod ng Pasig";
export const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year or above"];
export const alertTopics = ["Scholarship", "Allowance", "SPES"];

export const maxProfilePhotoBytes = 512 * 1024;

export interface AccountProfile {
  name: string;
  photo?: string | null;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  yearLevel: string;
  track: "new" | "renewal";
  topics: string[];
}

export interface AccountUser {
  id: string;
  profile: AccountProfile | null;
}

export async function accountRequest(method: "GET" | "POST" = "GET", body?: object): Promise<AccountUser | null> {
  const response = await fetch("/api/account", {
    method,
    cache: "no-store",
    ...(body && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Couldn’t reach the account service. Try again.");
  return data.user;
}
