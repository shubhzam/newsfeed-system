// apps/web/lib/healthApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

type HealthResponse = {
  status: 'ok' | 'degraded';
  checks: {
    database: boolean;
    redis: boolean;
  };
};

export const healthApi = createApi({
  reducerPath: 'healthApi',
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_URL }),
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => '/health',
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;