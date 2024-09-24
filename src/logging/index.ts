import { apiLogger, cacheLogger, logger, stderrLogger, timeLogger } from "./logging";

export { printer, printerIO } from "./printerIO";

export {
  apiLogger,
  authLogger,
  cacheLogger,
  httpfilelogger,
  initLogging,
  logger,
  stderrLogger,
  timeLogger,
} from "./logging";

export const defaultLoggers = [
  logger,
  cacheLogger,
  stderrLogger,
  apiLogger,
  timeLogger,
];

export * from "./debug-time";
export * from "./log-time";
export { loggerIO } from "./loggerIO";
