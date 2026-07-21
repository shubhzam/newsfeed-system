// apps/api/src/lib/errors.ts
export class SelfFollowError extends Error {}
export class AlreadyFollowingError extends Error {}
export class NotFollowingError extends Error {}
export class UserNotFoundError extends Error {}
export class AuthorNotFoundError extends Error {}
export class PostNotFoundError extends Error {}
