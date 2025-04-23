import winston from "winston";
import { Logtail } from "@logtail/node";
import * as Sentry from "@sentry/node";

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
  });
}

// Initialize Logtail if API key is provided
const logtail = process.env.LOGTAIL_API_KEY
  ? new Logtail(process.env.LOGTAIL_API_KEY)
  : null;

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: "babystepsmatrix" },
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

// Create wrapper function for logging
export const log = {
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
    logtail?.info(message, meta);
  },
  error: (message: string, error?: Error, meta?: any) => {
    logger.error(message, { error, ...meta });
    logtail?.error(message, { error, ...meta });
    if (error) {
      Sentry.captureException(error, {
        extra: { message, ...meta },
      });
    }
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
    logtail?.warn(message, meta);
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
    logtail?.debug(message, meta);
  },
};

// Error tracking
export const trackError = (error: Error, context?: any) => {
  log.error(error.message, error, context);
  return {
    error: true,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };
};

export default log;
