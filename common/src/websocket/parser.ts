import { IMessage } from '../interfaces';

export class WebSocketParser {
  private options: JSON;

  constructor(options) {
    this.options = options;
  }

  public parse(message: string): IMessage {
    if (!message.startsWith(':')) return null;

    const split = message.split(' ');

    if (split.length > 1) {
      const parsedArg0: string[] = split[0].split('-');

      var from: string = split[0];
      var type: string;

      if (parsedArg0.length >= 2) {
        from = split[0].split('-')[1];
        type = split[0].split('-')[0].substring(1);
      }

      const command: string = split[1];

      var args: string[] = [];

      var to: string;

      if (split[2].startsWith(':')) {
        // Args
        args = split.slice(2, split.length);
      } else {
        // To
        to = split[2];
        args = split.slice(3, split.length);
      }

      args[0] = args[0].substring(1);

      return { from: from, type: type, command: command, to: to, args: args };
    }

    return null;
  }

  public format(from: string, command: string, args: string[], to?: string, type?: string): IMessage {
    return { from: from, type: type, command: command, to: to, args: args };
  }

  public toString(message: IMessage): string {
    return `:${message.from}${message.type ? `-${message.type}` : ''} ${message.command} ${message.to} :${message.args.join(' ')}`;
  }
}
