import chalk from 'chalk';
import { LoggerOption, LoggerLevel } from '../interfaces';
const convert = require('color-convert');

export class Logger {
  private debugActive: Boolean = false;
  private prefix: String = null;

  constructor(options: LoggerOption) {
    this.debugActive = options.debug ? options.debug : false;
    this.prefix = options.prefix ? options.prefix : null;
  }

  fatal(message: String, args?: String[]): void {
    // eslint-disable-next-line max-len
    console.trace(chalk.bgWhite(chalk.red(message.toString().split(' ')[0].toLowerCase().includes('error') ? `[${getTime()}] Fatal ${message}` : `[${getTime()}] Fatal: ${message}`)));
    process.exit(5);
  }

  error(message: String, args?: String[]): void {
    // eslint-disable-next-line max-len
    console.error(chalk.red(message.toString().split(' ')[0].toLowerCase().includes('error') ? `[${getTime()}] ${message}` : `[${getTime()}] Error: ${message}`));
  }

  warn(message: String, args?: String[]): void {
    console.warn(convert.keyword('orange')(`[${getTime()}] Warn: ${message}`));
  }

  info(message: String, args?: String[]): void {
    console.info(chalk.blueBright(`[${getTime()}] `) + `Info: ${message}`);
  }

  debug(message: String, args?: String[]): void {
    if (this.debugActive) {
      console.debug(chalk.gray(`[${getTime()}] Debug: `) + chalk.hex('#AAA')(message));
    }
  }

  log(message: String, level?: LoggerLevel, args?: String[]): void {
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
        this.fatal;
        break;
      case LoggerLevel.INFO:
      case LoggerLevel.LOG:
      default:
        this.info(message, args);
        break;
    }
  }
}

function getTime(): String {
  const time: String = getTimeRaw();
  const separatedTime: String[] = time.split(':');
  separatedTime.forEach((element, index) => {
    if (element.length < 2) {
      separatedTime[index] = `0${separatedTime[index]}`;
    }
  });
  return separatedTime.join(':');
}

function getTimeRaw(): String {
  return `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;
}
