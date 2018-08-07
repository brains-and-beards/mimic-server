#!/usr/bin/env node
/* tslint:disable:no-console */
import commander from 'commander';
import fs from 'fs';
import { normalize } from 'normalizr';
import { promisify } from 'util';
import App from './app';
import { ConfigSchema } from './Models/DataSchema';

commander.option('-c, --config <path>', 'Path to config file').parse(process.argv);

class Server {
  readFileAsync = promisify(fs.readFile);
  configFilePath: string;
  app?: App;

  constructor() {
    const { config } = commander;
    if (!config) {
      this.configFilePath = './apimocker.json';
    } else {
      this.configFilePath = config;
    }
    console.log('Reading config file from: ' + this.configFilePath);
  }

  async readFile(configPath: string) {
    const data = await this.readFileAsync(configPath, { encoding: 'utf-8' });
    return JSON.parse(data);
  }

  watchConfigForChanges = (configPath: string) => {
    fs.watchFile(configPath, () => {
      console.log('-----------------------------------------');
      console.log(configPath + ' changed');
      this.readAndStart();
    });
  };

  parseConfig = (configData: any): IConfig => {
    const normalizedData = normalize(configData, ConfigSchema);
    return {} as IConfig;
  };

  readAndStart = () => {
    this.readFile(this.configFilePath)
      .then(json => {
        const config = this.parseConfig(json);
        this.startServer(config);
      })
      .catch(error => {
        console.error(error);
      });
  };

  run = () => {
    console.log('Starting run');
    this.watchConfigForChanges(this.configFilePath);
    this.readAndStart();
  };

  startServer = (config: IConfig) => {
    if (this.app && this.app.isListening()) {
      this.app.stop();
    }

    this.app = new App(config);
    this.app.start();
  };
}

const server = new Server();
server.run();
