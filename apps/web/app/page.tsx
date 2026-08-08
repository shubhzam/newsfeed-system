// apps/web/app/page.tsx
'use client';
import { useState, useEffect, type FormEvent } from 'react';
import { createPostSchema } from '@repo/shared/post';
import { useCreatePostMutation } from '../lib/postApi';
import { getApiErrorMessage } from '../lib/apiError';
import { useGetHealthQuery } from '../lib/healthApi';
import { useAppDispatch } from '../lib/hooks';
import { useRequireAuth } from '../lib/useRequireAuth';
import { logout } from '../lib/authSlice';
import type { FeedPost } from '@repo/shared/feed';
import { useLazyGetFeedQuery } from '../lib/feedApi';

export default function HealthPage() {
  const { data, error, isLoading } = useGetHealthQuery();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useRequireAuth();

  const [createPost, { isLoading: isPosting, error: postError }] = useCreatePostMutation();
  const [content, setContent] = useState('');
  const [postFieldError, setPostFieldError] = useState<string | null>(null);
  const [justPosted, setJustPosted] = useState(false);

  async function handlePostSubmit(e: FormEvent) {
    e.preventDefault();
    setPostFieldError(null);
    setJustPosted(false);

    const parsed = createPostSchema.safeParse({ content });
    if (!parsed.success) {
      setPostFieldError(parsed.error.issues[0]?.message ?? 'Please check your post and try again.');
      return;
    }

    try {
      await createPost(parsed.data).unwrap();
      setContent('');
      setJustPosted(true);
    } catch {
      // error surfaced via postApiErrorMessage below
    }
  }

  const postApiErrorMessage = getApiErrorMessage(postError);

  const [triggerGetFeed, { isFetching: isFeedLoading, error: feedError }] = useLazyGetFeedQuery();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [feedLoaded, setFeedLoaded] = useState(false);

  useEffect(() => {
    async function loadInitialFeed() {
      try {
        const result = await triggerGetFeed(undefined).unwrap();
        setPosts(result.posts);
        setNextCursor(result.nextCursor);
      } catch {
        // error surfaced via feedApiErrorMessage below
      } finally {
        setFeedLoaded(true);
      }
    }
    loadInitialFeed();
  }, [triggerGetFeed]);

  async function handleLoadMore() {
    if (!nextCursor) return;
    try {
      const result = await triggerGetFeed(nextCursor).unwrap();
      setPosts((prev) => [...prev, ...result.posts]);
      setNextCursor(result.nextCursor);
    } catch {
      // error surfaced via feedApiErrorMessage below
    }
  }

  const feedApiErrorMessage = getApiErrorMessage(feedError);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">newsfeed system</h1>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>logged in as {user?.username}</span>
        <button onClick={() => dispatch(logout())} className="underline">
          log out
        </button>
      </div>

      <form onSubmit={handlePostSubmit} className="flex w-full max-w-sm flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          rows={3}
          placeholder="what's happening?"
          className="rounded border border-gray-300 px-3 py-2"
        />

        {(postFieldError || postApiErrorMessage) && (
          <p className="rounded border border-red-500 bg-red-50 p-3 text-sm text-red-700">
            {postFieldError ?? postApiErrorMessage}
          </p>
        )}

        {justPosted && !postFieldError && !postApiErrorMessage && (
          <p className="rounded border border-green-500 bg-green-50 p-3 text-sm text-green-700">
            posted!
          </p>
        )}

        <button
          type="submit"
          disabled={isPosting}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isPosting ? 'posting...' : 'post'}
        </button>
      </form>

      <section className="flex w-full max-w-sm flex-col gap-3">
        {feedApiErrorMessage && (
          <p className="rounded border border-red-500 bg-red-50 p-3 text-sm text-red-700">
            {feedApiErrorMessage}
          </p>
        )}

        {!feedLoaded && !feedApiErrorMessage && (
          <p className="text-sm text-gray-500">loading feed...</p>
        )}

        {feedLoaded && posts.length === 0 && !feedApiErrorMessage && (
          <p className="text-sm text-gray-500">no posts yet.</p>
        )}

        {posts.map((post) => (
          <div key={post.id} className="rounded border border-gray-200 p-3">
            <p className="text-sm font-medium">{post.author.username}</p>
            <p className="text-sm">{post.content}</p>
            <p className="text-xs text-gray-400">{post.createdAt}</p>
          </div>
        ))}

        {nextCursor && (
          <button
            onClick={handleLoadMore}
            disabled={isFeedLoading}
            className="rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-50"
          >
            {isFeedLoading ? 'loading...' : 'load more'}
          </button>
        )}
      </section>

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