"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:no-console */
const fs_1 = __importDefault(require("fs"));
const normalizr_1 = require("normalizr");
const util_1 = require("util");
const app_1 = __importDefault(require("./app"));
const DataSchema_1 = require("./Models/DataSchema");
class Server {
    constructor(filename) {
        this.readFileAsync = util_1.promisify(fs_1.default.readFile);
        this.run = (wait = false) => {
            this.wait = wait;
            console.log('Starting run');
            this.watchConfigForChanges(this.configFilePath);
            this.readAndStart();
        };
        this.watchConfigForChanges = (configPath) => {
            fs_1.default.watchFile(configPath, () => {
                console.log('-----------------------------------------');
                console.log(configPath + ' changed');
                this.readAndStart();
            });
        };
        this.parseConfig = (configData) => {
            const normalizedData = normalizr_1.normalize(configData, DataSchema_1.ConfigSchema);
            return normalizedData;
        };
        this.readAndStart = () => {
            this.readFile(this.configFilePath)
                .then(json => {
                const config = this.parseConfig(json);
                this.startServer(config);
            })
                .catch(error => {
                console.error(error);
            });
        };
        this.startServer = (config) => {
            if (this.app && this.app.isListening()) {
                this.app.stop(error => {
                    if (error) {
                        console.error(error);
                    }
                    else {
                        console.log('close');
                        this._startServer(config);
                    }
                });
            }
            else {
                this._startServer(config);
            }
        };
        this._startServer = (config) => {
            this.app = new app_1.default(config);
            if (!this.wait)
                this.app.start(error => {
                    if (error) {
                        return console.error(error);
                    }
                    return console.log(`server is listening`);
                });
        };
        if (!filename) {
            this.configFilePath = './apimocker.json';
        }
        else {
            this.configFilePath = filename;
        }
        console.log('Reading config file from: ' + this.configFilePath);
    }
    readFile(configPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.readFileAsync(configPath, { encoding: 'utf-8' });
            return JSON.parse(data);
        });
    }
}
exports.default = Server;
//# sourceMappingURL=server.js.map