import { PageHeader, EmptyState } from "@fimco/ui";

export default function AuditPage() {
  return (
    <>
      <PageHeader
        eyebrow="Controls"
        title="Audit log"
        subtitle="Append-only record of every state change to money or positions — searchable, exportable."
      />
      <EmptyState
        title="Audit explorer coming soon"
        message="The append-only event store already records every change; this view will query and export it once the read API lands."
      />
    </>
  );
}
