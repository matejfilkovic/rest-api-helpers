// @flow

import type { Axios, $AxiosError } from 'axios'

import {
  buildUrlWithQueryParams
} from '../utils'

import type {
  QueryParam,
  AccessClient
} from '../types'

export default class AuthorizedAccessClient implements AccessClient {
  static _extendEndpointWithQueryParams(endpoint: string, queryParams?: Array<QueryParam>) {
    return queryParams ? buildUrlWithQueryParams(endpoint, queryParams) : endpoint
  }

  static _isUnauthorizedError(error: $AxiosError<any>) {
    return error.response && error.response.status === 401
  }

  axios: Axios
  accessToken: string
  refreshToken: string
  authorizationHeaderName: string
  onSessionRefreshFailure: (Error) => void
  onSessionRefreshSuccess: (string) => void
  getAuthorizationHeaderContent: (string) => string
  refreshAccessToken: (string) => Promise<string>

  signOut: () => void
  _axiosResponseErrorInterceptor: (Error) => Promise<any>

  constructor(
    axios: Axios,
    onSessionRefreshSuccess: (string) => void,
    onSessionRefreshFailure: (Error) => void,
    getAuthorizationHeaderContent: (string) => string,
    refreshAccessToken: (string) => Promise<string>,
    authorizationHeaderName: string
  ) {
    this.axios = axios
    this.onSessionRefreshSuccess = onSessionRefreshSuccess
    this.onSessionRefreshFailure = onSessionRefreshFailure
    this.getAuthorizationHeaderContent = getAuthorizationHeaderContent
    this.refreshAccessToken = refreshAccessToken
    this.authorizationHeaderName = authorizationHeaderName

    this.signOut = this.signOut.bind(this)

    this._axiosResponseErrorInterceptor = this._axiosResponseErrorInterceptor.bind(this)

    this._setInterceptorForAxiosInstance()
  }

  setTokens(refreshToken: string, accessToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken

    this._passAccessTokenToAxiosInstance(accessToken)
  }

  _setInterceptorForAxiosInstance() {
    this.axios.interceptors.response.use(
      null,
      this._axiosResponseErrorInterceptor
    )
  }

  /* eslint-disable no-param-reassign */
  _axiosResponseErrorInterceptor(err: $AxiosError<any>) {
    if (
      AuthorizedAccessClient._isUnauthorizedError(err) &&
      err.config &&
      !err.config._isRetryRequest
    ) {
      // $FlowFixMe: suppressing this error until I can refactor.
      err.config._isRetryRequest = true

      return (
        this.refreshAccessToken(this.refreshToken)
          .then((accessToken) => {
            this.onSessionRefreshSuccess(accessToken)

            // $FlowFixMe: suppressing this error until I can refactor.
            err.config.headers[this.authorizationHeaderName] = this.getAuthorizationHeaderContent(accessToken)

            return this.axios(err.config)
          })
          .catch((error) => {
            if (AuthorizedAccessClient._isUnauthorizedError(error)) {
              this.signOut()
              this.onSessionRefreshFailure(error)
            }

            throw error
          })
      )
    }

    // $FlowFixMe: suppressing this error until I can refactor.
    return Promise.reject(err)
  }
  /* eslint-enable no-param-reassign */

  _passAccessTokenToAxiosInstance(accessToken: ?string) {
    if (accessToken) {
      this.axios.defaults.headers.common[this.authorizationHeaderName] = this.getAuthorizationHeaderContent(accessToken)
    }
    else {
      this.axios.defaults.headers.common[this.authorizationHeaderName] = null
    }
  }

  signOut() {
    this._passAccessTokenToAxiosInstance(null)
  }

  get(endpoint: string, queryParams?: Array<QueryParam>) {
    const extendedEndpoint = AuthorizedAccessClient._extendEndpointWithQueryParams(endpoint, queryParams)

    return (
      this.axios.get(extendedEndpoint)
        .then(result => result.data)
    )
  }

  post(endpoint: string, params: any) {
    return (
      this.axios.post(endpoint, params)
        .then(result => result.data)
    )
  }

  put(endpoint: string, params: any) {
    return (
      this.axios.put(endpoint, params)
        .then(result => result.data)
    )
  }

  sendRequestWithConfig(config: any) {
    return this.axios(config)
  }
}
