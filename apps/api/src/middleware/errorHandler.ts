// apps/api/src/middleware/errorHandler.ts
import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(`unhandled error on ${req.method} ${req.path}: ${(err as Error).message}`);
  res.status(500).json({ error: 'InternalError' });
};