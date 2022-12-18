import { IMessage } from '../interfaces';

export class WebSocketParser {
  private options: any;

  constructor(options?: any) {
    this.options = options;
  }

  public parse(message: string): IMessage|null {
    if (!message.startsWith(':')) return null;

    const split = message.split(' ');

    if (split.length > 1) {
      const parsedArg0: string[] = split[0].split('-');

      var from: string = split[0].substring(1);
      var type: string|undefined;

      if (parsedArg0.length >= 2) {
        from = split[0].split('-')[1];
        type = split[0].split('-')[0].substring(1);
      }

      const command: string = split[1];

      var args: string[] = [];

      var to: string|undefined;

      if (split[2].startsWith(':')) {
        // Args
        args = split.slice(2, split.length);
      } else {
        // To
        to = split[2];
        args = split.slice(3, split.length);
      }

      args[0] = args[0].substring(1);

      var secureKey: string|undefined;
      var targetKey: string|undefined;
      if (args[0]?.startsWith('key:')) {
        secureKey = args[0].split(':')[1];
        args.shift();
        if (args[0]?.startsWith('targetKey:')) {
          targetKey = args[0].split(':')[1];
          args.shift();
        } else {
          targetKey = secureKey;
        }
      }

      return { from, type, command, to, secureKey, targetKey, args };
    }

    return null;
  }

  public format(from: string, command: string, args: string[], to?: string, type?: string): IMessage {
    return { from, type, command, to, args };
  }

  public toString(message: IMessage): string {
    return `:${message.from}${message.type ? `-${message.type}` : ''} ${message.command} ${message.to ? message.to + ' ' : ''}:${message.args.join(' ')}`;
  }
}
