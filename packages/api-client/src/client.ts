import type {
  OnboardRequest,
  OnboardResponse,
  AccountBalanceResponse,
  HealthResponse,
  ApiErrorBody,
} from "./types.js";

/** Thrown on any non-2xx response. `code` is the API's machine-readable error string. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns the bearer token (or undefined). Called per request so it can refresh. */
  getToken?: () => string | undefined | Promise<string | undefined>;
  /** Inject a fetch implementation (tests, SSR). Defaults to global fetch. */
  fetchFn?: typeof globalThis.fetch;
}

export interface ApiClient {
  health(): Promise<HealthResponse>;
  onboard(input: OnboardRequest): Promise<OnboardResponse>;
  getAccountBalance(accountId: string): Promise<AccountBalanceResponse>;
}

/**
 * Typed client for the FIMCO BBO API. Framework-agnostic (browser, Next.js server, Node). It
 * never holds secrets — only a session bearer token supplied by the caller. All money/position
 * logic stays server-side; this just calls endpoints and returns typed responses.
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  const base = options.baseUrl.replace(/\/$/, "");
  const doFetch = options.fetchFn ?? globalThis.fetch;

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = options.getToken ? await options.getToken() : undefined;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await doFetch(`${base}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const text = await res.text();
    const data: unknown = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      const code =
        data && typeof (data as ApiErrorBody).error === "string"
          ? (data as ApiErrorBody).error
          : `http_${res.status}`;
      throw new ApiError(res.status, code);
    }
    return data as T;
  }

  return {
    health: () => request<HealthResponse>("GET", "/health"),
    onboard: (input) => request<OnboardResponse>("POST", "/onboarding", input),
    getAccountBalance: (accountId) =>
      request<AccountBalanceResponse>("GET", `/accounts/${encodeURIComponent(accountId)}/balance`),
  };
}
