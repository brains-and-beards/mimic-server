#!/usr/bin/env node
/* tslint:disable:no-console */
import commander from 'commander';
import fs from 'fs';
import { normalize } from 'normalizr';
import App from './app';
import { ConfigSchema } from './Models/DataSchema';

commander.option('-c, --config <path>', 'Path to config file').parse(process.argv);

class Server {
  port = process.env.PORT || 3000;
  configFilePath: string;

  constructor() {
    const { config } = commander;
    if (!config) {
      this.configFilePath = './apimocker.json';
    } else {
      this.configFilePath = config;
    }
    console.log('Reading config file from: ' + this.configFilePath);
  }

  readFile = (configPath: string) => {
    fs.readFile(configPath, { encoding: 'utf-8' }, (error, data) => {
      if (!error) {
        const json = JSON.parse(data);
        this.readAndStart(json);
      } else {
        console.error(error);
      }
    });
  };

  watchConfigForChanges = (configPath: string) => {
    fs.watchFile(configPath, () => {
      console.log('-----------------------------------------');
      console.log(configPath + ' changed');
      const json = this.readFile(configPath);
      this.readAndStart(json);
    });
  };

  parseConfig = (configData: any): IConfig => {
    const normalizedData = normalize(configData, ConfigSchema);
    return {} as IConfig;
  };

  readAndStart = (json: object) => {
    const config = this.parseConfig(json);
    this.startServer(config);
  };

  run = () => {
    console.log('Starting run');
    this.readFile(this.configFilePath);
    this.watchConfigForChanges(this.configFilePath);
  };

  startServer = (config: IConfig) => {
    // const config: IConfig = this.configFilePath as any; // TODO: add the real code here
    const app = new App(config);
    app.express.listen(this.port, (err: any) => {
      if (err) {
        return console.error(err);
      }

      return console.log(`server is listening on ${this.port}`);
    });
  };
}

const server = new Server();
server.run();
