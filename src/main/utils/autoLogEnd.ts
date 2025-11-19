import { Logger } from '@promisepending/logger.js';
import { Socket } from '../websocket';

let exited = false;
let wsSocket: Socket;
let isShuttingDown = false;

const logger: Logger = new Logger({ prefix: 'arunacore' });

const handlers = {
  exit: null as any,
  sigint: null as any,
  sigusr1: null as any,
  sigusr2: null as any,
  sigterm: null as any,
  uncaughtException: null as any,
};

async function exitHandler(options: any, exitCode: string | number): Promise<void> {
  if (exited || isShuttingDown) return;
  
  isShuttingDown = true;
  logger.info('Exiting...');

  if (wsSocket) {
    try {
      await wsSocket.finishWebSocket();
    } catch (e) {
      logger.error('An error occurred while closing the socket!', e);
    }
  }

  exited = true;

  if (typeof exitCode !== 'string') {
    if ((exitCode || exitCode === 0) && !options.uncaughtException) {
      logger.info('Program finished, code: ' + exitCode);
    }
    if ((exitCode || exitCode === 0) && options.uncaughtException) {
      logger.fatal(exitCode);
    }
  }

  let numericExitCode = 0;
  switch (exitCode) {
    case 'SIGINT':
    case 'SIGUSR1':
    case 'SIGUSR2':
    case 'SIGTERM':
      numericExitCode = 0;
      break;
    default:
      numericExitCode = typeof exitCode === 'string' ? 0 : exitCode;
      break;
  }
  
  // Give some time for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
  
  process.exit(numericExitCode);
}

export function activate(socket: Socket, uncaughtException?: boolean): void {
  if (handlers.exit) return;

  wsSocket = socket;
  
  // Wrap exitHandler to handle the async nature
  const wrapHandler = (options: any) => (exitCode: string | number): void => {
    exitHandler(options, exitCode).catch((err) => {
      logger.error('Error during exit handler:', err);
      process.exit(1);
    });
  };
  
  handlers.exit = wrapHandler({});
  handlers.sigint = wrapHandler({});
  handlers.sigusr1 = wrapHandler({});
  handlers.sigusr2 = wrapHandler({});
  handlers.sigterm = wrapHandler({});
  handlers.uncaughtException = wrapHandler({ uncaughtException: uncaughtException ?? false });
  
  process.on('exit', handlers.exit);
  process.on('SIGINT', handlers.sigint);
  process.on('SIGUSR1', handlers.sigusr1);
  process.on('SIGUSR2', handlers.sigusr2);
  process.on('SIGTERM', handlers.sigterm);
  process.on('uncaughtException', handlers.uncaughtException);
}

export function deactivate(): void {
  if (!handlers.exit) {
    return;
  }

  process.removeListener('exit', handlers.exit);
  process.removeListener('SIGINT', handlers.sigint);
  process.removeListener('SIGUSR1', handlers.sigusr1);
  process.removeListener('SIGUSR2', handlers.sigusr2);
  process.removeListener('SIGTERM', handlers.sigterm);
  process.removeListener('uncaughtException', handlers.uncaughtException);
  
  // Clear handlers
  handlers.exit = null;
  handlers.sigint = null;
  handlers.sigusr1 = null;
  handlers.sigusr2 = null;
  handlers.sigterm = null;
  handlers.uncaughtException = null;
}
