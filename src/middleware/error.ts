import { Request, Response, NextFunction } from "express";
import { log } from "../utils/logger";
import { ZodError } from "zod";
import { ValidationError } from "express-validator";

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public errors?: any[],
  ) {
    super(message);
    this.name = "APIError";
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log the error
  log.error("Error occurred:", err);

  // Handle different types of errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: true,
      message: err.message,
      code: err.code,
      errors: err.errors,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: true,
      message: "Validation error",
      errors: err.errors,
    });
  }

  if (Array.isArray(err) && err[0] instanceof ValidationError) {
    return res.status(400).json({
      error: true,
      message: "Validation error",
      errors: err.map((e) => ({
        field: e.param,
        message: e.msg,
      })),
    });
  }

  // Handle unknown errors
  const statusCode = err instanceof Error ? 500 : 400;
  const message = err instanceof Error ? err.message : "An error occurred";

  return res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: true,
    message: `Cannot ${req.method} ${req.url}`,
  });
};

// Rate limit handler
export const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    error: true,
    message: "Too many requests, please try again later.",
  });
};

// Validation error handler
export const validationErrorHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: "Validation error",
      errors: errors.array(),
    });
  }
  next();
};

// Import validation result after its usage to avoid circular dependency
import { validationResult } from "express-validator";
