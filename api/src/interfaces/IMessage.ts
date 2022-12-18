export interface IMessage {
  from: string,
  type?: string,
  command: string,
  to?: string,
  secureKey?: string,
  targetKey?: string,
  args: string[]
}
