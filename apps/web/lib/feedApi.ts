import { createApi } from '@reduxjs/toolkit/query/react';
import { feedResponseSchema, type FeedResponse } from '@repo/shared/feed';
import { baseQueryWithReauth } from './authApi';

export const feedApi = createApi({
  reducerPath: 'feedApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getFeed: builder.query<FeedResponse, string | undefined>({
      query: (cursor) => (cursor ? `/api/feed?cursor=${cursor}` : '/api/feed'),
      transformResponse: (raw) => feedResponseSchema.parse(raw),
    }),
  }),
});

export const { useLazyGetFeedQuery } = feedApi;