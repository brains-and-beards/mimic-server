/* eslint-disable no-console */
import fs from "fs";
import { normalize } from "normalizr";
import { promisify } from "util";

import App from "./app";
import ErrorHandler from "./errors/errorHandler";
import { ConfigSchema } from "./Models/DataSchema";

class Server {
  readFileAsync = promisify(fs.readFile);
  configFilePath: string;
  app: App;
  errorHandler: ErrorHandler;

  constructor(
    filename: string,
    handleErrors?: (code?: number) => void,
    useZeroMQ = false
  ) {
    const runningInTest = process.env.NODE_ENV === "test";
    this.errorHandler = new ErrorHandler(handleErrors);
    this.app = new App(this.errorHandler, runningInTest ? false : useZeroMQ);

    if (!filename) {
      runningInTest
        ? (this.configFilePath = "./testmocker.json")
        : (this.configFilePath = "./apimocker.json");
    } else {
      this.configFilePath = filename;
    }
    console.log("Reading config file from: " + this.configFilePath);
  }

  run = async () => {
    this.watchConfigForChanges(this.configFilePath);
    await this.readAndStart();
  };

  stopServer = (callback?: () => any) => {
    this.unwatchConfigForChanges(this.configFilePath);
    if (this.app) {
      return this.app.stop((error) => {
        if (error) {
          console.error(error);
        } else {
          if (callback) callback();
        }
      });
    } else {
      // eslint-disable-next-line no-console
      console.error("[server] No server to stop, weird!");
      return Promise.resolve(true);
    }
  };

  stopServerSync = (callback?: () => any) => {
    this.unwatchConfigForChanges(this.configFilePath);
    if (this.app) {
      return this.app.stopSync((error) => {
        if (error) {
          console.error(error);
        } else {
          if (callback) callback();
        }
      });
    } else {
      // eslint-disable-next-line no-console
      console.error("[server] No server to stop, weird!");
      return Promise.resolve(true);
    }
  };

  switchConfig = (config: IConfig): void => {
    this.app.switchConfig(this.parseConfig(config));
  };

  private async readFile(configPath: string) {
    const data = await this.readFileAsync(configPath, { encoding: "utf-8" });
    const parsed = JSON.parse(data);
    const externals = [];

    if (parsed.importedConfigurations) {
      for (const item of parsed.importedConfigurations) {
        const external = await this.readFileAsync(item.path, {
          encoding: "utf-8",
        });
        const parsedExternal = JSON.parse(external);
        externals.push(...parsedExternal.projects);
      }

      if (parsed && parsed.projects) {
        parsed.projects.push(...externals);
      }
    }

    return parsed;
  }

  private watchConfigForChanges = (configPath: string) => {
    fs.watchFile(configPath, () => {
      console.log("-----------------------------------------");
      console.log(configPath + " changed");
      this.readAndStart();
    });
  };

  private unwatchConfigForChanges = (configPath: string) => {
    fs.unwatchFile(configPath);
  };

  private parseConfig = (configData: any): IConfig => {
    const normalizedData = normalize(configData, ConfigSchema);
    return normalizedData as IConfig;
  };

  private readAndStart = () => {
    return this.readFile(this.configFilePath)
      .then((json) => {
        const config = this.parseConfig(json);
        this.restartServer(config);
      })
      .catch((error) => {
        this.errorHandler.checkErrorAndStopProcess(error);
        this.stopServer();
      });
  };

  private restartServer = (config: IConfig) => {
    if (this.app.isListening()) {
      this.stopServer(() => this._startServer(config));
    } else {
      this._startServer(config);
    }
  };

  private _startServer = (config: IConfig) => {
    this.app.setupServer(config);

    this.app.start((error) => {
      if (error) {
        return console.error(error);
      }

      return console.log(`server is listening`);
    });
  };
}

export default Server;
