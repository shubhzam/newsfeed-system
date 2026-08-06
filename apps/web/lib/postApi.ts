import { createApi } from '@reduxjs/toolkit/query/react';
import { postSchema, type CreatePostInput, type Post } from '@repo/shared/post';
import { baseQueryWithReauth } from './authApi';

export const postApi = createApi({
  reducerPath: 'postApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    createPost: builder.mutation<Post, CreatePostInput>({
      query: (body) => ({ url: '/api/posts', method: 'POST', body }),
      transformResponse: (raw) => postSchema.parse(raw),
    }),
  }),
});

export const { useCreatePostMutation } = postApi;