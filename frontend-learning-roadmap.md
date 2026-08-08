# Frontend Learning Roadmap

Backend gets a short section since you don't struggle there — this is mostly a frontend curriculum, sequenced the way muscle memory actually builds: one concept, one small build, one deliberate break, one real fix. Same loop that found the hydration bug and the `onQueryStarted` bug in the newsfeed build — that wasn't luck, that's the method. Keep using it.

## Where you already are

Don't skip this — it's the baseline the rest of the roadmap builds on, and it's bigger than it might feel:

- Full-stack build discipline: docs-first, one feature at a time, verify against a real running system, not a compile.
- Redux Toolkit basics: slices, `createSlice`, Immer's "looks mutable, isn't."
- RTK Query basics: `createApi`, `transformResponse` as a validation boundary, base query wrapping, mutations vs. queries, lazy triggers.
- Client-side auth: token storage tradeoffs, session-expiry handling, protected routing via hooks.
- One real SSR concept, learned the hard way: why server and client render must agree on the *first* pass, and why `localStorage` can't be touched before that agreement happens.
- Cursor-based pagination, and why it beats page numbers for anything backed by a list that changes underneath you.

That's not "frontend beginner" — that's someone who's shipped the hard 20% (auth, state boundaries, SSR gotchas) and is missing some of the easy 80% (breadth of React idioms, styling muscle, testing habits). Worth knowing which one you're actually short on.

## Backend — advanced topics (low priority, reference only)

You don't need to slow down here, just know what's on the list for later: rate limiting and backpressure, idempotency keys for retried writes, distributed locks, cache invalidation strategies beyond cache-aside (write-through, write-behind), horizontal sharding, service boundaries once "the API" wants to become "APIs," observability (structured logging → tracing → metrics, in that order of ROI), CI/CD and deploy pipelines, load testing. DDIA already has you pointed at most of this — keep going chapter by chapter, it'll cover this list faster than a bespoke roadmap would.

## Frontend roadmap

### Phase 1 — JS/TS foundations RTK Query assumes you already have
Closures (why a stale closure inside a `useEffect` is the single most common React bug), the microtask queue (why `await` doesn't "pause everything," just that function), promise rejection semantics (you just lived this one — an unhandled rejection from a promise nobody awaited or caught). Practice: predict the output of a few closure-in-a-loop / async-ordering puzzles before you next hit one in real code, not after.

### Phase 2 — React's actual mental model, not just syntax
Render vs. commit as two separate phases. Why state updates are batched. Controlled vs. uncontrolled inputs (you've only built controlled so far — worth knowing what uncontrolled buys you and costs you). Lists and `key` — you've used `key={post.id}`, but predict what breaks if you used array index instead, on a list that reorders. Practice: take the feed's `posts.map()` and deliberately swap the key to array index, then trigger a reorder (post something, watch "load more" reshuffle) — watch React visibly misbehave. Breaking it on purpose teaches the rule faster than reading it.

### Phase 3 — Client state, deeper
You've built one slice. Now learn *when not to reach for Redux*: local `useState` vs. lifting state to a parent vs. Context vs. Redux — four tools, four different "how many components need this and how often does it change" answers. Practice: identify which category `content` (the compose textarea) falls into vs. `auth.token` — you already made this call correctly without naming the principle; now name it.

### Phase 4 — Server state, deeper (this is RTK Query's actual domain)
Cache tags and invalidation (`providesTags`/`invalidatesTags`) — the thing that would make posting via compose auto-refresh the feed, which you deliberately deferred as a non-goal. That's your next concrete practice target: go build that. Also worth an afternoon: skim TanStack Query (React Query) — different API, same underlying problem (server-state caching), and seeing the same idea solved twice cements which parts are fundamental vs. RTK-Query-specific.

### Phase 5 — Forms at scale
You've hand-rolled `useState` per field three times now (login, signup, compose) — that's exactly the repetition that makes `react-hook-form` + a zod resolver click immediately once you meet it, instead of feeling like magic. Practice: refactor one existing form to `react-hook-form`, keep the same zod schema you already have, and feel what it removes.

### Phase 6 — Next.js App Router specifics
Server components vs. client components as a real boundary, not just a `'use client'` directive to slap on top. `middleware.ts` for edge-level route protection — the SSR-aware auth you explicitly scoped out this build. `loading.tsx`/`error.tsx` file conventions instead of hand-rolled loading booleans everywhere. Practice: once compose/feed feel solid, go implement the `middleware.ts` version of route protection as a deliberate follow-up feature, docs-first, same as everything else — and compare it against the `useRequireAuth` hook you already have.

### Phase 7 — Styling and UI systems
You've been writing Tailwind utility strings inline, which is fine at this scale and gets unreadable past it. Learn when to extract a component vs. when a `className` is fine as-is. Look at `shadcn/ui` once — not to adopt it necessarily, but to see the pattern of "own the component code, don't just import a black box."

### Phase 8 — Testing the frontend
Vitest + React Testing Library, and the one principle that matters more than the tool: test behavior a user could observe (click, type, see text), not implementation details (state variable names, internal function calls). Practice: write one test for the login form's "wrong password shows the generic error" case — you already manually verified this exact behavior earlier in this build, now automate the check so it can never silently regress.

### Phase 9 — Performance, and what "memory efficient" actually means here
`useMemo`/`useCallback` — learn them, then learn *not* to reach for them by default (premature memoization is a real anti-pattern, not just a nitpick). React DevTools Profiler to actually see re-renders instead of guessing. Bundle size awareness, dynamic imports for code-splitting. This phase is where your "memory efficient software" instinct from earlier gets its real vocabulary — bounded re-renders and bounded fetched data (which you already did correctly with pagination) are the two levers that matter most in a browser.

### Phase 10 — Production readiness
Error boundaries (what happens when a component throws — right now, probably a blank page). Loading skeletons vs. spinners as a UX decision, not just an implementation detail. Environment config across dev/staging/prod (you've only ever pointed at `localhost:4000`). Actually deploying this somewhere (Vercel is the path of least resistance for Next.js) and hitting the differences between your dev setup and a real deploy.

### Phase 11 — Advanced, eventual
React Server Components' actual data-fetching model (different from what you've built here). Streaming SSR. Real-time updates via WebSockets — the natural evolution of "feed doesn't auto-refresh," and a direct callback to the Kafka fanout work you already understand on the backend. Optimistic UI updates, which will make you reuse everything you already know about idempotency and outbox patterns, just moved to the client.

## The loop, made explicit

For every phase above: understand the concept in your own words before touching code, build the smallest version that could work, deliberately break it (change a key, remove a guard, drop an `await`), watch what actually happens, then fix it and write down why. You did this three separate times in the newsfeed build already, without being told to. That's the whole method — the roadmap is just a list of surfaces to point it at next.

## Feeding this back into future builds

Best way to burn through this list isn't a tutorial queue, it's more small systems, same docs-first discipline: a Kanban board (forces drag-and-drop state + optimistic updates), a URL shortener with a click-analytics dashboard (forces charts + real data-fetching patterns beyond a list), a chat app (forces WebSockets + the realtime phase directly). Each one deliberately exercises two or three phases you haven't hit yet, same way this newsfeed exercised auth, pagination, and SSR. Bring the next one here when you're ready, same process.
