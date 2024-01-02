import { ITestOptions } from '../interfaces';

async function finishServer({ loggerServer, server }: ITestOptions): Promise<void> {
  return new Promise((resolve) => {
    loggerServer.info('Shutting down server...');
    server.finishWebSocket();
    loggerServer.info('Server Finished');
    return resolve();
  });
}

export const name = 'Finish Server';
export const run = finishServer;
export const order = 999;
