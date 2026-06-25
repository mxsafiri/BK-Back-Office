import type { FastifyReply, FastifyRequest } from "fastify";
import type { ApiConfig } from "./config.js";

/**
 * Authn/authz (CLAUDE.md rule #8: least-privilege RBAC + default deny on every endpoint).
 *
 * STUB: bearer token -> principal lookup. This stands in for OIDC/SSO so the API is testable
 * now; replace the token map with real token introspection before production. The authorization
 * model (default-deny, role checks) is the part that must survive — keep it server-side.
 */
export interface Principal {
  readonly userId: string;
  readonly roles: readonly string[];
}

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: string;
    principal?: Principal;
  }
}

/** preHandler: authenticate the bearer token or reject with 401. Attaches request.principal. */
export function authenticate(config: ApiConfig) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    const principal = token ? config.authTokens.get(token) : undefined;
    if (!principal) {
      await reply.code(401).send({ error: "unauthorized" });
      return;
    }
    request.principal = principal;
  };
}

/**
 * preHandler factory: require ANY of the given roles. Default-deny — if the principal is missing
 * (authenticate not run / failed) or lacks every role, respond 403.
 */
export function requireRoles(...roles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const principal = request.principal;
    if (!principal || !roles.some((r) => principal.roles.includes(r))) {
      await reply.code(403).send({ error: "forbidden" });
    }
  };
}
