import { IMessage } from '../interfaces';

/**
 * WebSocket message parser.
 */
export class WebSocketParser {
  /**
   * Parse a WebSocket message string and extract its components.
   * @param message - The WebSocket message string to parse.
   * @returns The parsed message object or null if the message is invalid.
   * @deprecated This method is deprecated and will be removed in the future.
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

        return { from: { id: from, key: secureKey }, type, command, target: { id: to!, key: targetKey }, args, content: 'LEGACY_MESSAGE' };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Convert a WebSocket message object into a message string.
   * @param message - The message object to convert.
   * @returns {string} The WebSocket message string.
   * @deprecated This method is deprecated and will be removed in the future.
   */
  public toString(message: IMessage): string {
    return `:${message.from}${message.type ? `-${message.type}` : ''} ${message.command} ${message.target?.id ? message.target.id + ' ' : ''}:${message.args?.join(' ')}`;
  }

  /**
   * Create the message object by the given properties.
   *
   * @param from - The 'from' property of the message.
   * @param content - The 'content' property of the message.
   * @param type - The optional 'type' property of the message.
   * @param command - The optional 'command' property of the message.
   * @param target - The optional 'target' property of the message.
   * @param args - The optional 'args' property of the message.
   * @returns {IMessage} Message object.
   */
  public static format(from: { id: string, key?: string }, content: any, { type, command, target, args }: { type?: string, command?: string, target?: { id: string, key?: string }, args?: string[] }): IMessage {
    const finalJSON: IMessage = {
      from,
      content,
    };

    if (command) Object.assign(finalJSON, { command });
    if (target) Object.assign(finalJSON, { target });
    if (args) Object.assign(finalJSON, { args });
    if (type) Object.assign(finalJSON, { type });

    return finalJSON;
  }

  /**
   * Format and convert a WebSocket message object into a message string.
   *
   * @param from - The 'from' property of the message.
   * @param content - The 'content' property of the message.
   * @param type - The optional 'type' property of the message.
   * @param command - The optional 'command' property of the message.
   * @param target - The optional 'target' property of the message.
   * @param args - The optional 'args' property of the message.
   * @returns The WebSocket message string.
   */
  public static formatToString(from: { id: string, key?: string }, content: any, { type, command, target, args }: { type?: string, command?: string, target?: { id: string, key?: string }, args?: string[] }): string {
    return JSON.stringify(this.format(from, content, { type, command, target, args }));
  }
}
