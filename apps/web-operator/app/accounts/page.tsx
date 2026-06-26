import { PageHeader } from "@fimco/ui";
import { BalanceLookup } from "./BalanceLookup";
import { DEMO_ACCOUNT_ID } from "../../lib/demo";

export default function AccountsPage({ searchParams }: { searchParams: { id?: string } }) {
  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Accounts & balances"
        subtitle="Live nTZS balance (read at request time) vs our mirrored ledger — drift surfaces as a break."
      />
      <BalanceLookup initialId={searchParams.id ?? DEMO_ACCOUNT_ID} />
    </>
  );
}
