import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

const KNOWN_CODES: Record<string, string> = {
  ValidationError: 'Please check the form and try again.',
  EmailOrUsernameTaken: 'That email or username is already taken.',
  InvalidCredentials: 'Incorrect email or password.',
  Unauthorized: 'You need to log in to do that.',
  InternalError: 'Something went wrong on our end. Try again in a moment.',
};

export function getApiErrorMessage(error: FetchBaseQueryError | SerializedError | undefined): string | null {
  if (!error) return null;

  if ('status' in error) {
    if (error.status === 'FETCH_ERROR') {
      return 'Could not reach the server. Check that the API is running on port 4000.';
    }

    const data = error.data;
    if (data && typeof data === 'object' && 'error' in data) {
      const code = (data as { error: unknown }).error;
      if (typeof code === 'string') {
        return KNOWN_CODES[code] ?? code;
      }
    }

    return `Request failed (${String(error.status)}).`;
  }

  return error.message ?? 'Something went wrong.';
}