export interface LoggerOption {
  debug?: Boolean,
  prefix?: String,
  defaultLevel?: LoggerLevel
}

export enum LoggerLevel {
  INFO = 0,
  LOG = 0,
  WARN = 1,
  ALERT = 1,
  ERROR = 2,
  SEVERE = 2,
  FATAL = 3,
  DEBUG = 4
}