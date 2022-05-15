import { ITestOptions } from '../interfaces';

async function finishTest({ loggerServer, server }: ITestOptions): Promise<void> {
  loggerServer.info('Shutting down server...');
  server.finishWebSocket();
}

module.exports = {
  name: 'Finish Server',
  run: finishTest,
  order: 999,
};
