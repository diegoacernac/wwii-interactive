import { Request } from 'express';

export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function getPagination(req: Request, defaultPageSize = 25, maxPageSize = 100): Pagination {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(String(req.query.pageSize ?? String(defaultPageSize)), 10) || defaultPageSize)
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginatedResponse<T>(data: T[], total: number, { page, pageSize }: Pagination) {
  return {
    data,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}
