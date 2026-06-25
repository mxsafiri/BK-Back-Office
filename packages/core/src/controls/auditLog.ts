import type { EventStore } from "../ledger/eventStore.js";

/**
 * Audit log (CLAUDE.md DoD): every state change to money or positions emits an audit
 * event. Implemented on top of the append-only event store so audit entries are
 * themselves immutable. Never log secrets or PII.
 */
export interface AuditEntry {
  readonly action: string;
  readonly actor: string; // user id
  readonly subject: string; // what was acted on (e.g. request id, account id)
  readonly meta?: Readonly<Record<string, unknown>>;
}

export class AuditLog {
  constructor(private readonly events: EventStore) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.events.append("audit", [
      { type: "Audit", payload: { ...entry, at: new Date().toISOString() } },
    ]);
  }

  async entries(): Promise<AuditEntry[]> {
    const all = await this.events.read("audit");
    return all.map((e) => e.payload as unknown as AuditEntry);
  }
}
