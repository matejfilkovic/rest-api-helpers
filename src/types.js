// @flow

export type QueryParam = {
  name: string,
  value: string | Array<string | number>
}

export interface AccessClient {
  get(endpoint: string, queryParams?: Array<QueryParam>): Promise<any>;

  post(endpoint: string, params: any): Promise<any>;

  put(endpoint: string, params: any): Promise<any>;

  sendRequestWithConfig(config: any): Promise<any>;
}
