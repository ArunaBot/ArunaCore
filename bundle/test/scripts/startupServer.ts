import { ITestOptions, ITestResponse } from '../interfaces';
import { Socket } from '@arunabot/core-websocket';

function runStatupServer({ loggerServer, index }: ITestOptions): Promise<ITestResponse> {
  return new Promise((resolve) => {
    const server = new Socket(3000, loggerServer);

    server.on('message', (message) => {
      loggerServer.info(server.getWSParser().toString(message));
    });

    return resolve({ server, testID: index });
  });
}

module.exports = {
  name: 'Startup Server',
  run: runStatupServer,
  order: 0,
};
