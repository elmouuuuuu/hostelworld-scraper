import config from '@/config/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[config.logging.level];
}

function format(scope: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `${timestamp} [${scope}] ${message}`;
}

export function createLogger(scope: string) {
  return {
    debug(message: string): void {
      if (shouldLog('debug')) console.debug(format(scope, message));
    },
    info(message: string): void {
      if (shouldLog('info')) console.info(format(scope, message));
    },
    warn(message: string): void {
      if (shouldLog('warn')) console.warn(format(scope, message));
    },
    error(message: string, err?: unknown): void {
      if (shouldLog('error')) {
        console.error(format(scope, message));
        if (err instanceof Error) {
          console.error(err.stack ?? err.message);
        } else if (err !== undefined) {
          console.error(err);
        }
      }
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
