#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const package_json_1 = __importDefault(require("../package.json"));
const server_1 = __importDefault(require("./server"));
commander_1.default
    .version(package_json_1.default.version, '-v, --version')
    .option('-c, --config <path>', 'Path to config file')
    .parse(process.argv);
const { config } = commander_1.default;
// eslint-disable-next-line no-console
const server = new server_1.default(config, (error) => console.error(error), true);
server.run();
//# sourceMappingURL=runner.js.map