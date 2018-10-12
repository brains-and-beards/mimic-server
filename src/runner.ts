#!/usr/bin/env node
import commander from 'commander';

import Server from './server';

commander
  .version('0.0.1', '-v, --version')
  .option('-c, --config <path>', 'Path to config file')
  .parse(process.argv);

const { config } = commander;

const server = new Server(config);
server.run();
