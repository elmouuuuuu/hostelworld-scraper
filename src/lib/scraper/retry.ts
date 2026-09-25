import config from '@/config/config';
import { createLogger } from '@/lib/utils/logger';
import { ScrapeCancelledError } from './scrapeCancelledError';

const logger = createLogger('scraper:retry');

/** Resolves after `ms`, or immediately (rejecting) if `signal` aborts first — avoids waiting out a full backoff delay after the client has already cancelled. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ScrapeCancelledError());
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new ScrapeCancelledError());
      },
      { once: true }
    );
  });
}

/**
 * Runs `fn`, retrying on failure per config.scraper.retryCount /
 * retryBackoffMs (default: 2 retries, 1s then 3s backoff — 3 total
 * attempts). Throws the last error if every attempt fails.
 *
 * A ScrapeCancelledError (deliberate user cancellation) is never
 * retried — it's rethrown immediately regardless of how many attempts
 * remain, since retrying something the user asked to stop would be
 * exactly backwards.
 *
 * `label` is used purely for logging, so failures are traceable to a
 * specific step (e.g. "Barcelona page 2" vs just "scrape failed").
 */
export async function withRetry<T>(label: string, fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) throw new ScrapeCancelledError();

  const backoffs = config.scraper.retryBackoffMs;
  const totalAttempts = 1 + config.scraper.retryCount;

  let lastError: unknown;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ScrapeCancelledError) throw error;

      lastError = error;
      const isLastAttempt = attempt === totalAttempts;

      if (isLastAttempt) {
        logger.error(`${label}: failed after ${attempt} attempt(s).`, error);
        break;
      }

      const backoffMs = backoffs[attempt - 1] ?? backoffs[backoffs.length - 1];
      logger.warn(`${label}: attempt ${attempt} failed, retrying in ${backoffMs}ms...`);
      await delay(backoffMs, signal);
    }
  }

  throw lastError;
}
