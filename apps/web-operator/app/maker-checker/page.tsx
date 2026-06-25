import { PageHeader, EmptyState } from "@fimco/ui";

export default function MakerCheckerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Controls"
        title="Maker-checker queue"
        subtitle="Every money- or position-moving action awaits a second approver. Initiator ≠ approver; self-approval is blocked."
      />
      <EmptyState
        title="Queue is empty"
        message="Proposed actions awaiting a second authorizer will appear here once the approvals API is wired (the domain enforcement already exists in @fimco/core)."
      />
    </>
  );
}
