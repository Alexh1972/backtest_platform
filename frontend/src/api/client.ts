const STORAGE_KEY = "backtest.token";

export type SignInRequest = { username: string; password: string };
export type SignUpRequest = { username: string; password: string; email: string };
export type JwtAuthenticationResponse = { token: string };

export type SubmissionDto = { hash: string; createdAt: number | null };

export type BaseResponse = {
  message?: string;
  error?: { errors: string[] };
  status?: "SUCCESS" | "ERROR";
};

export type StrategyRunServerResponse = {
  message?: string;
  id?: number;
  error?: { errors: string[] };
  status?: "SUCCESS" | "ERROR";
};

export type StrategyReport = {
  strategyReportId: number;
  tickers: string;
  startDate: string;
  endDate: string;
  fileHash: string;
  fullReturn: number;
  annualizedReturn: number;
  dailyReturn: number;
  annualRisk: number;
  dailyRisk: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  beta: number;
  alpha: number;
  var95: number;
  skewness: number;
  kurtosis: number;
  lastUpdated: number;
  status: "RUNNING" | "COMPLETED";
};

export type StrategySubmitRequest = {
  start: string;
  end: string;
  code: string;
};

export type StrategyRunRequest = {
  tickers: string[];
  start: string;
  end: string;
  file: string;
  capital: number;
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.auth !== false) {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(path, { ...init, headers });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* not JSON */
  }
  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body
        ? (body as { error?: { errors?: string[] } }).error?.errors?.join(", ")
        : null) ||
      (typeof body === "string" ? body : null) ||
      res.statusText;
    throw new ApiError(res.status, msg || `HTTP ${res.status}`, body);
  }
  return body as T;
}

export const api = {
  signin: (body: SignInRequest) =>
    request<JwtAuthenticationResponse>("/api/signin", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body),
    }),

  signup: (body: SignUpRequest) =>
    request<JwtAuthenticationResponse>("/api/signup", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body),
    }),

  listSubmissions: () =>
    request<SubmissionDto[]>("/api/strategy/submissions", { method: "GET" }),

  getSubmissionCode: (hash: string) =>
    request<BaseResponse>(`/api/strategy/submission/${encodeURIComponent(hash)}/code`, {
      method: "GET",
    }),

  submitStrategy: (body: StrategySubmitRequest) =>
    request<BaseResponse>("/api/strategy/submit", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  runStrategy: (body: StrategyRunRequest) =>
    request<StrategyRunServerResponse>("/api/strategy/run", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listReports: (hash: string) =>
    request<StrategyReport[]>(
      `/api/strategy/reports?hash=${encodeURIComponent(hash)}`,
      { method: "GET" }
    ),

  getReport: (id: number) =>
    request<StrategyReport | null>(`/api/strategy/report/${id}`, { method: "GET" }),
};
