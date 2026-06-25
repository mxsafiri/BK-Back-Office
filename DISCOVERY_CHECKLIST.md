# DISCOVERY_CHECKLIST.md — FIMCO Broker Back Office

The specific external answers needed to unblock the money-critical build. Each item lists
**who to ask**, **what to ask**, and **what it unblocks**. Record answers inline (date + source)
so `CLAUDE.md` "BLOCKED" items can be lifted one by one.

Priority order: **1 (CMSA custody) is the critical path.** Start it first; it has the longest
lead time and gates the most.

---

## 1. CMSA — client money & the T+0 settlement model  [CRITICAL PATH]

**Ask:**
- Can client funds be held as **nTZS in per-client subwallets** and count as segregated client
  money, or is a **regulated bank trust account** required for client cash?
- If a trust account is required, is a **hybrid** model acceptable — bank trust account as the
  legal record of client money, nTZS as the operational settlement/transfer rail mirrored to it?
- Is **T+0 payout to a seller before CSD settlement** (a settlement advance) permitted? If so,
  what backing/capital/float rules apply to the advance?
- What is the **regulatory status of nTZS** as a settlement instrument for a licensed dealing
  member (e-money / stablecoin treatment)?
- Client-money **reconciliation and reporting** obligations and frequency.
- **Data residency** expectations for client and transaction data (on-prem vs cloud region).

**Unblocks:** final cash-leg/custody design; whether the T+0 seller-payout path can be built;
the `CashLedger` backing-store decision; hosting target.

**Recommended:** get this in writing, with legal counsel involved.

**Answer (record here):**
- Date / source:
- Decision: nTZS-only ▢   hybrid (bank trust + nTZS) ▢   bank-only for client money ▢
- T+0 advance permitted: yes ▢  no ▢  conditions:
- Residency:

---

## 2. DSE / CSD — integration & settlement

**Ask:**
- **API specs** for: executed-trade feed, CSD position/holding queries, and settlement.
- Are **settlement instructions pushed via API** or only via a portal? Auth model, environments
  (sandbox vs prod), rate limits.
- Data **formats and identifiers** (instrument codes, account/CDS account IDs, trade/settlement refs).
- **Settlement cycle confirmation** — T+2 or T+3 for equities? Any instrument-specific variations.
- Reconciliation data: what the broker can pull to perform the **3-way match**
  (broker book ↔ DSE trade report ↔ CSD settlement) and at what cadence.
- Any **DvP** mechanics or constraints relevant to coordinating the cash leg.

**Unblocks:** reconciliation engine, settlement orchestrator, the `dse`/`csd` adapters
(currently stubbed), settlement-cycle config value.

**Answer (record here):**
- Date / source:
- Trade feed: API ▢ file ▢ portal ▢  — spec link:
- Settlement instructions: API ▢ portal ▢
- Settlement cycle: T+2 ▢ T+3 ▢
- Sandbox available: yes ▢ no ▢

---

## 3. nTZS team — partner terms & treasury

**Ask:**
- **Partner onboarding / KYB** for FIMCO; production vs test key issuance.
- **Treasury + sub-wallet** setup (Escrow / Settlement / Reserves / Disbursement / Fees) — limits,
  controls, and how sub-wallets are created/managed via API.
- **Pricing:** per-transaction fees on deposits, transfers, withdrawals, swaps, ramps; platform-fee
  configuration; any monthly/partner minimums.
- **Limits & approvals:** the ≥ 1,000,000 TZS withdrawal-approval threshold and SLA; bulk-payout limits.
- **Webhook** configuration, signing-secret issuance/rotation, and redelivery behavior.
- **Float / liquidity** model for backing T+0 advances; settlement/treasury funding mechanics.
- Operational **SLAs, support, and incident** process; status/uptime.
- Confirmation of **mobile networks** covered for on/off-ramp and any per-network constraints.

**Unblocks:** per-transaction fee modelling (cost estimate), production cutover, treasury design,
the T+0 advance float mechanics.

**Answer (record here):**
- Date / source:
- KYB status:
- Pricing summary:
- Webhook secret + rotation process:
- Large-withdrawal SLA:

---

## 4. Fees, taxes & reporting formats (CMSA / DSE / TRA)

**Ask:**
- Current **brokerage tariff** structure and any caps/tiers.
- **DSE & CMSA levies** and their calculation basis.
- **VAT** treatment and any **CGT / stamp duty** applicable to securities transactions (TRA).
- **Contract-note** mandated content/format.
- **Regulatory report** catalogue: which reports, formats, and frequency (daily/periodic) to CMSA & DSE.

**Unblocks:** fee/tax engine tariff tables (structure builds now, rates plug in here),
contract-note layout, the reporting module.

**Answer (record here):**
- Date / source:
- Brokerage / levies / VAT / CGT:
- Contract-note format:
- Report list + frequency:

---

## 5. Commercial readiness (confirm before sinking engineering time)

- [ ] FIMCO engagement scope and funding confirmed.
- [ ] nTZS partner terms agreed (Item 3).
- [ ] Hosting/residency decision made (depends on Item 1).
- [ ] Named accountable owner for money-movement logic and security sign-off.

---

## Status tracker

| # | Item | Owner | Status | Date answered |
|---|------|-------|--------|---------------|
| 1 | CMSA client money / T+0 |  | ▢ open |  |
| 2 | DSE/CSD integration |  | ▢ open |  |
| 3 | nTZS partner terms |  | ▢ open |  |
| 4 | Fees / reporting formats |  | ▢ open |  |
| 5 | Commercial readiness |  | ▢ open |  |

When an item is answered, lift the matching entry from the **BLOCKED** list in `CLAUDE.md`.
