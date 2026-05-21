import type { IPaginationMeta } from './pagination-meta.interface.js';

/**
 * Controller return value: {@link ResponseInterceptor} unwraps to
 * `{ message, data: items[], meta }`.
 */
export class PaginatedResult<T> {
  constructor(
    readonly items: T[],
    readonly meta: IPaginationMeta,
  ) {}
}
