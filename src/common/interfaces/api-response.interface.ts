export interface IApiResponse<T = unknown> {
  message: string;
  data: T;
}
