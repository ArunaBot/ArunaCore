import { ILoggerOptions } from '@promisepending/logger.js';

export interface ILoggerConfiguration {
  logger?: ILoggerOptions;
}

export interface IConfiguration extends ILoggerConfiguration {
  fileVersion: number;
  id?: string;
  debug?: boolean;
  port?: number;
  host?: string;
  autoLogEnd?: boolean;
  masterKey?: string;
  requireAuth?: boolean;
}
