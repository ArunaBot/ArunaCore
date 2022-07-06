export interface IMessage {
  from: string,
  type?: string,
  command: string,
  to?: string,
  args: string[]
}
