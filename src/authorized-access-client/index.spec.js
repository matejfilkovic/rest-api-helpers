import sinon from 'sinon'
import axios from 'axios'

import AuthorizedAccessClient from './index'

describe('AuthorizedAccessClient', () => {
  const authorizationHeaderName = 'Authorization'

  let axiosInstance
  let authorizedAccessClient
  let onSessionRefreshSuccess
  let onSessionRefreshFailure
  let getAuthorizationHeaderContent
  let refreshAccessToken

  beforeEach(() => {
    axiosInstance = axios.create()

    onSessionRefreshFailure = sinon.stub()
    onSessionRefreshSuccess = sinon.stub()
    getAuthorizationHeaderContent = sinon.stub()
    refreshAccessToken = sinon.stub()

    authorizedAccessClient = new AuthorizedAccessClient(
      axiosInstance,
      onSessionRefreshSuccess,
      onSessionRefreshFailure,
      getAuthorizationHeaderContent,
      refreshAccessToken,
      authorizationHeaderName
    )
  })

  describe('constructor', () => {
    test('sets axios interceptor for response error', () => {
      expect(authorizedAccessClient.axios.interceptors.response.handlers.length).toEqual(1)

      expect(authorizedAccessClient.axios.interceptors.response.handlers[0].rejected)
        .toEqual(authorizedAccessClient._axiosResponseErrorInterceptor)
    })
  })


  describe('_axiosResponseErrorInterceptor', () => {

    describe('request is not a retry', () => {
      describe('response status is 401', () => {
        const accessToken = 'someTokenValue'
        const refreshToken = 'someRefreshTokenValue'

        const updatedAccessToken = 'updatedTokenValue'

        let err
        let axiosStub

        beforeEach(() => {
          err = {
            response: {
              status: 401
            },
            config: { _isRetryRequest: false, someParam: null, headers: {} },
          }

          authorizedAccessClient.setTokens(refreshToken, accessToken)

          // Since axios instance is function and request can be made by
          // passing configuration object to its invocation (axios(config))
          // for interceptor tests we stub axios instance.
          axiosStub = sinon.stub()
          authorizedAccessClient.axios = axiosStub

        })

        test('calls refreshAccessToken to obtain a new access token', () => {
          refreshAccessToken.returns(Promise.resolve(updatedAccessToken))

          return (
            authorizedAccessClient._axiosResponseErrorInterceptor(err)
              .then(() => {
                expect(refreshAccessToken.callCount).toEqual(1)
                expect(refreshAccessToken.calledWith(refreshToken)).toEqual(true)
              })
          )
        })

        test('sets _isRetryRequest to true', () => {
          refreshAccessToken.returns(Promise.resolve(updatedAccessToken))

          return (
            authorizedAccessClient._axiosResponseErrorInterceptor(err)
              .then(() => {
                expect(err.config._isRetryRequest).toEqual(true)
              })
          )
        })

        test('retries a request when a new access token is obtained and returns the request', () => {
          // Set axios stub to return success response, so that we
          // could expect this result.
          const successResponse = { status: 201, data: {} }
          axiosStub.returns(Promise.resolve(successResponse))

          refreshAccessToken.returns(Promise.resolve(updatedAccessToken))
          getAuthorizationHeaderContent.returns(`Token ${updatedAccessToken}`)

          return (
            authorizedAccessClient._axiosResponseErrorInterceptor(err)
              .then((response) => {
                expect(successResponse).toEqual(response)
              })
          )
        })

        test('retries a request with the authorization header set to a new value', () => {
          axiosStub.returns(Promise.resolve())
          getAuthorizationHeaderContent.returns(`Token ${updatedAccessToken}`)

          refreshAccessToken.returns(Promise.resolve(updatedAccessToken))

          return (
            authorizedAccessClient._axiosResponseErrorInterceptor(err)
              .then(() => {
                expect(axiosStub.calledWith({
                  _isRetryRequest: true,
                  someParam: null,
                  headers: {
                    [authorizationHeaderName]: `Token ${updatedAccessToken}`
                  }
                })).toEqual(true)
              })
          )
        })

        test('calls onSessionRefreshSuccess when new a access token is obtained', () => {
          refreshAccessToken.returns(Promise.resolve(updatedAccessToken))

          return (
            authorizedAccessClient._axiosResponseErrorInterceptor(err)
              .then(() => {
                expect(onSessionRefreshSuccess.calledWith(updatedAccessToken)).toEqual(true)
              })
          )
        })

        describe('a new access token can not be obtained', () => {
          let signOutStub
          let getAccessTokenError

          beforeEach(() => {
            signOutStub = sinon.stub(authorizedAccessClient, 'signOut')

            // When new access token can't be obtained, we are
            // expecting refreshAccessToken to return an
            // error with 401 status code.
            getAccessTokenError = new Error('Refresh token not valid')
            getAccessTokenError.response = { status: 401 }

            refreshAccessToken.returns(Promise.reject(getAccessTokenError))
          })

          afterEach(() => {
            signOutStub.restore()
          })

          test('passes an error thrown by refreshAccessToken', () => {
            return (
              authorizedAccessClient._axiosResponseErrorInterceptor(err)
                .then(() => {
                  throw new Error()
                })
                .catch(error => expect(error).toEqual(getAccessTokenError))
            )
          })

          test('calls onSessionRefreshFailure', () => {
            return (
              authorizedAccessClient._axiosResponseErrorInterceptor(err)
                .then(() => {
                  throw new Error()
                })
                .catch((error) => {
                  expect(onSessionRefreshFailure.calledWith(error)).toEqual(true)
                })
            )
          })

          test('does not retry request', () => {
            return (
              authorizedAccessClient._axiosResponseErrorInterceptor(err)
                .then(() => {
                  throw new Error()
                })
                .catch(() => expect(axiosStub.callCount).toEqual(0))
            )
          })

          test('calls signOut', () => {
            return (
              authorizedAccessClient._axiosResponseErrorInterceptor(err)
                .then(() => {
                  throw new Error()
                })
                .catch(() => expect(signOutStub.callCount).toEqual(1))
            )
          })
        })

        test('forwards error from retried request', () => {
          const responseError = {
            response: {
              status: 404,
              message: 'Resource not found!'
            }
          }

          refreshAccessToken.returns(Promise.resolve(updatedAccessToken))
          axiosStub.returns(Promise.reject(responseError))

          return (
            authorizedAccessClient._axiosResponseErrorInterceptor(err)
              .then(() => {
                throw new Error()
              })
              .catch((error) => {
                expect(error).toEqual(responseError)
              })
          )
        })
      })
    })

    describe('request is retry', () => {
      const requestError = {
        response: {
          status: 401
        },
        config: { _isRetryRequest: true, someParam: null }
      }

      test('forwards error from retried request', () => {
        authorizedAccessClient._axiosResponseErrorInterceptor(requestError)
          .then(() => {
            throw new Error()
          })
          .catch(error => expect(error).toEqual(requestError))
      })
    })
  })
})
