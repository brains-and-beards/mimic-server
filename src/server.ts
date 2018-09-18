/* tslint:disable:no-console */
import fs from 'fs';
import { normalize } from 'normalizr';
import { promisify } from 'util';

import App from './app';
import { ConfigSchema } from './Models/DataSchema';
import { ErrorHandler } from './errors/error-handler';

class Server {
  readFileAsync = promisify(fs.readFile);
  configFilePath: string;
  app: App;

  constructor(filename: string) {
    this.app = new App();
    if (!filename) {
      this.configFilePath = './apimocker.json';
    } else {
      this.configFilePath = filename;
    }
    console.log('Reading config file from: ' + this.configFilePath);
  }

  run = () => {
    console.log('Starting run');
    this.watchConfigForChanges(this.configFilePath);
    this.readAndStart();
  };

  private async readFile(configPath: string) {
    const data = await this.readFileAsync(configPath, { encoding: 'utf-8' });
    return JSON.parse(data);
  }

  private watchConfigForChanges = (configPath: string) => {
    fs.watchFile(configPath, () => {
      console.log('-----------------------------------------');
      console.log(configPath + ' changed');
      this.readAndStart();
    });
  };

  private parseConfig = (configData: any): IConfig => {
    const normalizedData = normalize(configData, ConfigSchema);
    return normalizedData as IConfig;
  };

  private readAndStart = () => {
    this.readFile(this.configFilePath)
      .then(json => {
        const config = this.parseConfig(json);
        this.restartServer(config);
      })
      .catch(error => {
        ErrorHandler.checkErrorAndStopProcess(error);
        process.exit();
      });
  };

  private restartServer = (config: IConfig) => {
    if (this.app.isListening()) {
      this.app.stop(error => {
        if (error) {
          console.error(error);
        } else {
          this._startServer(config);
        }
      });
    } else {
      this._startServer(config);
    }
  };

  private _startServer = (config: IConfig) => {
    this.app.setupServer(config);

    this.app.start(error => {
      if (error) {
        return console.error(error);
      }

      return console.log(`server is listening`);
    });
  };
}

export default Server;
