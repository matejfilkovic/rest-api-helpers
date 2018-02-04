// @flow

import {
  buildUrlWithQueryParams
} from './index'

describe('buildUrlWithQueryParams', () => {
  const tcs = [
    {
      baseUrl: 'http://someurl.com',
      queryParams: [],
      expected: 'http://someurl.com'
    },
    {
      baseUrl: 'http://someurl.com',
      queryParams: [
        { name: 'agencyId', value: '12' }
      ],
      expected: 'http://someurl.com?agencyId=12'
    },
    {
      baseUrl: 'http://someurl.com',
      queryParams: [
        { name: 'agencyId', value: '12' },
        { name: 'titleId', value: '43' },
      ],
      expected: 'http://someurl.com?agencyId=12&titleId=43'
    },
    {
      baseUrl: 'http://someurl.com',
      queryParams: [
        { name: 'agencyId', value: '12' },
        { name: 'titleId', value: '43' },
        { name: 'areaId', value: [] }
      ],
      expected: 'http://someurl.com?agencyId=12&titleId=43'
    },
    {
      baseUrl: 'http://someurl.com',
      queryParams: [
        { name: 'agencyId', value: '12' },
        { name: 'titleId', value: '43' },
        { name: 'areaId', value: ['1', '2', '3'] }
      ],
      expected: 'http://someurl.com?agencyId=12&titleId=43&areaId=1,2,3'
    },
    {
      baseUrl: 'http://someurl.com',
      queryParams: [
        { name: 'agencyId', value: '12' },
        { name: 'titleId', value: '43' },
        { name: 'areaId', value: [1, 2, 3] },
        { name: 'division', value: [] }
      ],
      expected: 'http://someurl.com?agencyId=12&titleId=43&areaId=1,2,3'
    },
    {
      baseUrl: 'http://someurl.com',
      queryParams: [
        { name: 'agencyId', value: '12' },
        { name: 'titleId', value: '43' },
        { name: 'areaId', value: [1, 2, 3] },
        { name: 'division', value: [145, 121, 42] }
      ],
      expected: 'http://someurl.com?agencyId=12&titleId=43&areaId=1,2,3&division=145,121,42'
    }
  ]

  tcs.forEach((tc) => {
    test('builds url as expected', () => {
      expect(buildUrlWithQueryParams(tc.baseUrl, tc.queryParams)).toEqual(tc.expected)
    })
  })
})
