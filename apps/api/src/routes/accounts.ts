import type { FastifyInstance } from "fastify";
import type { AccountId } from "@fimco/shared";
import type { Container } from "../container.js";
import type { ApiConfig } from "../config.js";
import { authenticate, requireRoles } from "../auth.js";

/** Read an account's cash balance (operator-only). Surfaces both the live nTZS balance and our
 *  mirrored balance so a drift is visible. bigint is serialised as string (JSON-safe). */
export function registerAccountRoutes(app: FastifyInstance, deps: { container: Container; config: ApiConfig }): void {
  const { container, config } = deps;

  app.get<{ Params: { id: string } }>(
    "/accounts/:id/balance",
    { preHandler: [authenticate(config), requireRoles("operator")] },
    async (request, reply) => {
      const account = await container.accounts.get(request.params.id as AccountId);
      if (!account) {
        return reply.code(404).send({ error: "account_not_found" });
      }
      const live = await container.cash.getBalance(account.cashUserId);
      const mirror = await container.mirror.balance(account.cashUserId);
      return reply.send({
        accountId: account.id,
        status: account.status,
        cashUserId: account.cashUserId,
        currency: live.currency,
        liveBalanceMinor: live.minor.toString(),
        mirrorBalanceMinor: mirror.minor.toString(),
      });
    },
  );
}
