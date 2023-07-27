import { ITestOptions, ITestResponse } from '../interfaces';
import { Socket } from '../../main';

function runStatupServer({ loggerServer, index }: ITestOptions): Promise<ITestResponse> {
  return new Promise((resolve) => {
    const server = new Socket(3000, loggerServer);

    server.on('message', (message) => {
      loggerServer.info(server.getWSParser().toString(message));
    });

    return resolve({ server, testID: index });
  });
}

export const name = 'Startup Server';
export const run = runStatupServer;
export const order = 0;
