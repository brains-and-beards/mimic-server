"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
/**
 * This method extracts the project name from the query string.
 * @param query url of the request
 * @returns a string containing the extracted project name
 */
exports.getNameFromQuery = (query) => query.split('/')[1];
/**
 * This method finds the project that matches the request.
 * @param projects a list of projects that we're trying to match against
 * @param query url of the request
 * @returns an IProject object that was found, or undefined
 */
exports.findProject = (projects, queryUrl) => {
    const projectName = exports.getNameFromQuery(queryUrl);
    return lodash_1.default.find(projects, proj => proj.name === projectName);
};
//# sourceMappingURL=QueryResolver.js.map