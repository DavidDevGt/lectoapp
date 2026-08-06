export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export function toPaginationMeta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
