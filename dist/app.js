"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-console */
const express_1 = __importDefault(require("express"));
const lodash_1 = __importDefault(require("lodash"));
const zeromq_1 = require("zeromq");
const moment_1 = __importDefault(require("moment"));
class App {
    constructor(config) {
        this.port = process.env.PORT || 3000; // TODO: get port from the config file
        this.isListening = () => {
            return this.httpServer ? this.httpServer.listening : false;
        };
        this.stop = (callback) => {
            if (this.httpServer) {
                this.httpServer.close((error) => {
                    if (!error) {
                        const logObject = {
                            type: 0 /* SERVER */,
                            message: 'STOP',
                            date: moment_1.default().format('YYYY/MM/DD HH:mm:ss'),
                            matched: true,
                        };
                        this.socketLogs.send(JSON.stringify(logObject));
                        this.socket.send(0 /* STOP */);
                    }
                    callback(error);
                });
            }
        };
        this.start = (callback) => {
            this.httpServer = this.express.listen(this.port, (error) => {
                console.log('​App -> start -> this.port', this.port);
                if (!error) {
                    const logObject = {
                        type: 0 /* SERVER */,
                        message: 'RESTART',
                        date: moment_1.default().format('YYYY/MM/DD HH:mm:ss'),
                        matched: true,
                    };
                    this.socketLogs.send(JSON.stringify(logObject));
                    this.socket.send(1 /* RESTART */);
                }
                callback(error);
            });
        };
        this.restart = (callback) => {
            console.log('​App -> restart -> restart', 'restart');
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
        // tslint:disable-next-line:no-empty
        this.handleUIMessageLogs = (message) => { };
        this.handleError = (error) => {
            if (!error)
                return;
            console.log('Sending error', error);
            this.socket.send(`${2 /* ERROR */}${error}`);
            const logObject = {
                type: 0 /* SERVER */,
                message: `ERROR ${error}`,
                matched: true,
                date: moment_1.default().format('YYYY/MM/DD HH:mm:ss'),
            };
            this.socketLogs.send(JSON.stringify(logObject));
        };
        this.config = config;
        this.express = express_1.default();
        this.mountRoutes();
        this.socket = zeromq_1.socket('rep');
        this.socket.connect('ipc://server_commands.ipc');
        this.socketLogs = zeromq_1.socket('req');
        this.socketLogs.connect('ipc://logs.ips');
        this.socketLogs.on('message', this.handleUIMessageLogs);
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
        console.log('​App -> method', method);
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
            console.log('​App -> response', response);
            if (timeout > 0) {
                setTimeout(() => res.status(statusCode).send(response), timeout);
            }
            else {
                res.send(response);
            }
        });
    }
    substituteParams(resp, params) {
        console.log('​App -> resp', resp);
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
            const statusCode = 404; // TODO: Change it
            const logObject = {
                method: req.method,
                path: req.path,
                body: req.body,
                matched: true,
                protocol: req.protocol,
                host: req.hostname,
                date: moment_1.default().format('YYYY/MM/DD HH:mm:ss'),
                port: parseInt(this.port.toString(), 10),
                statusCode,
                query: req.query,
                type: 1 /* REQUEST */,
            };
            const response = this.handleUnmocked(req, logObject);
            res.status(404).send(response);
        });
    }
    handleUnmocked(req, log) {
        // TODO: Log an unmocked request
        this.socketLogs.send(JSON.stringify(log));
        // TODO: return a forwarded response from the real API server
        return 'TODO: get a response from the origin API';
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map