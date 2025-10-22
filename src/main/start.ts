import { ConfigurationLoader } from './configuration';
import { Logger } from '@promisepending/logger.js';
import { existsSync, readFileSync } from 'fs';
import { Socket } from './websocket';

function isRunningInDocker(): boolean {
  try {
    if (existsSync('/.dockerenv')) {
      return true;
    }

    const cgroup = readFileSync('/proc/1/cgroup', 'utf8');
    if (cgroup.includes('docker') || cgroup.includes('kubepods') || cgroup.includes('containerd')) {
      return true;
    }
  } catch {}

  return false;
}

console.log('Initializing ArunaCore...');
console.log('Loading configuration...');

const runningInDocker = isRunningInDocker();
const configurationLoader = new ConfigurationLoader();
const configs = configurationLoader.loadConfiguration();

const debug = (process.env.NODE_ENV === 'production') || (configs.debug ?? false);
const prefix = process.env.ARUNACORE_PREFIX ?? configs.id ?? 'arunacore';
const requireAuth = configs.requireAuth ?? false;
const autoLogEnd = configs.autoLogEnd ?? true;

let port = parseInt(process.env.ARUNACORE_PORT ?? configs.port?.toString() ?? '3000');
port = runningInDocker ? 3000 : (isNaN(port) ? configs.port ?? 3000 : port);

const logger = new Logger({ ...(configs.logger ?? { allLineColored: true, coloredBackground: false }), debug, prefix, disableFatalCrash: true });

logger.info('Logger Initialized!');
logger.debug(`Running inside Docker: ${runningInDocker}`);

let masterKey: (string | null) = configs.masterkey ?? 'changeme';

if (masterKey === 'changeme') {
  logger.error('Master key is not set or is equal to "changeme", please set it in the environment variable ARUNACORE_MASTERKEY or in the configuration file!');
  masterKey = null;
  logger.warn('Running without master key, this will disable some features!');
}

logger.info('Configurations loaded!');

const webs = new Socket(port, logger, { autoLogEnd, requireAuth, masterKey });

logger.info('ArunaCore started!');

webs.once('ready', () => {
  logger.info('ArunaCore is ready!');
});

webs.on('message', (message) => {
  logger.info('Message received:', message);
});

if (process.env.ARUNACORE_FINISH_IN_SECONDS) {
  const seconds = parseInt(process.env.ARUNACORE_FINISH_IN_SECONDS);
  logger.warn(`Finishing in ${seconds} seconds...`);
  setTimeout(() => {
    webs.finishWebSocket();
  }, seconds * 1000);
}
