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
import { ErrorHandler } from './errors/error-handler';

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

  constructor() {
    this.setupServer(this.config);

    const socketsDir = '/tmp/apimocker_server';
    if (!fs.existsSync(socketsDir)) fs.mkdirSync(socketsDir);

    this.socket = socket('pull');
    this.socket.connect(`ipc://${socketsDir}/commands.ipc`);
    this.socket.on('message', this.handleUIMessage);

    this.socketLogs = socket('push');
    this.socketLogs.bindSync(`ipc://${socketsDir}/logs.ipc`);
  }

  setupServer(config: IConfig) {
    this.config = config;

    const { httpPort, httpsPort } = config.result;
    this.port = httpPort || 3000;
    this.sslPort = httpsPort || 3001;

    this.express = express();
    this.express.use(bodyParser.raw({ type: '*/*' }));
    this.mountRoutes();
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
          matched: true,
        };
        this.socketLogs.send(JSON.stringify(logObject));
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
          message: 'START',
          date: moment().format('YYYY/MM/DD HH:mm:ss'),
          matched: true,
        };
        this.socketLogs.send(JSON.stringify(logObject));
      }
      callback(error);
    };

    this.httpServer = HTTP.createServer(this.express);
    this.httpServer.listen(this.port, afterStart).on('error', (error: any) => {
      ErrorHandler.checkErrorAndStopProcess(error);
    });

    if (fs.existsSync('./localhost.key') && fs.existsSync('./localhost.crt')) {
      const sslOptions = {
        key: fs.readFileSync('./localhost.key'),
        cert: fs.readFileSync('./localhost.crt'),
      };

      // TODO: We should get proper Android support before we launch SSL support
      // this.sslServer = HTTPS.createServer(sslOptions, this.express).listen(this.sslPort, afterStart);
    }
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

  private handleError = (error: Error) => {
    if (!error) return;
    const logObject: ILog = {
      type: LogTypes.SERVER,
      message: `ERROR ${error}`,
      matched: true,
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
    if (method === 'delete') return this.express.delete.bind(this.express);
    if (method === 'get') return this.express.get.bind(this.express);
    if (method === 'patch') return this.express.patch.bind(this.express);
    if (method === 'post') return this.express.post.bind(this.express);
    if (method === 'put') return this.express.put.bind(this.express);

    throw new Error('[getAppropriateListenerFunction] Unexpected API method to listen for');
  }

  private sendLog(req: express.Request, matched: boolean, type: LogTypes, statusCode: number, respBody?: object): void {
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
      response: respBody,
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
      const response = res.status(statusCode);

      if (timeout > 0) {
        setTimeout(() => response.send(endpoint.response), timeout);
      } else {
        response.send(endpoint.response);
      }

      this.sendLog(req, true, LogTypes.REQUEST, statusCode);
    });
  }

  private addMissedRouteHandler() {
    this.express.use('/', (req: express.Request, res: any, next: any) => {
      const projectName = req.originalUrl.split('/')[1];
      const project = _.find(this.config.entities.projects, proj => proj.name === projectName);

      if (project && project.fallbackUrlPrefix && project.fallbackUrlPrefix.domain) {
        const response = this.forwardRequest(req, res);
      } else {
        this.sendLog(req, false, LogTypes.RESPONSE, 404);
        res.status(404).send('Not found');
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

    request(options, (error, response, body) => {
      if (error) {
        this.sendLog(req, false, LogTypes.ERROR, 0, error.toString());
      } else {
        this.sendLog(req, true, LogTypes.RESPONSE, response && response.statusCode ? response.statusCode : 418, body);
      }
    }).pipe(responseStream);
  }
}

export default App;
