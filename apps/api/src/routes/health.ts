import type { FastifyInstance } from "fastify";

/** Liveness/readiness. Public (no auth) so load balancers and uptime checks can hit it. */
export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/health", async () => ({ status: "ok" }));
}
