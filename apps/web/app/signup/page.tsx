'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signupSchema } from '@repo/shared/auth';
import { useSignupMutation } from '../../lib/authApi';
import { getApiErrorMessage } from '../../lib/apiError';

export default function SignupPage() {
  const router = useRouter();
  const [signup, { isLoading, error }] = useSignupMutation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError(null);

    const parsed = signupSchema.safeParse({ email, username, password });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Please check the form and try again.');
      return;
    }

    try {
      await signup(parsed.data).unwrap();
      router.push('/');
    } catch {
      // error state already surfaced via the `error` value from the hook below
    }
  }

  const apiErrorMessage = getApiErrorMessage(error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">sign up</h1>

      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            maxLength={50}
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            className="rounded border border-gray-300 px-3 py-2"
          />
          <span className="text-xs text-gray-500">8-72 characters</span>
        </label>

        {(fieldError || apiErrorMessage) && (
          <p className="rounded border border-red-500 bg-red-50 p-3 text-sm text-red-700">
            {fieldError ?? apiErrorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isLoading ? 'signing up...' : 'sign up'}
        </button>
      </form>

      <p className="text-sm text-gray-600">
        already have an account?{' '}
        <Link href="/login" className="underline">
          log in
        </Link>
      </p>
    </main>
  );
}