export interface IMessage {
  from: {
    id: string,
    key?: string
  },
  type?: string,
  target?: {
    id: string,
    key?: string
  },
  uuid?: string,
  command?: string,
  args?: string[],
  content: unknown
}
