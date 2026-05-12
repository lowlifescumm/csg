/**
 * Unified logger that respects LOG_LEVEL.
 * Levels: trace < debug < info < warn < error < silent
 *
 * Use this instead of console.* throughout the codebase.
 */

const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  silent: 5,
};

const DEFAULT_LEVEL = 'info';

function getCurrentLevel() {
  const envLevel = process?.env?.LOG_LEVEL || DEFAULT_LEVEL;
  return LOG_LEVELS[envLevel.toLowerCase()] ?? LOG_LEVELS[DEFAULT_LEVEL];
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= getCurrentLevel();
}

function formatMessage(level, args) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (typeof args[0] === 'string') {
    return [`${prefix} ${args[0]}`, ...args.slice(1)];
  }
  return [prefix, ...args];
}

const logger = {
  trace(...args) {
    if (shouldLog('trace')) console.trace(...formatMessage('trace', args));
  },
  debug(...args) {
    if (shouldLog('debug')) console.log(...formatMessage('debug', args));
  },
  info(...args) {
    if (shouldLog('info')) console.log(...formatMessage('info', args));
  },
  warn(...args) {
    if (shouldLog('warn')) console.warn(...formatMessage('warn', args));
  },
  error(...args) {
    if (shouldLog('error')) console.error(...formatMessage('error', args));
  },
};

module.exports = logger;
