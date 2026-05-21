import { buildPaginationMeta } from './build-pagination-meta.js';

describe('buildPaginationMeta', () => {
  it('computes pages and flags for a non-empty total', () => {
    expect(buildPaginationMeta({ total: 41, page: 2, perPage: 20 })).toEqual({
      total: 41,
      page: 2,
      perPage: 20,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('handles empty total', () => {
    expect(buildPaginationMeta({ total: 0, page: 1, perPage: 20 })).toEqual({
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });
});
