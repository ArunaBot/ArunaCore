import { IMessage } from '../interfaces';

export function format(content: any, { type, command, target, args }: { type?: string, command?: string, target?: { id: string, key?: string }, args?: string[] }): string {
  const finalJSON: IMessage = {
    from: { id: 'arunacore' },
    content,
  };

  if (command) Object.assign(finalJSON, { command });
  if (target) Object.assign(finalJSON, { target });
  if (args) Object.assign(finalJSON, { args });
  if (type) Object.assign(finalJSON, { type });

  return JSON.stringify(finalJSON);
}
