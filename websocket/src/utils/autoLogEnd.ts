import { Logger } from '@promisepending/logger.js';
import { Socket } from '../';

var exited = false;

var wsSocket: Socket;

const logger: Logger = new Logger({ prefix: 'CORE' });
function exitHandler(options: any, exitCode: string | number): void {
  if (!exited) {
    process.stdin.resume();
    exited = true;
    logger.info('Exiting...');

    if (wsSocket) {
      try {
        wsSocket.finishWebSocket();
      } catch (e) {
        logger.error('An error occurred while closing the socket!', e);
      }
    }

    if (typeof exitCode !== 'string') {
      if ((exitCode || exitCode === 0) && !options.uncaughtException) logger.info('Program finished, code: ' + exitCode);
      if ((exitCode || exitCode === 0) && options.uncaughtException) logger.fatal(exitCode);
    }
    process.exit(typeof exitCode === 'string' ? 0 : exitCode);
  }
}

export function activate(socket: Socket, uncaughtException?: boolean): void {
  wsSocket = socket;
  process.on('exit', exitHandler.bind(null, {}));
  process.on('SIGINT', exitHandler.bind(null, {}));
  process.on('SIGUSR1', exitHandler.bind(null, {}));
  process.on('SIGUSR2', exitHandler.bind(null, {}));
  process.on('SIGTERM', exitHandler.bind(null, {}));
  process.on('uncaughtException', exitHandler.bind(null, { uncaughtException: uncaughtException ?? false }));
}

export function deactivate(): void {
  process.removeListener('exit', exitHandler);
  process.removeListener('SIGINT', exitHandler);
  process.removeListener('SIGUSR1', exitHandler);
  process.removeListener('SIGUSR2', exitHandler);
  process.removeListener('SIGTERM', exitHandler);
  process.removeListener('uncaughtException', exitHandler);
}
