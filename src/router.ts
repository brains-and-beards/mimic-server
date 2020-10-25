import express, { Router as ExpressRouter } from 'express';
import _ from 'lodash';
import moment from 'moment';
import request from 'request';

import { ILog, LogTypes } from './app';
import { parseHost } from './helpers/hostParser';
import { sendMockedRequest } from './helpers/mockRequestAssembler';
import { getMockedEndpointForQuery } from './helpers/queryParamsMatcher';
import { parseQuery } from './helpers/queryParser';

export const enum MessageTypes {
  STOP,
  START,
  ERROR,
  LOG,
}

interface IResponseData {
  readonly requestObject: express.Request;
  readonly responseObject: express.Response;
  readonly responseBody: any;
  readonly statusCode: number;
  readonly timeout: number;
}

class Router {
  private config: IConfig = {
    entities: { endpoints: [], projects: [] },
    result: { httpPort: 3000, httpsPort: 3001 },
  };
  private logMessage: (logObject: ILog) => void;
  private endpointsParams = new Map<string, any>();
  private endpointsBody = new Map<string, any>();
  private endpointsResponse = new Map<string, any>();
  private port: number;
  private router: ExpressRouter;

  constructor({
    config,
    loggingFunction,
    port,
  }: {
    config: IConfig;
    loggingFunction: (logObject: ILog) => void;
    port: number;
  }) {
    this.config = config;
    this.logMessage = loggingFunction;
    this.port = port;
    this.router = ExpressRouter();
    this.mountRoutes();
  }

  getExpressRouter(): ExpressRouter {
    return this.router;
  }

  private mountRoutes() {
    const { endpoints, projects } = this.config.entities;

    _.forEach(endpoints, (endpoint: IEndpoint) => {
      if (endpoint.enable) {
        const project = projects[endpoint.projectId];
        const endpointPath = '/' + project.slug + endpoint.path;

        this.register(endpoint, project.slug);
        this.parseEndpointResponse(endpoint, endpointPath);
        this.parseParamsEndpoint(endpoint, endpointPath);
        this.parseBodyEndpoint(endpoint, endpointPath);
      }
    });

    // Handle non-mocked routes
    this.router.use('/', (req: express.Request, res: any, _next: any) => {
      this.handleMissedRoute(req, res);
    });
  }

  private parseEndpointResponse(endpoint: IEndpoint, endpointPath: string) {
    let key = endpoint.method + endpointPath;

    if (endpoint.request.params && endpoint.request.params !== '?') key += endpoint.request.params;
    if (endpoint.request.body && !_.isEqual(endpoint.request.body, {})) key += JSON.stringify(endpoint.request.body);

    this.endpointsResponse.set(key, endpoint.response);
  }

  private parseParamsEndpoint(endpoint: IEndpoint, endpointPath: string) {
    const existingEndpointParams = this.endpointsParams.get(endpointPath);
    const params = existingEndpointParams && existingEndpointParams.length > 0 ? existingEndpointParams : [];

    params.push(endpoint.request.params);
    this.endpointsParams.set(endpointPath, params);
  }

  private parseBodyEndpoint(endpoint: IEndpoint, endpointPath: string) {
    const bodyValues = this.endpointsBody.get(endpointPath);

    const bodyArray = bodyValues && bodyValues.length > 0 ? bodyValues : [];
    bodyArray.push(endpoint.request.body);

    this.endpointsBody.set(endpointPath, bodyArray);
  }

  private getAppropriateListenerFunction(method: string): express.IRouterMatcher<ExpressRouter> {
    if (method === 'delete') return this.router.delete.bind(this.router);
    if (method === 'get') return this.router.get.bind(this.router);
    if (method === 'patch') return this.router.patch.bind(this.router);
    if (method === 'post') return this.router.post.bind(this.router);
    if (method === 'put') return this.router.put.bind(this.router);

    throw new Error('[getAppropriateListenerFunction] Unexpected API method to listen for');
  }

  private logRequest(
    req: express.Request,
    matched: boolean,
    type: LogTypes,
    statusCode: number,
    respBody?: object
  ): void {
    const log: ILog = {
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
    this.logMessage(log);
  }

  private register(endpoint: IEndpoint, scope = ''): void {
    const path = '/' + scope + endpoint.path;
    const method = endpoint.method.toLowerCase();

    const httpMethodListenerFunction = this.getAppropriateListenerFunction(method);
    httpMethodListenerFunction(path, (req: express.Request, res: any) => {
      const body = path.includes('*')
        ? this.getResponseBodyByParams(path, req)
        : this.getResponseBodyByParams(req.path, req);

      if (body) {
        const responseData: IResponseData = {
          requestObject: req,
          responseObject: res,
          statusCode: endpoint.statusCode || 200,
          timeout: endpoint.timeout || 0,
          responseBody: body,
        };
        this.sendResponse(responseData);
      } else {
        this.handleMissedRoute(req, res);
      }
    });
  }

  private getResponseBodyByParams(path: string, req: express.Request): string | undefined | object {
    if (req.query && !_.isEmpty(req.query)) {
      const paramExists = this.paramsExists(this.endpointsParams.get(path), req);

      return paramExists
        ? this.endpointsResponse.get(req.method + path + this.parseQueryToString(req.query))
        : undefined;
    } else if (req.body && !_.isEmpty(req.body)) {
      const requestBody = req.body.toString('utf8');
      const bodyExists = this.bodyExists(this.endpointsBody.get(path), requestBody);

      if (bodyExists) {
        return this.isJsonString(requestBody)
          ? this.endpointsResponse.get(req.method + path + JSON.stringify(JSON.parse(requestBody)))
          : this.endpointsResponse.get(req.method + path + `"${requestBody}"`);
      } else {
        return undefined;
      }
    } else {
      // for requests without body or params
      return this.endpointsResponse.get(req.method + path);
    }
  }

  private sendResponse(response: IResponseData) {
    const { responseObject, requestObject, statusCode, timeout, responseBody } = response;

    if (timeout > 0) {
      setTimeout(() => responseObject.status(statusCode).send(responseBody), timeout);
    } else {
      responseObject.status(statusCode).send(responseBody);
    }
    this.logRequest(requestObject, true, LogTypes.REQUEST, response.statusCode);
  }

  private isJsonString(str: any) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  private bodyExists(bodyForEndpoint: any, requestBody: any) {
    let bodyExists = false;
    bodyForEndpoint.forEach((body: JSON | string) => {
      if (this.isJsonString(requestBody)) {
        if (_.isEqual(requestBody, {}) && _.isEqual(body, requestBody)) {
          bodyExists = true;
        } else if (_.isEqual(body, JSON.parse(requestBody))) {
          bodyExists = true;
        }
      } else if (_.isEqual(body, requestBody)) bodyExists = true;
    });

    return bodyExists;
  }

  private paramsExists(paramsForEndpoint: any, req: express.Request) {
    let paramExists = false;
    if (paramsForEndpoint) {
      paramsForEndpoint.forEach((param: string) => {
        if (_.isEqual(parseQuery(param), req.query)) {
          paramExists = true;
        }
      });
    }

    return paramExists;
  }

  private parseQueryToString(obj: any) {
    const keys = Object.keys(obj);

    return keys.length === 0
      ? ''
      : '?' +
          keys
            .reduce((a: any, k: string) => {
              a.push(k + '=' + encodeURIComponent(obj[k]));
              return a;
            }, [])
            .join('&');
  }

  private sendLogForMockedRequest = () => {
    const logObject: ILog = {
      type: LogTypes.SERVER,
      message: 'WARNING - Multiple mocked endpoints found',
      date: moment().format('YYYY/MM/DD HH:mm:ss'),
      matched: true,
      isWarning: true,
    };
    this.logMessage(logObject);
  };

  private handleMissedRoute(apiRequest: express.Request, response: express.Response) {
    const projectName = apiRequest.originalUrl.split('/')[1];
    const project = _.find(this.config.entities.projects, (proj) => proj.slug === projectName);
    const { endpoints } = this.config.entities;
    const { projects } = this.config.entities;

    const mockedEndpoints = getMockedEndpointForQuery(projects, endpoints, apiRequest);
    if (project && project.urlPrefix && mockedEndpoints.length === 0) {
      this.forwardRequest(apiRequest, response);
    } else if (mockedEndpoints.length > 0) {
      const firstMocked = mockedEndpoints[0];
      if (mockedEndpoints.length > 1) {
        this.sendLogForMockedRequest();
      }
      sendMockedRequest(apiRequest, response, projectName, firstMocked, this.port);
    } else {
      this.logRequest(apiRequest, false, LogTypes.RESPONSE, 404);
      response.status(404).send(project ? `URL endpoint not found` : `Project "${projectName}" not found`);
    }
  }

  private getForwardingOptions(req: express.Request) {
    const [, projectName, ...localPath] = req.originalUrl.split('/');
    const project = _.find(this.config.entities.projects, (proj) => proj.slug === projectName);
    const { urlPrefix } = project;

    const url = `${urlPrefix}${urlPrefix.endsWith('/') ? '' : '/'}${localPath.join('/')}`;
    const host = parseHost(url);

    return {
      headers: { ...req.headers, host, 'accept-encoding': '' },
      method: req.method,
      body: req.method === 'GET' ? null : req.body,
      uri: url,
      rejectUnauthorized: false,
    };
  }

  private forwardRequest(req: express.Request, responseStream: express.Response) {
    const options = this.getForwardingOptions(req);

    request(options, (error, response, body) => {
      const contentEncoding = response.headers['content-encoding'];
      if (contentEncoding && contentEncoding.includes('gzip')) {
        this.forwardGzipRequest(options, req);
      } else {
        if (error) {
          this.logRequest(req, false, LogTypes.ERROR, 0, error.toString());
        } else {
          this.logRequest(
            req,
            true,
            LogTypes.RESPONSE,
            response && response.statusCode ? response.statusCode : 418,
            body.toString()
          );
        }
      }
    }).pipe(responseStream);
  }

  private forwardGzipRequest(options: any, req: express.Request) {
    request({ ...options, gzip: true }, (error: any, response: any, body: any) => {
      if (error) {
        this.logRequest(req, false, LogTypes.ERROR, 0, error.toString());
      } else {
        this.logRequest(
          req,
          true,
          LogTypes.RESPONSE,
          response && response.statusCode ? response.statusCode : 418,
          body.toString()
        );
      }
    });
  }
}

export default Router;
