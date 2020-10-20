#!/usr/bin/env node
import commander from 'commander';

import pkg from '../package.json';
import Server from './server';

commander
  .version(pkg.version, '-v, --version')
  .option('-c, --config <path>', 'Path to config file')
  .parse(process.argv);

const { config } = commander;

// eslint-disable-line no-console
const server = new Server(config, (error) => console.error(error), true);
server.run();
