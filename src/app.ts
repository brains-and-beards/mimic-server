/* tslint:disable:no-console */
import express from 'express';
import bodyParser from 'body-parser';
import HTTP from 'http';
import HTTPS from 'https';
import _ from 'lodash';
import { socket } from 'zeromq';
import moment from 'moment';
import fs from 'fs';
import request from 'request';

export const enum MessageTypes {
  STOP,
  RESTART,
  ERROR,
  LOG,
}

export const enum LogTypes {
  SERVER,
  REQUEST,
  RESPONSE,
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
  readonly headers?: any;
  readonly url?: string;
}

class App {
  private port: number;
  private sslPort: number;
  private express: express.Express;
  private config: IConfig;
  private httpServer?: HTTP.Server;
  private sslServer?: HTTPS.Server;
  private socket: any;
  private socketLogs: any;

  constructor(config: IConfig) {
    this.config = config;

    const { httpPort, httpsPort } = config.result;
    this.port = httpPort || 3000;
    this.sslPort = httpsPort || 3001;

    this.express = express();
    this.express.use(bodyParser.raw({ type: '*/*' }));
    this.mountRoutes();

    this.socket = socket('rep');
    this.socket.connect('ipc://server_commands.ipc');
    this.socket.on('message', this.handleUIMessage);

    this.socketLogs = socket('req');
    this.socketLogs.connect('ipc://logs.ips');
    this.socketLogs.on('message', this.handleUIMessageLogs);
  }

  isListening = (): boolean => {
    return this.httpServer ? this.httpServer.listening : false;
  };

  stop = (callback: ((error: Error) => void)) => {
    const afterStop = (error: Error) => {
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
    };

    if (this.httpServer) this.httpServer.close(afterStop);
    if (this.sslServer) this.sslServer.close(afterStop);
  };

  start = (callback: ((error: Error) => void)) => {
    const afterStart = (error: Error) => {
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
    };

    this.httpServer = HTTP.createServer(this.express).listen(this.port, afterStart);

    if (fs.existsSync('./localhost.key') && fs.existsSync('./localhost.crt')) {
      const sslOptions = {
        key: fs.readFileSync('./localhost.key'),
        cert: fs.readFileSync('./localhost.crt'),
      };
      this.sslServer = HTTPS.createServer(sslOptions, this.express).listen(this.sslPort, afterStart);
    }
  };

  restart = (callback: ((error: Error) => void)) => {
    if (this.httpServer || this.sslServer) this.stop(() => this.start(this.handleError));
    else this.start(this.handleError);
  };

  private handleUIMessage = (message: Uint8Array) => {
    const messageCode = Number(message.toString());

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
    if (method === 'delete') return this.express.get.bind(this.express);
    if (method === 'get') return this.express.get.bind(this.express);
    if (method === 'patch') return this.express.get.bind(this.express);
    if (method === 'post') return this.express.get.bind(this.express);
    if (method === 'put') return this.express.get.bind(this.express);

    throw new Error('[getAppropriateListenerFunction] Unexpected API method to listen for');
  }

  private sendLog(req: express.Request, matched: boolean, type: LogTypes, statusCode: number): void {
    const log = {
      method: req.method,
      path: req.path,
      body: req.body,
      matched,
      protocol: req.protocol,
      host: req.hostname,
      date: moment().format('YYYY/MM/DD HH:mm:ss'),
      port: parseInt(this.port.toString(), 10),
      query: req.query,
      type,
      statusCode,
    };
    this.socketLogs.send(JSON.stringify(log));
  }

  private register(endpoint: IEndpoint, scope = ''): void {
    const path = '/' + scope + endpoint.path;
    const method = endpoint.method.toLowerCase();
    const statusCode = endpoint.statusCode || 200;
    const timeout = endpoint.timeout || 0;

    const httpMethodListenerFunction = this.getAppropriateListenerFunction(method);
    httpMethodListenerFunction(path, (req: express.Request, res: any) => {
      const response = this.substituteParams(endpoint.response, req.params);

      if (timeout > 0) {
        setTimeout(() => res.status(statusCode).send(response), timeout);
      } else {
        res.send(response);
      }

      this.sendLog(req, true, LogTypes.REQUEST, 200);
    });
  }

  private substituteParams(resp: any, params: any): any {
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
    this.express.use('/', (req: express.Request, res: any, next: any) => {
      const projectName = req.originalUrl.split('/')[1];
      const project = _.find(this.config.entities.projects, proj => proj.name === projectName);

      if (project && project.fallbackUrlPrefix) {
        const response = this.forwardRequest(req, res);
      } else {
        this.sendLog(req, false, LogTypes.RESPONSE);
        res.status(200).send('RESPONSE'); // TODO: Add mock response
      }
    });
  }

  private getForwardingOptions(req: express.Request) {
    const [_unused, projectName, ...localPath] = req.originalUrl.split('/');
    const project = _.find(this.config.entities.projects, proj => proj.name === projectName);
    const { domain, path, port } = project.fallbackUrlPrefix;
    const portInfo = port ? `:${port}` : '';

    const url = `http://${domain}${portInfo}${path}/${localPath.join('/')}`;

    return {
      headers: { ...req.headers, host: domain },
      method: req.method,
      body: req.method === 'GET' ? null : req.body,
      url,
    };
  }

  private forwardRequest(req: express.Request, responseStream: express.Response) {
    const options = this.getForwardingOptions(req);

    request(options)
      .on('response', (response: any) => {
        this.sendLog(req, true, LogTypes.RESPONSE, response.statusCode);
      })
      .pipe(responseStream);
  }
}

export default App;
