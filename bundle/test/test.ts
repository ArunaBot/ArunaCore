import { Logger } from '@promisepending/logger.js';
import { Socket } from '@arunabot/core-websocket';
import { ITestResponse } from './interfaces';
import { ArunaClient } from 'arunacore-api';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

console.log('Initializing Aruna Core');

const logger = new Logger({ debug: true, prefix: 'TESTER' });

logger.info('Logger Initialized');

const loggerClient = new Logger({ debug: true, prefix: 'CLIENT' });

loggerClient.info('Logger Initialized');

const loggerServer = new Logger({ debug: true, prefix: 'SERVER' });

loggerServer.info('Logger Initialized');

var testFailed = false;

var actualCheck = 0;

var checks = 0;

const scriptDir = path.resolve(__dirname, 'scripts');

const tests: any[] = [];

async function runTests(): Promise<void> {
  var server: Socket|null = null;

  var client: ArunaClient|null = null; // = new WebSocketClient('localhost', 3000, 'client', loggerClient);
  var client2: ArunaClient|null = null; // = new WebSocketClient('localhost', 3000, 'client2', loggerClient);
  var client3: ArunaClient|null = null; // = new WebSocketClient('localhost', 3000, 'client3', loggerClient);

  for (var i = 0; i <= checks - 1; i++) {
    actualCheck = i + 1;
    logger.info(`Starting test: "${chalk.blueBright(tests[i].name)}" [${actualCheck}/${checks}]`);

    // eslint-disable-next-line no-await-in-loop
    await tests[i].run({ loggerClient, loggerServer, client, client2, client3, server, index: i }).catch((e: any) => {
      logger.warn(`Error on test: "${chalk.yellow(tests[i].name)}". Error: ${e}`);
      testFailed = true;
    }).then((result?: ITestResponse) => {
      if (result) {
        if (result.server) server = result.server;
        if (result.client) client = result.client;
        if (result.client2) client2 = result.client2;
        if (result.client3) client3 = result.client3;
      }
    });
  }
}

async function run(): Promise<void> {
  logger.info('Starting tests...');

  const files = fs.readdirSync(scriptDir);

  const jsfiles = files.filter(f => f.split('.').pop() === 'js');

  if (jsfiles.length <= 0) {
    return logger.fatal('No Tests found!');
  }

  jsfiles.forEach(file => {
    const eventFunction = require(`${scriptDir}/${file}`);
    logger.info(`=> ${chalk.blueBright(eventFunction.name)}`);
    tests.push(eventFunction);
  });

  tests.sort((a, b) => a.order - b.order);
  checks = tests.length;
  await runTests();
  if (testFailed) {
    logger.error('One or more tests failed. Please check what happened.');
    return process.exit(1);
  }
  logger.info('Tests successfully completed!');
}

run();
