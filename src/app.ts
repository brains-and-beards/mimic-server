import bodyParser from "body-parser";
import express from "express";
import fs from "fs";
import HTTP from "http";
import HTTPS from "https";
import moment from "moment";

import ErrorHandler from "./errors/errorHandler";
import Router from "./router";

export const enum MessageTypes {
  STOP,
  START,
  ERROR,
  LOG,
}

export const enum LogTypes {
  SERVER,
  REQUEST,
  RESPONSE,
  ERROR,
}

export interface ILog {
  readonly body?: any;
  readonly date?: string;
  readonly matched?: boolean;
  readonly method?: string;
  readonly path?: string;
  readonly protocol?: string;
  readonly host?: string;
  readonly port?: number;
  readonly response?: any;
  readonly statusCode?: number;
  readonly query?: any;
  readonly type: LogTypes;
  readonly message?: string;
  readonly headers?: any;
  readonly url?: string;
  readonly isWarning?: boolean;
}

// We need a global router object to be able to dynamically switch config
let router: express.Router;

class App {
  // @ts-ignore
  private port: number;
  // @ts-ignore
  private sslPort: number;
  // @ts-ignore
  private express: express.Express;
  private config: IConfig = {
    entities: { endpoints: [], projects: [] },
    result: { httpPort: 3000, httpsPort: 3001 },
  };
  private httpServer?: HTTP.Server;
  private sslServer?: HTTPS.Server;
  private socket: any;
  private socketLogs: any;
  private errorHandler: ErrorHandler;

  constructor(errorHandler: ErrorHandler, useZeroMQ = false) {
    this.setupServer(this.config);

    const socketsDir = "/tmp/apimocker_server";
    if (!fs.existsSync(socketsDir)) fs.mkdirSync(socketsDir);

    this.errorHandler = errorHandler;

    if (useZeroMQ) {
      const ZeroMQ = require("zeromq");

      this.socket = ZeroMQ.socket("pull");
      this.socket.connect(`ipc://${socketsDir}/commands.ipc`);
      this.socket.on("message", this.handleUIMessage);

      this.socketLogs = ZeroMQ.socket("push");
      this.socketLogs.bindSync(`ipc://${socketsDir}/logs.ipc`);
    }
  }

  setupServer(config: IConfig) {
    this.config = config;

    const { httpPort, httpsPort } = config.result;
    this.port = httpPort || 3000;
    this.sslPort = httpsPort || 3001;

    this.express = express();
    this.express.use(bodyParser.raw({ type: "*/*" }));

    router = new Router({
      config,
      loggingFunction: this.logMessage,
      port: this.port,
    }).getExpressRouter();
    this.express.use(function replaceableRouter(req, res, next) {
      router(req, res, next);
    });
  }

  isListening = (): boolean => {
    return this.httpServer ? this.httpServer.listening : false;
  };

  stop = (callback: (error?: Error) => void) => {
    const afterStop = (error?: Error) => {
      if (!error) this.logServerClose();
      callback(error);
    };

    if (this.httpServer) this.httpServer.close(afterStop);
    // Currently we don't fully support (nor need) SSL, so we only stop one server
    // if (this.sslServer) this.sslServer.close(afterStop);
  };

  // Like stop, but make a loop where we sleep 500ms and check whether the server emitted the 'close' event to be sure it's finished.
  // Then we resolve the promise and hand back the control
  stopSync = async (callback: (error?: Error) => void) => {
    const afterStop = (error?: Error) => {
      if (!error) this.logServerClose();
      callback(error);
    };

    if (this.httpServer) {
      let isServerClosed = false;

      this.httpServer.once("close", () => {
        isServerClosed = true;
      });

      this.httpServer.close(afterStop);

      while (!isServerClosed) {
        await sleep(500);
      }
      return true;
    } else {
      // eslint-disable-next-line no-console
      console.error("[app > stop-sync] No server to stop, weird!");
      return Promise.resolve(true);
    }

    // Currently we don't fully support (nor need) SSL, so we only stop one server
    // if (this.sslServer) this.sslServer.close(afterStop);
  };

  start = (callback: (error: Error) => void) => {
    const afterStart = (error: Error) => {
      if (!error) callback(error);
    };

    this.httpServer = HTTP.createServer(this.express);
    this.httpServer.listen(this.port, afterStart).on("error", (error: any) => {
      this.errorHandler.checkErrorAndStopProcess(error);
    });

    // if (fs.existsSync('./localhost.key') && fs.existsSync('./localhost.crt')) {
    // const sslOptions = {
    //   key: fs.readFileSync('./localhost.key'),
    //   cert: fs.readFileSync('./localhost.crt'),
    // };

    // TODO: We should get proper Android support before we launch SSL support
    // this.sslServer = HTTPS.createServer(sslOptions, this.express).listen(this.sslPort, afterStart);
    // }
  };

  switchConfig = (config: IConfig): void => {
    router = new Router({
      config,
      loggingFunction: this.logMessage,
      port: this.port,
    }).getExpressRouter();
  };

  private logServerClose = () => {
    this.logMessage({
      type: LogTypes.SERVER,
      message: "START",
      date: moment().format("YYYY/MM/DD HH:mm:ss"),
      matched: true,
    });
  };

  private handleUIMessage = (message: Uint8Array) => {
    const messageCode = Number(message.toString());

    switch (messageCode) {
      case MessageTypes.STOP:
        return this.stop(this.handleError);
      case MessageTypes.START:
        return this.start(this.handleError);
      default:
    }
  };

  private handleError = (error?: Error) => {
    if (!error) return;

    this.logMessage({
      type: LogTypes.SERVER,
      message: `ERROR ${error}`,
      matched: true,
      date: moment().format("YYYY/MM/DD HH:mm:ss"),
    });
  };

  private logMessage(logObject: ILog) {
    const payload = JSON.stringify(logObject);
    const loggingMethod = this.socketLogs ? this.socketLogs.send : console.log;

    return loggingMethod(payload);
  }
}

function sleep(miliseconds: number) {
  const sleepPromise = new Promise<void>((resolve, _reject) =>
    setTimeout(() => resolve(), miliseconds)
  );
  return sleepPromise;
}

export default App;
