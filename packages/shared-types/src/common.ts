/** ISO-8601 timestamp string, e.g. "2026-09-06T10:15:00.000Z". */
export type ISODateString = string;

/** Ghana Cedi amount expressed in the smallest unit (pesewas) to avoid float drift. */
export type Pesewas = number;

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

/** Uniform error envelope returned by the backend for every non-2xx response. */
export interface ApiErrorBody {
  statusCode: number;
  /** Stable, machine-readable code, e.g. "OTP_EXPIRED". */
  error: string;
  /** Human-readable, safe to show to the user. */
  message: string;
  /** Field-level validation errors keyed by dotted path. */
  fieldErrors?: Record<string, string[]>;
  path: string;
  timestamp: ISODateString;
}

export const CURRENCY = 'GHS' as const;
export type Currency = typeof CURRENCY;

/** Convert a whole-cedi number to pesewas for storage/transport. */
export const toPesewas = (cedis: number): Pesewas => Math.round(cedis * 100);

/** Convert pesewas back to a cedi number for display/formatting. */
export const fromPesewas = (pesewas: Pesewas): number => pesewas / 100;
