// apps/web/app/page.tsx
'use client';

import { useGetHealthQuery } from '../lib/healthApi';

export default function HealthPage() {
  const { data, error, isLoading } = useGetHealthQuery();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">newsfeed system</h1>

      {isLoading && <p className="text-gray-500">checking backend health...</p>}

      {error && (
        <div className="rounded border border-red-500 bg-red-50 p-4 text-red-700">
          <p className="font-medium">could not reach backend</p>
          <p className="text-sm">check that apps/api is running on port 4000</p>
        </div>
      )}

      {data && (
        <div
          className={`rounded border p-4 ${
            data.status === 'ok'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-yellow-500 bg-yellow-50 text-yellow-700'
          }`}
        >
          <p className="font-medium">status: {data.status}</p>
          <p className="text-sm">database: {data.checks.database ? 'up' : 'down'}</p>
          <p className="text-sm">redis: {data.checks.redis ? 'up' : 'down'}</p>
        </div>
      )}
    </main>
  );
}