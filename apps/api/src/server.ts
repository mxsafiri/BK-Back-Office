import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { loadConfig, type ApiConfig } from "./config.js";
import { buildContainer, type Container } from "./container.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";
import { registerOnboardingRoutes } from "./routes/onboarding.js";
import { registerAccountRoutes } from "./routes/accounts.js";

export interface BuildOptions {
  config?: ApiConfig;
  container?: Container;
  logger?: boolean;
}

/** Build (but don't start) the Fastify app. Accepts config/container for tests (DI). */
export function buildServer(opts: BuildOptions = {}): { app: FastifyInstance; container: Container; config: ApiConfig } {
  const config = opts.config ?? loadConfig();
  const container = opts.container ?? buildContainer(config);
  const app = Fastify({ logger: opts.logger ?? false });

  // Preserve the raw JSON body so the nTZS webhook HMAC can be verified over `timestamp.body`.
  app.addContentTypeParser("application/json", { parseAs: "string" }, (request: FastifyRequest, body, done) => {
    const raw = body as string;
    request.rawBody = raw;
    try {
      done(null, raw ? JSON.parse(raw) : {});
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  registerHealthRoutes(app);
  registerWebhookRoutes(app, { container, config });
  registerOnboardingRoutes(app, { container, config });
  registerAccountRoutes(app, { container, config });

  return { app, container, config };
}
