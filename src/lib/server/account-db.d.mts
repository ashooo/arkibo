import type { AccountUser } from "@/lib/account";

interface AccountConnection {
  query(sql: string, parameters?: unknown[]): Promise<{
    rows: Array<AccountUser & { password_hash: string }>;
  }>;
}

interface AccountPool extends AccountConnection {
  connect(): Promise<AccountConnection & { release(): void }>;
}

export function accountDb(): AccountPool;
