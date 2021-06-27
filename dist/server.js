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
/* eslint-disable no-console */
const fs_1 = __importDefault(require("fs"));
const normalizr_1 = require("normalizr");
const util_1 = require("util");
const app_1 = __importDefault(require("./app"));
const errorHandler_1 = __importDefault(require("./errors/errorHandler"));
const DataSchema_1 = require("./Models/DataSchema");
class Server {
    constructor(filename, handleErrors, useZeroMQ = false) {
        this.readFileAsync = util_1.promisify(fs_1.default.readFile);
        this.run = () => __awaiter(this, void 0, void 0, function* () {
            this.watchConfigForChanges(this.configFilePath);
            yield this.readAndStart();
        });
        this.stopServer = (callback) => {
            this.unwatchConfigForChanges(this.configFilePath);
            if (this.app) {
                return this.app.stop((error) => {
                    if (error) {
                        console.error(error);
                    }
                    else {
                        if (callback)
                            callback();
                    }
                });
            }
            else {
                // eslint-disable-next-line no-console
                console.error('[server] No server to stop, weird!');
                return Promise.resolve(true);
            }
        };
        this.stopServerSync = (callback) => {
            this.unwatchConfigForChanges(this.configFilePath);
            if (this.app) {
                return this.app.stopSync((error) => {
                    if (error) {
                        console.error(error);
                    }
                    else {
                        if (callback)
                            callback();
                    }
                });
            }
            else {
                // eslint-disable-next-line no-console
                console.error('[server] No server to stop, weird!');
                return Promise.resolve(true);
            }
        };
        this.switchConfig = (config) => {
            this.app.switchConfig(this.parseConfig(config));
        };
        this.watchConfigForChanges = (configPath) => {
            fs_1.default.watchFile(configPath, () => {
                console.log('-----------------------------------------');
                console.log(configPath + ' changed');
                this.readAndStart();
            });
        };
        this.unwatchConfigForChanges = (configPath) => {
            fs_1.default.unwatchFile(configPath);
        };
        this.parseConfig = (configData) => {
            const normalizedData = normalizr_1.normalize(configData, DataSchema_1.ConfigSchema);
            return normalizedData;
        };
        this.readAndStart = () => __awaiter(this, void 0, void 0, function* () {
            return this.readFile(this.configFilePath)
                .then((json) => {
                const config = this.parseConfig(json);
                this.restartServer(config);
            })
                .catch((error) => {
                this.errorHandler.checkErrorAndStopProcess(error);
                this.stopServer();
            });
        });
        this.restartServer = (config) => {
            if (this.app.isListening()) {
                this.stopServer(() => this._startServer(config));
            }
            else {
                this._startServer(config);
            }
        };
        this._startServer = (config) => {
            this.app.setupServer(config);
            this.app.start((error) => {
                if (error) {
                    return console.error(error);
                }
                return console.log(`server is listening`);
            });
        };
        const runningInTest = process.env.NODE_ENV === 'test';
        this.errorHandler = new errorHandler_1.default(handleErrors);
        this.app = new app_1.default(this.errorHandler, runningInTest ? false : useZeroMQ);
        if (!filename) {
            runningInTest ? (this.configFilePath = './testmocker.json') : (this.configFilePath = './apimocker.json');
        }
        else {
            this.configFilePath = filename;
        }
        console.log('Reading config file from: ' + this.configFilePath);
    }
    readFile(configPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.readFileAsync(configPath, { encoding: 'utf-8' });
            const parsed = JSON.parse(data);
            const externals = [];
            if (parsed.importedConfigurations) {
                for (const item of parsed.importedConfigurations) {
                    const external = yield this.readFileAsync(item.path, { encoding: 'utf-8' });
                    const parsedExternal = JSON.parse(external);
                    externals.push(...parsedExternal.projects);
                }
                if (parsed && parsed.projects) {
                    parsed.projects.push(...externals);
                }
            }
            return parsed;
        });
    }
}
exports.default = Server;
//# sourceMappingURL=server.js.map