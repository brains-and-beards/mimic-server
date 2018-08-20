#!/usr/bin/env node
import commander from 'commander';

import Server from './server';

commander
  .option('-c, --config <path>', 'Path to config file')
  .option('-w, --wait', 'Wait for ZeroMQ message before starting the server')
  .parse(process.argv);

const { config } = commander;

const server = new Server(config);
server.run(commander.wait);
