import type { IPaginationMeta } from '../pagination/pagination-meta.interface.js';

export interface IApiResponse<T = unknown> {
  message: string;
  data: T;
  meta?: IPaginationMeta;
}
