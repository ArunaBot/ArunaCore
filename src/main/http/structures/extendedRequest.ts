import { IncomingMessage } from 'http';

export class ExtendedRequest extends IncomingMessage {
  public params: { [key: string]: string } = {};
  public body: { [key: string]: unknown } = {};
}
