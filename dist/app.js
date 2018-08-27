"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-console */
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const lodash_1 = __importDefault(require("lodash"));
const zeromq_1 = require("zeromq");
const request_1 = __importDefault(require("request"));
class App {
    constructor(config) {
        this.port = process.env.PORT || 3000; // TODO: get port from the config file
        this.isListening = () => {
            return this.httpServer ? this.httpServer.listening : false;
        };
        this.stop = (callback) => {
            if (this.httpServer) {
                this.httpServer.close((error) => {
                    if (!error)
                        this.socket.send(0 /* STOP */);
                    callback(error);
                });
            }
        };
        this.start = (callback) => {
            this.httpServer = this.express.listen(this.port, (error) => {
                if (!error)
                    this.socket.send(1 /* RESTART */);
                callback(error);
            });
        };
        this.restart = (callback) => {
            if (this.httpServer)
                this.stop(() => this.start(this.handleError));
            else
                this.start(this.handleError);
        };
        this.handleUIMessage = (message) => {
            const messageCode = Number(message.toString());
            console.log('Received message', message, messageCode);
            switch (messageCode) {
                case 0 /* STOP */:
                    return this.stop(this.handleError);
                case 1 /* RESTART */:
                    return this.restart(this.handleError);
                default:
            }
        };
        this.handleError = (error) => {
            if (!error)
                return;
            console.log('Sending error', error);
            this.socket.send(`${2 /* ERROR */}${error}`);
        };
        this.config = config;
        this.express = express_1.default();
        this.express.use(body_parser_1.default.raw({ type: '*/*' }));
        this.mountRoutes();
        this.socket = zeromq_1.socket('rep');
        this.socket.connect('ipc://server_commands.ipc');
        this.socket.on('message', this.handleUIMessage);
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
            return this.express.get.bind(this.express);
        if (method === 'get')
            return this.express.get.bind(this.express);
        if (method === 'patch')
            return this.express.get.bind(this.express);
        if (method === 'post')
            return this.express.get.bind(this.express);
        if (method === 'put')
            return this.express.get.bind(this.express);
        throw new Error('[getAppropriateListenerFunction] Unexpected API method to listen for');
    }
    register(endpoint, scope = '') {
        const path = '/' + scope + endpoint.path;
        const method = endpoint.method.toLowerCase();
        const statusCode = endpoint.statusCode || 200;
        const timeout = endpoint.timeout || 0;
        const httpMethodListenerFunction = this.getAppropriateListenerFunction(method);
        httpMethodListenerFunction(path, (req, res) => {
            const response = this.substituteParams(endpoint.response, req.params);
            if (timeout > 0) {
                setTimeout(() => res.status(statusCode).send(response), timeout);
            }
            else {
                res.send(response);
            }
        });
    }
    substituteParams(resp, params) {
        for (const i in resp) {
            // Check nested objects recursively
            if (typeof resp[i] === 'object') {
                resp[i] = this.substituteParams(resp[i], params);
            }
            else if (typeof resp[i] === 'string' && resp[i][0] === ':') {
                // If value starts with a colon, substitute it with param value
                const paramName = resp[i].slice(1);
                resp[i] = params[paramName];
            }
        }
        return resp;
    }
    addMissedRouteHandler() {
        this.express.use('/', (req, res, next) => {
            const response = this.forwardRequest(req, res);
        });
    }
    getForwardingOptions(req) {
        const [_unused, projectName, ...localPath] = req.originalUrl.split('/');
        const project = lodash_1.default.find(this.config.entities.projects, proj => proj.name === projectName);
        const { domain, path, port } = project.fallbackUrlPrefix;
        return {
            headers: Object.assign({}, req.headers, { host: domain }),
            method: req.method,
            body: req.body,
            url: `http://${domain}:${port}${path}/${localPath.join('/')}`,
        };
    }
    forwardRequest(req, responseStream) {
        const options = this.getForwardingOptions(req);
        request_1.default(options)
            .on('response', response => {
            // TODO Log the response
        })
            .pipe(responseStream);
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map