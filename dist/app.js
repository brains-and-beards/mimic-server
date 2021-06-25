"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const moment_1 = __importDefault(require("moment"));
const router_1 = __importDefault(require("./router"));
// We need a global router object to be able to dynamically switch config
let router;
class App {
    constructor(errorHandler, useZeroMQ = false) {
        this.config = {
            entities: { endpoints: [], projects: [] },
            result: { httpPort: 3000, httpsPort: 3001 },
        };
        this.isListening = () => {
            return this.httpServer ? this.httpServer.listening : false;
        };
        this.stop = (callback) => {
            const afterStop = (error) => {
                if (!error)
                    this.logServerClose();
                callback(error);
            };
            if (this.httpServer)
                this.httpServer.close(afterStop);
            // Currently we don't fully support (nor need) SSL, so we only stop one server
            // if (this.sslServer) this.sslServer.close(afterStop);
        };
        // Like stop, but make a loop where we sleep 500ms and check whether the server emitted the 'close' event to be sure it's finished.
        // Then we resolve the promise and hand back the control
        this.stopSync = (callback) => __awaiter(this, void 0, void 0, function* () {
            const afterStop = (error) => {
                if (!error)
                    this.logServerClose();
                callback(error);
            };
            if (this.httpServer) {
                let isServerClosed = false;
                this.httpServer.once("close", () => {
                    isServerClosed = true;
                });
                this.httpServer.close(afterStop);
                while (!isServerClosed) {
                    yield sleep(500);
                }
                return true;
            }
            else {
                // eslint-disable-next-line no-console
                console.error("[app > stop-sync] No server to stop, weird!");
                return Promise.resolve(true);
            }
            // Currently we don't fully support (nor need) SSL, so we only stop one server
            // if (this.sslServer) this.sslServer.close(afterStop);
        });
        this.start = (callback) => {
            const afterStart = (error) => {
                if (!error)
                    callback(error);
            };
            this.httpServer = http_1.default.createServer(this.express);
            this.httpServer.listen(this.port, afterStart).on("error", (error) => {
                this.errorHandler.checkErrorAndStopProcess(error);
            });
            // if (fs.existsSync('./localhost.key') && fs.existsSync('./localhost.crt')) {
            // const sslOptions = {
            //   key: fs.readFileSync('./localhost.key'),
            //   cert: fs.readFileSync('./localhost.crt'),
            // };
            // TODO: We should get proper Android support before we launch SSL support
            // this.sslServer = HTTPS.createServer(sslOptions, this.express).listen(this.sslPort, afterStart);
            // }
        };
        this.switchConfig = (config) => {
            router = new router_1.default({
                config,
                loggingFunction: this.logMessage,
                port: this.port,
            }).getExpressRouter();
        };
        this.logServerClose = () => {
            this.logMessage({
                type: 0 /* SERVER */,
                message: "START",
                date: moment_1.default().format("YYYY/MM/DD HH:mm:ss"),
                matched: true,
            });
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
            this.logMessage({
                type: 0 /* SERVER */,
                message: `ERROR ${error}`,
                matched: true,
                date: moment_1.default().format("YYYY/MM/DD HH:mm:ss"),
            });
        };
        this.setupServer(this.config);
        const socketsDir = "/tmp/apimocker_server";
        if (!fs_1.default.existsSync(socketsDir))
            fs_1.default.mkdirSync(socketsDir);
        this.errorHandler = errorHandler;
        if (useZeroMQ) {
            const ZeroMQ = require("zeromq");
            this.socket = ZeroMQ.socket("pull");
            this.socket.connect(`ipc://${socketsDir}/commands.ipc`);
            this.socket.on("message", this.handleUIMessage);
            this.socketLogs = ZeroMQ.socket("push");
            this.socketLogs.bindSync(`ipc://${socketsDir}/logs.ipc`);
        }
    }
    setupServer(config) {
        this.config = config;
        const { httpPort, httpsPort } = config.result;
        this.port = httpPort || 3000;
        this.sslPort = httpsPort || 3001;
        this.express = express_1.default();
        this.express.use(body_parser_1.default.raw({ type: "*/*" }));
        router = new router_1.default({
            config,
            loggingFunction: this.logMessage,
            port: this.port,
        }).getExpressRouter();
        this.express.use(function replaceableRouter(req, res, next) {
            router(req, res, next);
        });
    }
    logMessage(logObject) {
        const payload = JSON.stringify(logObject);
        const loggingMethod = this.socketLogs ? this.socketLogs.send : console.log;
        return loggingMethod(payload);
    }
}
function sleep(miliseconds) {
    const sleepPromise = new Promise((resolve, _reject) => setTimeout(() => resolve(), miliseconds));
    return sleepPromise;
}
exports.default = App;
//# sourceMappingURL=app.js.map