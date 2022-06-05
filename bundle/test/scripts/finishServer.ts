import { ITestOptions } from '../interfaces';

async function finishServer({ loggerServer, server }: ITestOptions): Promise<void> {
  return new Promise((resolve) => {
    loggerServer.info('Shutting down server...');
    server.finishWebSocket();
    loggerServer.info('Server Finished');
    return resolve();
  });
}

module.exports = {
  name: 'Finish Server',
  run: finishServer,
  order: 999,
};
