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
const error_handler_1 = require("./errors/error-handler");
class App {
    constructor() {
        this.config = {
            entities: { endpoints: [], projects: [] },
            result: { httpPort: 3000, httpsPort: 3001 },
        };
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
                error_handler_1.ErrorHandler.checkErrorAndStopProcess(error);
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
        this.setupServer(this.config);
        this.socket = zeromq_1.socket('pull');
        this.socket.connect('ipc:///tmp/apimocker_server/commands.ipc');
        this.socket.on('message', this.handleUIMessage);
        this.socketLogs = zeromq_1.socket('push');
        this.socketLogs.bindSync('ipc:///tmp/apimocker_server/logs.ipc');
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
            this.register(endpoint, project.name);
        });
        this.addMissedRouteHandler();
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
        const statusCode = endpoint.statusCode || 200;
        const timeout = endpoint.timeout || 0;
        const httpMethodListenerFunction = this.getAppropriateListenerFunction(method);
        httpMethodListenerFunction(path, (req, res) => {
            const response = res.status(statusCode);
            if (timeout > 0) {
                setTimeout(() => response.send(endpoint.response), timeout);
            }
            else {
                response.send(endpoint.response);
            }
            this.sendLog(req, true, 1 /* REQUEST */, statusCode);
        });
    }
    addMissedRouteHandler() {
        this.express.use('/', (req, res, next) => {
            const projectName = req.originalUrl.split('/')[1];
            const project = lodash_1.default.find(this.config.entities.projects, proj => proj.name === projectName);
            if (project && project.fallbackUrlPrefix && project.fallbackUrlPrefix.domain) {
                const response = this.forwardRequest(req, res);
            }
            else {
                this.sendLog(req, false, 2 /* RESPONSE */, 404);
                res.status(404).send('Not found');
            }
        });
    }
    getForwardingOptions(req) {
        const [_unused, projectName, ...localPath] = req.originalUrl.split('/');
        const project = lodash_1.default.find(this.config.entities.projects, proj => proj.name === projectName);
        const { domain, path, port } = project.fallbackUrlPrefix;
        const portInfo = port ? `:${port}` : '';
        const url = `http://${domain}${portInfo}${path}/${localPath.join('/')}`;
        return {
            headers: Object.assign({}, req.headers, { host: domain }),
            method: req.method,
            body: req.method === 'GET' ? null : req.body,
            url,
        };
    }
    forwardRequest(req, responseStream) {
        const options = this.getForwardingOptions(req);
        request_1.default(options, (error, response, body) => {
            if (error) {
                this.sendLog(req, false, 3 /* ERROR */, 0, error.toString());
            }
            else {
                this.sendLog(req, true, 2 /* RESPONSE */, response && response.statusCode ? response.statusCode : 418, body);
            }
        }).pipe(responseStream);
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map