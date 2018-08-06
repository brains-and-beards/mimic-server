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
    console.log('Reading: ' + configPath);
    fs.readFile(configPath, { encoding: 'utf-8' }, (error, data) => {
      if (!error) {
        console.log('Received: ' + data);
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
    console.log('-------------------------------');
    console.log(normalizedData);
    return {} as IConfig;
  };

  run = () => {
    console.log('Starting run');
    let { configData } = commander;
    if (configData) {
      console.log('Reading config file from: ' + configData);
    } else {
      configData = './apimocker.json';
    }
    console.log(configData);
    this.readFile(configData);
    this.watchConfigForChanges(configData);

    const config: IConfig = configData;
    const app = new App(configData);
    app.express.listen(this.port, (err: any) => {
      if (err) {
        return console.log(err);
      }

      return console.log(`server is listening on ${this.port}`);
    });
  };
}

const server = new Server();
server.run();
