interface IMessage {
  from: string,
  command: number,
  type: string,
  args: string
}

export default IMessage;
