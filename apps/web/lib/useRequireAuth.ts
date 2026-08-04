'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from './hooks';

export function useRequireAuth() {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  return { isAuthenticated: Boolean(token), user };
}