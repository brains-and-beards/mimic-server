#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const server_1 = __importDefault(require("./server"));
commander_1.default.option('-c, --config <path>', 'Path to config file').parse(process.argv);
const { config } = commander_1.default;
const server = new server_1.default(config);
server.run();
//# sourceMappingURL=runner.js.map