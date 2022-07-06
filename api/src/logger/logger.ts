import { ILoggerOptions, ELoggerLevel } from '../interfaces';
import chalk from 'chalk';

export class Logger {
  private defaultLevel: ELoggerLevel = ELoggerLevel.LOG;
  private debugActive = false;
  private prefix?: string;

  constructor({ prefix, debug, defaultLevel }: ILoggerOptions) {
    this.prefix = prefix ?? '';
    this.debugActive = debug ?? false;
    this.defaultLevel = defaultLevel ?? ELoggerLevel.INFO;
  }

  private getFormattedPrefix(): string {
    var prefix = '';
    prefix += chalk.hex('#5c5c5c')('[');
    prefix += chalk.gray(this.prefix);
    prefix += chalk.hex('#5c5c5c')(']');

    return this.prefix !== '' ? prefix : '';
  }

  private getTime(): string {
    const time = new Date(Date.now());
    const seconds = time.getSeconds() < 10 ? '0' + time.getSeconds() : time.getSeconds();
    const minutes = time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes();
    const hours = time.getHours() < 10 ? '0' + time.getHours() : time.getHours();
    return `[${hours}:${minutes}:${seconds}]`;
  }

  info(text: string | number | Error, ...args: any): void {
    var textConstructor = '';
    textConstructor += chalk.blueBright(this.getTime());
    textConstructor += this.getFormattedPrefix();
    textConstructor += ' Info: ';
    textConstructor += text;

    if ((!args && !(args instanceof Boolean)) || ((args instanceof Array) && args.length === 0)) {
      console.log(textConstructor);
    } else {
      console.log(textConstructor, args);
    }
  }

  warn(text: string | number | Error, ...args: any): void {
    var textConstructor = '';
    textConstructor += chalk.hex('#ff8a1c')(this.getTime());
    textConstructor += this.getFormattedPrefix();
    textConstructor += ` ${text.toString().toLowerCase().split(' ')[0].includes('warn') ? '' : 'Warn:'} `;
    textConstructor += text;

    if ((!args && !(args instanceof Boolean)) || ((args instanceof Array) && args.length === 0)) {
      console.warn(textConstructor);
    } else {
      console.warn(textConstructor, args);
    }
  }

  error(text: string | number | Error, ...args: any): void {
    var textConstructor = '';
    textConstructor += chalk.red(this.getTime());
    textConstructor += this.getFormattedPrefix();
    textConstructor += ` ${text.toString().toLowerCase().split(' ')[0].includes('error') ? '' : 'Error:'} `;
    textConstructor += text;

    if ((!args && !(args instanceof Boolean)) || ((args instanceof Array) && args.length === 0)) {
      console.error(textConstructor);
    } else {
      console.error(textConstructor, args);
    }
  }

  fatal(text: string | number | Error, ...args: any): void {
    var textConstructor = '';
    textConstructor += chalk.hex('#ff8a1c')(this.getTime());
    textConstructor += this.getFormattedPrefix();
    textConstructor += ` Fatal ${text.toString().toLowerCase().split(' ')[0].includes('error') ? '' : ':'} `;
    textConstructor += text;

    textConstructor = chalk.bgWhite(textConstructor);

    if ((!args && !(args instanceof Boolean)) || ((args instanceof Array) && args.length === 0)) {
      console.trace(textConstructor);
    } else {
      console.trace(textConstructor, args);
    }

    process.exit(5);
  }

  debug(text: string | number | Error, ...args: any): void {
    if (!this.debugActive) return;
    var textConstructor = '';
    textConstructor += chalk.hex('#ff8a1c')(this.getTime());
    textConstructor += this.getFormattedPrefix();
    textConstructor += ` ${text.toString().toLowerCase().split(' ')[0].includes('debug') ? '' : 'Debug:'} `;
    textConstructor += text;

    if (((!args && !(args instanceof Boolean)) || ((args instanceof Array) && args.length === 0)) || ((args instanceof Array) && args.length === 0)) {
      console.debug(textConstructor);
    } else {
      console.debug(textConstructor, args);
    }
  }

  log(message: string | number | Error, level?: ELoggerLevel, ...args: any): void {
    level = level ?? this.defaultLevel;
    switch (level) {
      case ELoggerLevel.DEBUG:
        this.debug(message, args);
        break;
      case ELoggerLevel.WARN:
      case ELoggerLevel.ALERT:
        this.warn(message, args);
        break;
      case ELoggerLevel.ERROR:
      case ELoggerLevel.SEVERE:
        this.error(message, args);
        break;
      case ELoggerLevel.FATAL:
        this.fatal(message, args);
        break;
      case ELoggerLevel.INFO:
      case ELoggerLevel.LOG:
      default:
        this.info(message, args);
        break;
    }
  }
}
