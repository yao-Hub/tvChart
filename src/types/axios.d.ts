export interface CustomResponseType<T> {
  err: number;
  errmsg: string;
  data: T;
}
