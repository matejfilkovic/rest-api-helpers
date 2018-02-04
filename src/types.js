// @flow

export interface AccessClient {
  get(endpoint: string, queryParams: any): Promise<any>;

  post(endpoint: string, params: any): Promise<any>;

  put(endpoint: string, params: any): Promise<any>;

  sendRequestWithConfig(config: any): Promise<any>;
}
