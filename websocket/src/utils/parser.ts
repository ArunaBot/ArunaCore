import IMessage from '../interfaces/imessage';

class Parser {
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
      var type = 'websocket';

      if (parsedArg0.length >= 2) {
        from = split[0].split('-')[1];
        type = split[0].split('-')[0].substring(1);
      }

      const command: number = Number.parseInt(split[1]);

      var args: string[] = [];

      if (split[2].startsWith(':')) {
        // Args
        args = split.slice(2, split.length);
      } else {
        // To
        args = split.slice(3, split.length);
      }

      args[0] = args[0].substring(1);

      return { from: from, command: command, type: type, args: args.join(' ') };
    }

    return null;
  }
}

export default Parser;
