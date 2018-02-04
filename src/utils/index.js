// @flow

import type {
  QueryParam
} from '../types'

export function buildUrlWithQueryParams(baseUrl: string, queryParams: Array<QueryParam>): string {
  if (!queryParams.length) return baseUrl

  const queryParamsKeyValue = (
    queryParams.map((queryParam) => {
      const {
        name,
        value
      } = queryParam

      if (Array.isArray(value)) {
        if (!value.length) return null

        return `${name}=${value.join(',')}`
      }

      return `${name}=${value}`
    }).filter(keyValue => keyValue)
  )

  return encodeURI(`${baseUrl}?${queryParamsKeyValue.join('&')}`)
}
