import type { FastifyInstance } from "fastify";
import type { Container } from "../container.js";
import type { ApiConfig } from "../config.js";

/**
 * nTZS webhook endpoint. Authenticated by HMAC signature (not bearer auth), so it is public to
 * the network but rejects anything unsigned/forged. Uses the RAW body for verification.
 */
export function registerWebhookRoutes(app: FastifyInstance, deps: { container: Container; config: ApiConfig }): void {
  const { container, config } = deps;

  app.post("/webhooks/ntzs", async (request, reply) => {
    const timestamp = request.headers[config.ntzs.timestampHeader];
    const signature = request.headers[config.ntzs.signatureHeader];
    if (typeof timestamp !== "string" || typeof signature !== "string") {
      return reply.code(400).send({ error: "missing_signature_headers" });
    }

    try {
      const outcome = await container.receiver.handle({
        timestamp,
        rawBody: request.rawBody ?? "",
        signature,
      });
      if (outcome.status === "rejected") {
        return reply.code(outcome.reason === "bad_signature" ? 401 : 400).send(outcome);
      }
      // processed | duplicate | ignored are all 200 — acknowledge so nTZS stops retrying.
      return reply.code(200).send(outcome);
    } catch (err) {
      // Malformed payload past the signature check — 400 so the delivery is retried/inspected.
      request.log.warn({ err: (err as Error).message }, "ntzs webhook payload error");
      return reply.code(400).send({ error: "invalid_payload" });
    }
  });
}
