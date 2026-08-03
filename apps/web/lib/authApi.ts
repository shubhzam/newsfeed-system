import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { logout } from './authSlice';
import {
  authResponseSchema,
  meResponseSchema,
  type AuthResponse,
  type LoginInput,
  type SignupInput,
  type User,
} from '@repo/shared/auth';
import { setSession } from './authSlice';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    api.dispatch(logout());
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    signup: builder.mutation<AuthResponse, SignupInput>({
      query: (body) => ({ url: '/api/auth/signup', method: 'POST', body }),
      transformResponse: (raw) => authResponseSchema.parse(raw),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setSession(data));
      },
    }),
    login: builder.mutation<AuthResponse, LoginInput>({
      query: (body) => ({ url: '/api/auth/login', method: 'POST', body }),
      transformResponse: (raw) => authResponseSchema.parse(raw),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setSession(data));
      },
    }),
    me: builder.query<User, void>({
      query: () => '/api/auth/me',
      transformResponse: (raw) => meResponseSchema.parse(raw),
    }),
  }),
});

export const { useSignupMutation, useLoginMutation, useMeQuery } = authApi;