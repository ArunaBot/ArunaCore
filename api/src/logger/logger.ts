/* eslint-disable @typescript-eslint/no-unused-vars */
import { LoggerOption, LoggerLevel } from '../interfaces';
import chalk from 'chalk';

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
  private prefix = '';

  constructor(options: LoggerOption) {
    this.debugActive = options.debug ? options.debug : false;
    this.prefix = options.prefix ? options.prefix : '';
  }

  private getPrefix(): string {
    return this.prefix === '' ? '' : `${chalk.gray(`[${this.prefix}]`)}`;
  }

  fatal(message: string|Error, args?: string[]|Error|Error[]): void {
    // eslint-disable-next-line max-len
    console.trace(chalk.bgWhite(this.getPrefix() + chalk.red(`[${getTime()}] Fatal${message.toString().split(' ')[0].toLowerCase().includes('error') ? '' : ':'} ${message}`)));
    process.exit(5);
  }

  error(message: string|Error, args?: string[]|Error|Error[]): void {
    // eslint-disable-next-line max-len
    console.error(this.getPrefix() + chalk.red(`[${getTime()}] ${message.toString().split(' ')[0].toLowerCase().includes('error') ? '' : 'Error:'} ${message}`));
  }

  warn(message: string|Error, args?: string[]|Error|Error[]): void {
    console.warn(this.getPrefix() + chalk.keyword('orange')(`[${getTime()}] Warn: ${message}`));
  }

  info(message: string|Error, args?: string[]|Error|Error[]): void {
    console.info(this.getPrefix() + chalk.blueBright(`[${getTime()}] `) + `Info: ${message}`);
  }

  debug(message: string|Error, args?: string[]|Error|Error[]): void {
    if (this.debugActive) {
      console.debug(this.getPrefix() + chalk.gray(`[${getTime()}] Debug: `) + chalk.hex('#AAA')(message));
    }
  }

  log(message: string|Error, level?: LoggerLevel, args?: string[]|Error|Error[]): void {
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
