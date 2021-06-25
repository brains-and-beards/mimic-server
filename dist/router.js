"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lodash_1 = __importDefault(require("lodash"));
const moment_1 = __importDefault(require("moment"));
const request_1 = __importDefault(require("request"));
const hostParser_1 = require("./helpers/hostParser");
const mockRequestAssembler_1 = require("./helpers/mockRequestAssembler");
const queryParamsMatcher_1 = require("./helpers/queryParamsMatcher");
const queryParser_1 = require("./helpers/queryParser");
class Router {
    constructor({ config, loggingFunction, port, }) {
        this.config = {
            entities: { endpoints: [], projects: [] },
            result: { httpPort: 3000, httpsPort: 3001 },
        };
        this.endpointsParams = new Map();
        this.endpointsBody = new Map();
        this.endpointsResponse = new Map();
        this.sendLogForMockedRequest = () => {
            const logObject = {
                type: 0 /* SERVER */,
                message: 'WARNING - Multiple mocked endpoints found',
                date: moment_1.default().format('YYYY/MM/DD HH:mm:ss'),
                matched: true,
                isWarning: true,
            };
            this.logMessage(logObject);
        };
        this.config = config;
        this.logMessage = loggingFunction;
        this.port = port;
        this.router = express_1.Router();
        this.mountRoutes();
    }
    getExpressRouter() {
        return this.router;
    }
    mountRoutes() {
        const { endpoints, projects } = this.config.entities;
        lodash_1.default.forEach(endpoints, (endpoint) => {
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
        this.router.use('/', (req, res, _next) => {
            this.handleMissedRoute(req, res);
        });
    }
    parseEndpointResponse(endpoint, endpointPath) {
        let key = endpoint.method + endpointPath;
        if (endpoint.request.params && endpoint.request.params !== '?')
            key += endpoint.request.params;
        if (endpoint.request.body && !lodash_1.default.isEqual(endpoint.request.body, {}))
            key += JSON.stringify(endpoint.request.body);
        this.endpointsResponse.set(key, endpoint.response);
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
            return this.router.delete.bind(this.router);
        if (method === 'get')
            return this.router.get.bind(this.router);
        if (method === 'patch')
            return this.router.patch.bind(this.router);
        if (method === 'post')
            return this.router.post.bind(this.router);
        if (method === 'put')
            return this.router.put.bind(this.router);
        throw new Error('[getAppropriateListenerFunction] Unexpected API method to listen for');
    }
    logRequest(req, matched, type, statusCode, respBody) {
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
        this.logMessage(log);
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
        this.logRequest(requestObject, true, 1 /* REQUEST */, response.statusCode);
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
            else if (lodash_1.default.isEqual(body, requestBody))
                bodyExists = true;
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
        const keys = Object.keys(obj);
        return keys.length === 0
            ? ''
            : '?' +
                keys
                    .reduce((a, k) => {
                    a.push(k + '=' + encodeURIComponent(obj[k]));
                    return a;
                }, [])
                    .join('&');
    }
    handleMissedRoute(apiRequest, response) {
        const projectName = apiRequest.originalUrl.split('/')[1];
        const project = lodash_1.default.find(this.config.entities.projects, (proj) => proj.slug === projectName);
        const { endpoints } = this.config.entities;
        const { projects } = this.config.entities;
        const mockedEndpoints = queryParamsMatcher_1.getMockedEndpointForQuery(projects, endpoints, apiRequest);
        if (project && project.urlPrefix && mockedEndpoints.length === 0) {
            this.forwardRequest(apiRequest, response);
        }
        else if (mockedEndpoints.length > 0) {
            const firstMocked = mockedEndpoints[0];
            if (mockedEndpoints.length > 1) {
                this.sendLogForMockedRequest();
            }
            mockRequestAssembler_1.sendMockedRequest(apiRequest, response, projectName, firstMocked, this.port);
        }
        else {
            this.logRequest(apiRequest, false, 2 /* RESPONSE */, 404);
            response.status(404).send(project ? `URL endpoint not found` : `Project "${projectName}" not found`);
        }
    }
    getForwardingOptions(req) {
        const [, projectName, ...localPath] = req.originalUrl.split('/');
        const project = lodash_1.default.find(this.config.entities.projects, (proj) => proj.slug === projectName);
        const { urlPrefix } = project;
        const url = `${urlPrefix}${urlPrefix.endsWith('/') ? '' : '/'}${localPath.join('/')}`;
        const host = hostParser_1.parseHost(url);
        return {
            headers: Object.assign(Object.assign({}, req.headers), { host, 'accept-encoding': '' }),
            method: req.method,
            body: req.method === 'GET' ? null : req.body,
            uri: url,
            rejectUnauthorized: false,
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
                    this.logRequest(req, false, 3 /* ERROR */, 0, error.toString());
                }
                else {
                    this.logRequest(req, true, 2 /* RESPONSE */, response && response.statusCode ? response.statusCode : 418, body.toString());
                }
            }
        }).pipe(responseStream);
    }
    forwardGzipRequest(options, req) {
        request_1.default(Object.assign(Object.assign({}, options), { gzip: true }), (error, response, body) => {
            if (error) {
                this.logRequest(req, false, 3 /* ERROR */, 0, error.toString());
            }
            else {
                this.logRequest(req, true, 2 /* RESPONSE */, response && response.statusCode ? response.statusCode : 418, body.toString());
            }
        });
    }
}
exports.default = Router;
//# sourceMappingURL=router.js.map