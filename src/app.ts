/* tslint:disable:no-console */
import express from 'express';
import HTTP from 'http';
import _ from 'lodash';
import { socket } from 'zeromq';
import moment from 'moment';

export const enum MessageTypes {
  STOP,
  RESTART,
  ERROR,
  LOG,
}

export const enum LogTypes {
  SERVER,
  REQUEST,
}

interface ILog {
  readonly body?: any;
  readonly date?: string;
  readonly matched?: boolean;
  readonly method?: string;
  readonly path?: string;
  readonly protocol?: string;
  readonly host?: string;
  readonly port?: number;
  readonly statusCode?: number;
  readonly query?: any;
  readonly type: LogTypes;
  readonly message?: string;
}

class App {
  port = process.env.PORT || 3000; // TODO: get port from the config file
  private express: express.Express;
  private config: IConfig;
  private httpServer?: HTTP.Server;
  private socket: any;
  private socketLogs: any;

  constructor(config: IConfig) {
    this.config = config;
    this.express = express();
    this.mountRoutes();

    this.socket = socket('rep');
    this.socket.connect('ipc://server_commands.ipc');
    this.socketLogs = socket('req');
    this.socketLogs.connect('ipc://logs.ips');
    this.socketLogs.on('message', this.handleUIMessageLogs);
    this.socket.on('message', this.handleUIMessage);
  }

  isListening = (): boolean => {
    return this.httpServer ? this.httpServer.listening : false;
  };

  stop = (callback: ((error: Error) => void)) => {
    if (this.httpServer) {
      this.httpServer.close((error: Error) => {
        if (!error) {
          const logObject: ILog = {
            type: LogTypes.SERVER,
            message: 'STOP',
            date: moment().format('YYYY/MM/DD HH:mm:ss'),
            matched: true, // TODO: Do we need this field?
          };
          this.socketLogs.send(JSON.stringify(logObject));
          this.socket.send(MessageTypes.STOP);
        }
        callback(error);
      });
    }
  };

  start = (callback: ((error: Error) => void)) => {
    this.httpServer = this.express.listen(this.port, (error: Error) => {
      console.log('​App -> start -> this.port', this.port);
      if (!error) {
        const logObject: ILog = {
          type: LogTypes.SERVER,
          message: 'RESTART',
          date: moment().format('YYYY/MM/DD HH:mm:ss'),
          matched: true, // TODO: Do we need this field?
        };
        this.socketLogs.send(JSON.stringify(logObject));
        this.socket.send(MessageTypes.RESTART);
      }
      callback(error);
    });
  };

  restart = (callback: ((error: Error) => void)) => {
    console.log('​App -> restart -> restart', 'restart');
    if (this.httpServer) this.stop(() => this.start(this.handleError));
    else this.start(this.handleError);
  };

  private handleUIMessage = (message: Uint8Array) => {
    const messageCode = Number(message.toString());
    console.log('Received message', message, messageCode);

    switch (messageCode) {
      case MessageTypes.STOP:
        return this.stop(this.handleError);
      case MessageTypes.RESTART:
        return this.restart(this.handleError);
      default:
    }
  };

  // tslint:disable-next-line:no-empty
  private handleUIMessageLogs = (message: Uint8Array) => {};

  private handleError = (error: Error) => {
    if (!error) return;
    console.log('Sending error', error);
    this.socket.send(`${MessageTypes.ERROR}${error}`);
    const logObject: ILog = {
      type: LogTypes.SERVER,
      message: `ERROR ${error}`,
      matched: true, // TODO: Do we need this field?
      date: moment().format('YYYY/MM/DD HH:mm:ss'),
    };
    this.socketLogs.send(JSON.stringify(logObject));
  };

  private mountRoutes(): void {
    const { endpoints, projects } = this.config.entities;
    _.forEach(endpoints, (endpoint: IEndpoint) => {
      const project = projects[endpoint.projectId];
      this.register(endpoint, project.name);
    });
    this.addMissedRouteHandler();
  }

  private getAppropriateListenerFunction(method: string): express.IRouterMatcher<express.Express> {
    console.log('​App -> method', method);
    if (method === 'delete') return this.express.get.bind(this.express);
    if (method === 'get') return this.express.get.bind(this.express);
    if (method === 'patch') return this.express.get.bind(this.express);
    if (method === 'post') return this.express.get.bind(this.express);
    if (method === 'put') return this.express.get.bind(this.express);

    throw new Error('[getAppropriateListenerFunction] Unexpected API method to listen for');
  }

  private register(endpoint: IEndpoint, scope = ''): void {
    const path = '/' + scope + endpoint.path;
    const method = endpoint.method.toLowerCase();
    const statusCode = endpoint.statusCode || 200;
    const timeout = endpoint.timeout || 0;

    const httpMethodListenerFunction = this.getAppropriateListenerFunction(method);
    httpMethodListenerFunction(path, (req: any, res: any) => {
      const response = this.substituteParams(endpoint.response, req.params);
      console.log('​App -> response', response);

      if (timeout > 0) {
        setTimeout(() => res.status(statusCode).send(response), timeout);
      } else {
        res.send(response);
      }
    });
  }

  private substituteParams(resp: any, params: any): any {
    console.log('​App -> resp', resp);
    for (const i in resp) {
      // Check nested objects recursively
      if (typeof resp[i] === 'object') {
        resp[i] = this.substituteParams(resp[i], params);
      } else if (typeof resp[i] === 'string' && resp[i][0] === ':') {
        // If value starts with a colon, substitute it with param value
        const paramName = resp[i].slice(1);
        resp[i] = params[paramName];
      }
    }
    return resp;
  }

  private addMissedRouteHandler() {
    this.express.use('/', (req: any, res: any, next: any) => {
      const statusCode = 404; // TODO: Change it

      const logObject: ILog = {
        method: req.method,
        path: req.path,
        body: req.body,
        matched: true, // TODO: Do we need this field?
        protocol: req.protocol,
        host: req.hostname,
        date: moment().format('YYYY/MM/DD HH:mm:ss'),
        port: parseInt(this.port.toString(), 10),
        statusCode,
        query: req.query,
        type: LogTypes.REQUEST,
      };

      const response = this.handleUnmocked(req, logObject);
      res.status(404).send(response);
    });
  }

  private handleUnmocked(req: any, log: ILog): any {
    // TODO: Log an unmocked request
    this.socketLogs.send(JSON.stringify(log));
    // TODO: return a forwarded response from the real API server
    return 'TODO: get a response from the origin API';
  }
}

export default App;
