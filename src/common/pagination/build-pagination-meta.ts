import type { IPaginationMeta } from './pagination-meta.interface.js';

export function buildPaginationMeta(input: {
  total: number;
  page: number;
  perPage: number;
}): IPaginationMeta {
  const { total, page, perPage } = input;
  const safePerPage = Math.max(1, perPage);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePerPage);
  const hasNextPage = totalPages > 0 && page < totalPages;
  const hasPreviousPage = page > 1;
  return {
    total,
    page,
    perPage: safePerPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}
