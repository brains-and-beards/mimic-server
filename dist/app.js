"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-console */
const express_1 = __importDefault(require("express"));
const lodash_1 = __importDefault(require("lodash"));
class App {
    constructor(config) {
        this.port = process.env.PORT || 3000; // TODO: get port from the config file
        this.isListening = () => {
            return this.httpServer ? this.httpServer.listening : false;
        };
        this.stop = (callback) => {
            if (this.httpServer) {
                this.httpServer.close((error) => {
                    callback(error);
                });
            }
        };
        this.start = (callback) => {
            this.httpServer = this.express.listen(this.port, (error) => {
                callback(error);
            });
        };
        this.config = config;
        this.express = express_1.default();
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
            const response = this.handleUnmocked(req);
            res.status(404).send(response);
        });
    }
    handleUnmocked(req) {
        console.log('This URL is not mocked, TODO: forward it');
        // TODO: Log an unmocked request
        // TODO: return a forwarded response from the real API server
        return 'TODO: get a response from the origin API';
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map