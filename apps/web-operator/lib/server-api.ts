import { createApiClient } from "@fimco/api-client";

/**
 * Server-only API client. The bearer token is read from a SERVER env var (never NEXT_PUBLIC),
 * so it stays out of the browser bundle. Import this only from route handlers / server components
 * — the browser talks to our same-origin /api/operator/* routes, which call this. In production
 * the token comes from the authenticated session (OIDC), not a static env value.
 */
export function serverApi() {
  return createApiClient({
    baseUrl: process.env.API_BASE_URL ?? "http://localhost:3001",
    getToken: () => process.env.OPERATOR_API_TOKEN ?? "dev-operator-token",
  });
}
