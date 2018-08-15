/* tslint:disable:no-console */
import fs from 'fs';
import { normalize } from 'normalizr';
import { promisify } from 'util';

import App from './app';
import { ConfigSchema } from './Models/DataSchema';

class Server {
  readFileAsync = promisify(fs.readFile);
  configFilePath: string;
  app?: App;

  constructor(filename: string) {
    if (!filename) {
      this.configFilePath = './apimocker.json';
    } else {
      this.configFilePath = filename;
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
    return normalizedData as IConfig;
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
      this.app.stop(error => {
        if (error) {
          console.error(error);
        } else {
          console.log('close');
          this._startServer(config);
        }
      });
    } else {
      this._startServer(config);
    }
  };

  private _startServer = (config: IConfig) => {
    this.app = new App(config);
    this.app.start(error => {
      if (error) {
        return console.error(error);
      }

      return console.log(`server is listening`);
    });
  };
}

export default Server;
