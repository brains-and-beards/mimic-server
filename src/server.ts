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

  readFile = (configPath: string) => {
    fs.readFile(configPath, { encoding: 'utf-8' }, (error, data) => {
      if (!error) {
        const json = JSON.parse(data);
        const config = this.parseConfig(json);
      } else {
        console.error(error);
      }
    });
  };

  watchConfigForChanges = (configPath: string) => {
    fs.watchFile(configPath, () => {
      console.log(configPath + ' changed');
      const json = this.readFile(configPath);
      const config = this.parseConfig(json);
    });
  };

  parseConfig = (configData: any): IConfig => {
    const normalizedData = normalize(configData, ConfigSchema);
    return {} as IConfig;
  };

  run = () => {
    console.log('Starting run');
    let { configData } = commander;
    if (!configData) {
      configData = './apimocker.json';
    }
    console.log('Reading config file from: ' + configData);
    this.readFile(configData);
    this.watchConfigForChanges(configData);

    const config: IConfig = configData;
    const app = new App(configData);
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
