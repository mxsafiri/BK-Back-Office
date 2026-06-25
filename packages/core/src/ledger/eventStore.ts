import { newId, type EventId } from "@fimco/shared";

/**
 * Append-only event store (CLAUDE.md rule #5). Events are NEVER updated or deleted.
 * Corrections are new events that reference the original. The audit trail is a
 * by-product of this log.
 *
 * In-memory Phase-0 implementation. Production = Postgres with an append-only table,
 * a per-stream monotonic sequence, and optimistic concurrency on (streamId, seq).
 */
export interface DomainEvent {
  readonly type: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface StoredEvent extends DomainEvent {
  readonly id: EventId;
  readonly streamId: string;
  readonly seq: number;
  readonly at: string; // ISO timestamp
}

export interface EventStore {
  append(streamId: string, events: DomainEvent[]): Promise<StoredEvent[]>;
  read(streamId: string): Promise<StoredEvent[]>;
  readAll(): Promise<StoredEvent[]>;
}

export class InMemoryEventStore implements EventStore {
  private readonly streams = new Map<string, StoredEvent[]>();
  private readonly all: StoredEvent[] = [];

  async append(streamId: string, events: DomainEvent[]): Promise<StoredEvent[]> {
    const stream = this.streams.get(streamId) ?? [];
    const stored = events.map((e, i): StoredEvent => ({
      ...e,
      id: newId("evt"),
      streamId,
      seq: stream.length + i,
      at: new Date().toISOString(),
    }));
    this.streams.set(streamId, [...stream, ...stored]);
    this.all.push(...stored);
    return stored;
  }

  async read(streamId: string): Promise<StoredEvent[]> {
    return [...(this.streams.get(streamId) ?? [])];
  }

  async readAll(): Promise<StoredEvent[]> {
    return [...this.all];
  }
}
