import { ILoggerOptions } from '@promisepending/logger.js';

export interface ILoggerConfiguration {
  logger?: ILoggerOptions;
}

export interface IConfiguration extends ILoggerConfiguration {
  readonly fileVersion: number;
  id?: string;
  debug?: boolean;
  port?: number;
  host?: string;
  autoLogEnd?: boolean;
  masterKey?: string;
  requireAuth?: boolean;
}

export class Configuration implements IConfiguration {
  fileVersion: number;
  id?: string | undefined;
  debug?: boolean | undefined;
  port?: number | undefined;
  host?: string | undefined;
  autoLogEnd?: boolean | undefined;
  masterKey?: string | undefined;
  requireAuth?: boolean | undefined;
  logger?: ILoggerOptions | undefined;
}
