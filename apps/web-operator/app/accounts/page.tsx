import { PageHeader } from "@fimco/ui";
import { BalanceLookup } from "./BalanceLookup";

export default function AccountsPage({ searchParams }: { searchParams: { id?: string } }) {
  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Accounts & balances"
        subtitle="Live nTZS balance (read at request time) vs our mirrored ledger — drift surfaces as a break."
      />
      <BalanceLookup initialId={searchParams.id ?? ""} />
    </>
  );
}
