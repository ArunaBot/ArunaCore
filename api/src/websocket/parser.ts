import { IMessage } from '../interfaces';

export class WebSocketParser {
  /**
   * Parse a WebSocket message string and extract its components.
   * @param message - The WebSocket message string to parse.
   * @returns The parsed message object or null if the message is invalid.
   */
  public parse(message: string): IMessage|null {
    try {
      if (!message.startsWith(':')) return null;

      const split = message.split(' ');

      if (split.length > 1) {
        const parsedArg0: string[] = split[0].split('-');

        var from: string = split[0].substring(1);
        var type: string|undefined;

        if (parsedArg0.length >= 2) {
          [from, type] = parsedArg0;
          from = from.substring(1);
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
    } catch (err) {
      return null;
    }
  }

  /**
   * Create the message object by the given properties.
   * @param from - The 'from' property of the message.
   * @param command - The 'command' property of the message.
   * @param args - The 'args' property of the message.
   * @param to - The optional 'to' property of the message.
   * @param type - The optional 'type' property of the message.
   * @returns Message object.
   */
  public format(from: string, command: string, args: string[], to?: string, type?: string): IMessage {
    return { from, type, command, to, args };
  }

  /**
   * Convert a WebSocket message object into a message string.
   * @param message - The message object to convert.
   * @returns The WebSocket message string.
   */
  public toString(message: IMessage): string {
    return `:${message.from}${message.type ? `-${message.type}` : ''} ${message.command} ${message.to ? message.to + ' ' : ''}:${message.args.join(' ')}`;
  }

  /**
   * Format and convert a WebSocket message object into a message string.
   * @param from - The 'from' property of the message.
   * @param command - The 'command' property of the message.
   * @param args - The 'args' property of the message.
   * @param to - The optional 'to' property of the message.
   * @param type - The optional 'type' property of the message.
   * @returns The WebSocket message string.
   * @see WebSocketParser.format
   * @see WebSocketParser.toString
   */
  public formatToString(from: string, command: string, args: string[], to?: string, type?: string): string {
    return this.toString(this.format(from, command, args, to, type));
  }
}
