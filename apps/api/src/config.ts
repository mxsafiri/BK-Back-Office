import type { Principal } from "./auth.js";

/**
 * Backend configuration, loaded from env (CLAUDE.md rule #7: secrets only from env, backend-only).
 * Never log the webhook secret or auth tokens.
 */
export interface ApiConfig {
  readonly port: number;
  readonly ntzs: {
    readonly webhookSecret: string;
    readonly signatureHeader: string;
    readonly timestampHeader: string;
  };
  /**
   * STUB auth: bearer token -> principal. Replace with OIDC/SSO before production. In production
   * with no tokens configured the map is empty, so every authenticated route default-denies.
   */
  readonly authTokens: ReadonlyMap<string, Principal>;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const isProd = env.NODE_ENV === "production";
  return {
    port: Number(env.PORT ?? 3001),
    ntzs: {
      webhookSecret: env.NTZS_WEBHOOK_SECRET ?? (isProd ? "" : "whsec_dev_only"),
      signatureHeader: (env.NTZS_SIGNATURE_HEADER ?? "x-ntzs-signature").toLowerCase(),
      timestampHeader: (env.NTZS_TIMESTAMP_HEADER ?? "x-ntzs-timestamp").toLowerCase(),
    },
    authTokens: parseAuthTokens(env.API_AUTH_TOKENS, isProd),
  };
}

/**
 * Parse `API_AUTH_TOKENS` as JSON: { "<token>": { "userId": "...", "roles": ["operator"] } }.
 * Outside production, falls back to a single clearly-marked dev token. NEVER use the dev token
 * in production — set real tokens (or, properly, OIDC) there.
 */
function parseAuthTokens(raw: string | undefined, isProd: boolean): ReadonlyMap<string, Principal> {
  const map = new Map<string, Principal>();
  if (raw) {
    const parsed = JSON.parse(raw) as Record<string, Principal>;
    for (const [token, principal] of Object.entries(parsed)) map.set(token, principal);
    return map;
  }
  if (!isProd) {
    map.set("dev-operator-token", { userId: "ops.dev", roles: ["operator"] });
  }
  return map;
}
