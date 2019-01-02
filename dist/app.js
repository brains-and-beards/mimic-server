"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-console */
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_1 = __importDefault(require("http"));
const lodash_1 = __importDefault(require("lodash"));
const zeromq_1 = require("zeromq");
const moment_1 = __importDefault(require("moment"));
const fs_1 = __importDefault(require("fs"));
const request_1 = __importDefault(require("request"));
const hostParser_1 = require("./helpers/hostParser");
const queryParamsMatcher_1 = require("./helpers/queryParamsMatcher");
const queryParser_1 = require("./helpers/queryParser");
const mockRequestAssembler_1 = require("./helpers/mockRequestAssembler");
class App {
    constructor(errorHandler) {
        this.config = {
            entities: { endpoints: [], projects: [] },
            result: { httpPort: 3000, httpsPort: 3001 },
        };
        this.endpointsParams = new Map();
        this.endpointsBody = new Map();
        this.endpointsResponse = new Map();
        this.isListening = () => {
            return this.httpServer ? this.httpServer.listening : false;
        };
        this.stop = (callback) => {
            const afterStop = (error) => {
                if (!error) {
                    const logObject = {
                        type: 0 /* SERVER */,
                        message: 'STOP',
                        date: moment_1.default().format('YYYY/MM/DD HH:mm:ss'),
                        matched: true,
                    };
                    this.socketLogs.send(JSON.stringify(logObject));
                }
                callback(error);
            };
            if (this.httpServer)
                this.httpServer.close(afterStop);
            if (this.sslServer)
                this.sslServer.close(afterStop);
        };
        this.start = (callback) => {
            const afterStart = (error) => {
                if (!error) {
                    const logObject = {
                        type: 0 /* SERVER */,
                        message: 'START',
                        date: moment_1.default().format('YYYY/MM/DD HH:mm:ss'),
                        matched: true,
                    };
                    this.socketLogs.send(JSON.stringify(logObject));
                }
                callback(error);
            };
            this.httpServer = http_1.default.createServer(this.express);
            this.httpServer.listen(this.port, afterStart).on('error', (error) => {
                this.errorHandler.checkErrorAndStopProcess(error);
            });
            if (fs_1.default.existsSync('./localhost.key') && fs_1.default.existsSync('./localhost.crt')) {
                const sslOptions = {
                    key: fs_1.default.readFileSync('./localhost.key'),
                    cert: fs_1.default.readFileSync('./localhost.crt'),
                };
                // TODO: We should get proper Android support before we launch SSL support
                // this.sslServer = HTTPS.createServer(sslOptions, this.express).listen(this.sslPort, afterStart);
            }
        };
        this.handleUIMessage = (message) => {
            const messageCode = Number(message.toString());
            switch (messageCode) {
                case 0 /* STOP */:
                    return this.stop(this.handleError);
                case 1 /* START */:
                    return this.start(this.handleError);
                default:
            }
        };
        this.handleError = (error) => {
            if (!error)
                return;
            const logObject = {
                type: 0 /* SERVER */,
                message: `ERROR ${error}`,
                matched: true,
                date: moment_1.default().format('YYYY/MM/DD HH:mm:ss'),
            };
            this.socketLogs.send(JSON.stringify(logObject));
        };
        this.sendLogForMockedRequest = () => {
            const logObject = {
                type: 0 /* SERVER */,
                message: 'WARNING - Multiple mocked endpoints found',
                date: moment_1.default().format('YYYY/MM/DD HH:mm:ss'),
                matched: true,
                isWarning: true,
            };
            this.socketLogs.send(JSON.stringify(logObject));
        };
        this.setupServer(this.config);
        const socketsDir = '/tmp/apimocker_server';
        if (!fs_1.default.existsSync(socketsDir))
            fs_1.default.mkdirSync(socketsDir);
        this.errorHandler = errorHandler;
        this.socket = zeromq_1.socket('pull');
        this.socket.connect(`ipc://${socketsDir}/commands.ipc`);
        this.socket.on('message', this.handleUIMessage);
        this.socketLogs = zeromq_1.socket('push');
        this.socketLogs.bindSync(`ipc://${socketsDir}/logs.ipc`);
    }
    setupServer(config) {
        this.config = config;
        const { httpPort, httpsPort } = config.result;
        this.port = httpPort || 3000;
        this.sslPort = httpsPort || 3001;
        this.express = express_1.default();
        this.express.use(body_parser_1.default.raw({ type: '*/*' }));
        this.mountRoutes();
    }
    mountRoutes() {
        const { endpoints, projects } = this.config.entities;
        lodash_1.default.forEach(endpoints, (endpoint) => {
            const project = projects[endpoint.projectId];
            const endpointPath = '/' + project.name + endpoint.path;
            this.register(endpoint, project.name);
            this.parseEndpointResponse(endpoint, endpointPath);
            this.parseParamsEndpoint(endpoint, endpointPath);
            this.parseBodyEndpoint(endpoint, endpointPath);
        });
        // Handle non-mocked routes
        this.express.use('/', (req, res, _next) => {
            this.handleMissedRoute(req, res);
        });
    }
    parseEndpointResponse(endpoint, endpointPath) {
        if (endpoint.request.params) {
            this.endpointsResponse.set(endpoint.method + endpointPath + endpoint.request.params, endpoint.response);
        }
        else if (endpoint.request.body && !lodash_1.default.isEqual(endpoint.request.body, {})) {
            this.endpointsResponse.set(endpoint.method + endpointPath + JSON.stringify(endpoint.request.body), endpoint.response);
        }
        else {
            this.endpointsResponse.set(endpoint.method + endpointPath, endpoint.response);
        }
    }
    parseParamsEndpoint(endpoint, endpointPath) {
        const existingEndpointParams = this.endpointsParams.get(endpointPath);
        const params = existingEndpointParams && existingEndpointParams.length > 0 ? existingEndpointParams : [];
        params.push(endpoint.request.params);
        this.endpointsParams.set(endpointPath, params);
    }
    parseBodyEndpoint(endpoint, endpointPath) {
        const bodyValues = this.endpointsBody.get(endpointPath);
        const bodyArray = bodyValues && bodyValues.length > 0 ? bodyValues : [];
        bodyArray.push(endpoint.request.body);
        this.endpointsBody.set(endpointPath, bodyArray);
    }
    getAppropriateListenerFunction(method) {
        if (method === 'delete')
            return this.express.delete.bind(this.express);
        if (method === 'get')
            return this.express.get.bind(this.express);
        if (method === 'patch')
            return this.express.patch.bind(this.express);
        if (method === 'post')
            return this.express.post.bind(this.express);
        if (method === 'put')
            return this.express.put.bind(this.express);
        throw new Error('[getAppropriateListenerFunction] Unexpected API method to listen for');
    }
    sendLog(req, matched, type, statusCode, respBody) {
        const log = {
            method: req.method,
            path: req.path,
            body: req.body,
            matched,
            protocol: req.protocol,
            host: req.hostname,
            date: moment_1.default().format('YYYY/MM/DD HH:mm:ss'),
            port: parseInt(this.port.toString(), 10),
            query: req.query,
            type,
            statusCode,
            response: respBody,
        };
        this.socketLogs.send(JSON.stringify(log));
    }
    register(endpoint, scope = '') {
        const path = '/' + scope + endpoint.path;
        const method = endpoint.method.toLowerCase();
        const httpMethodListenerFunction = this.getAppropriateListenerFunction(method);
        httpMethodListenerFunction(path, (req, res) => {
            const body = path.includes('*')
                ? this.getResponseBodyByParams(path, req)
                : this.getResponseBodyByParams(req.path, req);
            if (body) {
                const responseData = {
                    requestObject: req,
                    responseObject: res,
                    statusCode: endpoint.statusCode || 200,
                    timeout: endpoint.timeout || 0,
                    responseBody: body,
                };
                this.sendResponse(responseData);
            }
            else {
                this.handleMissedRoute(req, res);
            }
        });
    }
    getResponseBodyByParams(path, req) {
        if (req.query && !lodash_1.default.isEmpty(req.query)) {
            const paramExists = this.paramsExists(this.endpointsParams.get(path), req);
            return paramExists
                ? this.endpointsResponse.get(req.method + path + this.parseQueryToString(req.query))
                : undefined;
        }
        else if (req.body && !lodash_1.default.isEmpty(req.body)) {
            const requestBody = req.body.toString('utf8');
            const bodyExists = this.bodyExists(this.endpointsBody.get(path), requestBody);
            if (bodyExists) {
                return this.isJsonString(requestBody)
                    ? this.endpointsResponse.get(req.method + path + JSON.stringify(JSON.parse(requestBody)))
                    : this.endpointsResponse.get(req.method + path + `"${requestBody}"`);
            }
            else {
                return undefined;
            }
        }
        else {
            // for requests without body or params
            return this.endpointsResponse.get(req.method + path);
        }
    }
    sendResponse(response) {
        const { responseObject, requestObject, statusCode, timeout, responseBody } = response;
        if (timeout > 0) {
            setTimeout(() => responseObject.status(statusCode).send(responseBody), timeout);
        }
        else {
            responseObject.status(statusCode).send(responseBody);
        }
        this.sendLog(requestObject, true, 1 /* REQUEST */, response.statusCode);
    }
    isJsonString(str) {
        try {
            JSON.parse(str);
        }
        catch (e) {
            return false;
        }
        return true;
    }
    bodyExists(bodyForEndpoint, requestBody) {
        let bodyExists = false;
        bodyForEndpoint.forEach((body) => {
            if (this.isJsonString(requestBody)) {
                if (lodash_1.default.isEqual(requestBody, {}) && lodash_1.default.isEqual(body, requestBody)) {
                    bodyExists = true;
                }
                else if (lodash_1.default.isEqual(body, JSON.parse(requestBody))) {
                    bodyExists = true;
                }
            }
            else {
                if (lodash_1.default.isEqual(body, requestBody)) {
                    bodyExists = true;
                }
            }
        });
        return bodyExists;
    }
    paramsExists(paramsForEndpoint, req) {
        let paramExists = false;
        if (paramsForEndpoint) {
            paramsForEndpoint.forEach((param) => {
                if (lodash_1.default.isEqual(queryParser_1.parseQuery(param), req.query)) {
                    paramExists = true;
                }
            });
        }
        return paramExists;
    }
    parseQueryToString(obj) {
        return ('?' +
            Object.keys(obj)
                .reduce((a, k) => {
                a.push(k + '=' + encodeURIComponent(obj[k]));
                return a;
            }, [])
                .join('&'));
    }
    handleMissedRoute(apiRequest, response) {
        const projectName = apiRequest.originalUrl.split('/')[1];
        const project = lodash_1.default.find(this.config.entities.projects, proj => proj.name === projectName);
        const { endpoints } = this.config.entities;
        const { projects } = this.config.entities;
        const mockedEndpoints = queryParamsMatcher_1.getMockedEndpointForQuery(projects, endpoints, apiRequest);
        if (project && project.urlPrefix && !mockedEndpoints) {
            this.forwardRequest(apiRequest, response);
        }
        else if (mockedEndpoints && mockedEndpoints.length > 0) {
            const firstMocked = mockedEndpoints[0];
            if (mockedEndpoints && mockedEndpoints.length > 1) {
                this.sendLogForMockedRequest();
            }
            mockRequestAssembler_1.sendMockedRequest(apiRequest, response, projectName, firstMocked, this.port);
        }
        else {
            this.sendLog(apiRequest, false, 2 /* RESPONSE */, 404);
            response.status(404).send('Not found');
        }
    }
    getForwardingOptions(req) {
        const [, projectName, ...localPath] = req.originalUrl.split('/');
        const project = lodash_1.default.find(this.config.entities.projects, proj => proj.name === projectName);
        const { urlPrefix } = project;
        const url = `${urlPrefix}${urlPrefix.endsWith('/') ? '' : '/'}${localPath.join('/')}`;
        const host = hostParser_1.parseHost(url);
        return {
            headers: Object.assign({}, req.headers, { host, 'accept-encoding': '' }),
            method: req.method,
            body: req.method === 'GET' ? null : req.body,
            uri: url,
        };
    }
    forwardRequest(req, responseStream) {
        const options = this.getForwardingOptions(req);
        request_1.default(options, (error, response, body) => {
            const contentEncoding = response.headers['content-encoding'];
            if (contentEncoding && contentEncoding.includes('gzip')) {
                this.forwardGzipRequest(options, req);
            }
            else {
                if (error) {
                    this.sendLog(req, false, 3 /* ERROR */, 0, error.toString());
                }
                else {
                    this.sendLog(req, true, 2 /* RESPONSE */, response && response.statusCode ? response.statusCode : 418, body.toString());
                }
            }
        }).pipe(responseStream);
    }
    forwardGzipRequest(options, req) {
        request_1.default(Object.assign({}, options, { gzip: true }), (error, response, body) => {
            if (error) {
                this.sendLog(req, false, 3 /* ERROR */, 0, error.toString());
            }
            else {
                this.sendLog(req, true, 2 /* RESPONSE */, response && response.statusCode ? response.statusCode : 418, body.toString());
            }
        });
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map