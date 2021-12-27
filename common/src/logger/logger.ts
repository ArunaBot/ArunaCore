/* eslint-disable @typescript-eslint/no-unused-vars */
import chalk from 'chalk';
import { LoggerOption, LoggerLevel } from '../interfaces';
const convert = require('color-convert');

function getTimeRaw(): string {
  return `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;
}

function getTime(): string {
  const time: string = getTimeRaw();
  const separatedTime: string[] = time.split(':');
  separatedTime.forEach((element, index) => {
    if (element.length < 2) {
      separatedTime[index] = `0${separatedTime[index]}`;
    }
  });
  return separatedTime.join(':');
}

export class Logger {
  private debugActive = false;
  private prefix: string = null;

  constructor(options: LoggerOption) {
    this.debugActive = options.debug ? options.debug : false;
    this.prefix = options.prefix ? options.prefix : null;
  }

  fatal(message: string, args?: string[]): void {
    // eslint-disable-next-line max-len
    console.trace(chalk.bgWhite(chalk.red(message.toString().split(' ')[0].toLowerCase().includes('error') ? `[${getTime()}] Fatal ${message}` : `[${getTime()}] Fatal: ${message}`)));
    process.exit(5);
  }

  error(message: string, args?: string[]): void {
    // eslint-disable-next-line max-len
    console.error(chalk.red(message.toString().split(' ')[0].toLowerCase().includes('error') ? `[${getTime()}] ${message}` : `[${getTime()}] Error: ${message}`));
  }

  warn(message: string, args?: string[]): void {
    console.warn(convert.keyword('orange')(`[${getTime()}] Warn: ${message}`));
  }

  info(message: string, args?: string[]): void {
    console.info(chalk.blueBright(`[${getTime()}] `) + `Info: ${message}`);
  }

  debug(message: string, args?: string[]): void {
    if (this.debugActive) {
      console.debug(chalk.gray(`[${getTime()}] Debug: `) + chalk.hex('#AAA')(message));
    }
  }

  log(message: string, level?: LoggerLevel, args?: string[]): void {
    switch (level) {
      case LoggerLevel.DEBUG:
        this.debug(message, args);
        break;
      case LoggerLevel.WARN:
      case LoggerLevel.ALERT:
        this.warn(message, args);
        break;
      case LoggerLevel.ERROR:
      case LoggerLevel.SEVERE:
        this.error(message, args);
        break;
      case LoggerLevel.FATAL:
        this.fatal(message, args);
        break;
      case LoggerLevel.INFO:
      case LoggerLevel.LOG:
      default:
        this.info(message, args);
        break;
    }
  }
}
