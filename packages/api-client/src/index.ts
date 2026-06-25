/**
 * @fimco/api-client — the typed contract between the frontends and the API. No dependencies,
 * no secrets, no money logic; just DTOs and a fetch-based client.
 */
export * from "./types.js";
export { createApiClient, ApiError } from "./client.js";
export type { ApiClient, ApiClientOptions } from "./client.js";
