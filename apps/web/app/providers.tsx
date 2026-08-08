'use client';

import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from '../lib/store';
import { loadStoredSession, setSession } from '../lib/authSlice';

function AuthHydrator() {
  const dispatch = useDispatch();

  useEffect(() => {
    const stored = loadStoredSession();
    if (stored) {
      dispatch(setSession(stored));
    }
  }, [dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator />
      {children}
    </Provider>
  );
}