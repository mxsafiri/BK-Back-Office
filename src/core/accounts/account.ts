import type { AccountId, ClientId } from "../../shared/ids.js";

/**
 * Client account (CLAUDE.md Phase 1: client account model + account-to-cash linkage).
 *
 * The account is the join between a client, their cash leg (an nTZS subwallet), and their
 * securities leg (the holdings sub-ledger). The cash leg is identified by the nTZS `id`
 * returned at provisioning — NEVER our externalId.
 */
export type AccountStatus = "pending" | "active" | "suspended" | "closed";

export interface ClientAccount {
  readonly id: AccountId;
  readonly clientId: ClientId;
  /** nTZS user id (their `id`) — the cash-leg linkage. */
  readonly cashUserId: string;
  /** KYC provider reference recorded at onboarding (no PII). */
  readonly kycReference: string;
  readonly status: AccountStatus;
  readonly openedAt: string; // ISO timestamp
}

/** Whether an account may transact (move cash or positions). Only active accounts may. */
export function canTransact(account: ClientAccount): boolean {
  return account.status === "active";
}

/**
 * Persistence port for account records (in-memory now, Postgres later). This is a read model;
 * every state change must also emit an audit/event entry at the service layer.
 */
export interface AccountStore {
  create(account: ClientAccount): Promise<void>;
  get(id: AccountId): Promise<ClientAccount | undefined>;
  byClient(clientId: ClientId): Promise<ClientAccount[]>;
  /** Replace the stored record (status transitions). Caller enforces the legal transition. */
  put(account: ClientAccount): Promise<void>;
}

export class InMemoryAccountStore implements AccountStore {
  private readonly byId = new Map<AccountId, ClientAccount>();

  async create(account: ClientAccount): Promise<void> {
    if (this.byId.has(account.id)) {
      throw new Error(`Account ${account.id} already exists`);
    }
    this.byId.set(account.id, account);
  }

  async get(id: AccountId): Promise<ClientAccount | undefined> {
    return this.byId.get(id);
  }

  async byClient(clientId: ClientId): Promise<ClientAccount[]> {
    return [...this.byId.values()].filter((a) => a.clientId === clientId);
  }

  async put(account: ClientAccount): Promise<void> {
    this.byId.set(account.id, account);
  }
}
