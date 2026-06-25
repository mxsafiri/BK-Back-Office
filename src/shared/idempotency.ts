/**
 * Idempotency (CLAUDE.md rule #1): every financial operation carries a client-generated
 * key. Re-processing the same key is a no-op that returns the original result.
 *
 * This in-memory store is a Phase-0 placeholder. The production implementation MUST be
 * backed by Postgres (a unique key column inside the same transaction as the side effect)
 * so that a crash between "do the work" and "record the key" cannot double-process.
 */
export interface IdempotencyStore {
  /** Run `op` exactly once for `key`; subsequent calls return the stored result. */
  once<T>(key: string, op: () => Promise<T>): Promise<T>;
}

type Entry = { status: "in-flight" | "done"; result?: unknown; promise?: Promise<unknown> };

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly entries = new Map<string, Entry>();

  async once<T>(key: string, op: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing) {
      if (existing.status === "done") return existing.result as T;
      return existing.promise as Promise<T>;
    }
    const promise = (async () => {
      try {
        const result = await op();
        this.entries.set(key, { status: "done", result });
        return result;
      } catch (err) {
        // The side effect did not complete; drop the entry so a retry (webhook redelivery,
        // transient failure) can run again. Production records the key in the SAME transaction
        // as the side effect, so a rollback un-records both atomically.
        this.entries.delete(key);
        throw err;
      }
    })();
    this.entries.set(key, { status: "in-flight", promise });
    return promise;
  }
}
