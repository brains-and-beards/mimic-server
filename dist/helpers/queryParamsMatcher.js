"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const queryParser_1 = require("./queryParser");
/**
 * This method extracts the path from the current request URL.
 * @param url url of the requests
 * @returns the path extracted from url
 */
exports.extractPathForURL = (url) => {
    const projectName = url.split('/')[1];
    // Remove query parameters from url
    const requestEndpoint = url.split('?')[0];
    // The url for parsing the endpoint will be $/{projectName}/endpoint, so we have to remove the projectName from the beginning of the url
    return requestEndpoint.replace(`/${projectName}`, '');
};
/**
 * A project contains the IDs of the related endpoints, this function filters the endpoint objects based on those IDs
 * @param project The projects with the endpoint ID list
 * @returns the endpoints of the given project or null if no endpoints are available
 */
exports.endpointsInProject = (endpoints, project) => {
    if (!endpoints || !project || !project.endpoints) {
        return null;
    }
    const selectedEndpoints = [];
    // Endpoints are stored in dictionaries where the endpoint ID is the key
    const keys = Object.keys(endpoints);
    for (const currentKey of keys) {
        // Checking if the endpoint present in the project
        const endpoint = lodash_1.default.find(project.endpoints, endp => endp === currentKey);
        if (endpoint) {
            const currentValue = endpoints[currentKey];
            selectedEndpoints.push(currentValue);
        }
    }
    return selectedEndpoints;
};
/**
 * Compares the keys and values of the requests params with the mocked endpoint's params.
 * @param currentEndpointParams query params of the endpoint
 * @param requestQuery query params of the request
 * @returns true if all the parameters that are present in the mocked endpoint present in the request
 */
exports.findQueryMatches = (currentEndpointParams, requestQuery) => {
    const parsed = queryParser_1.parseQuery(currentEndpointParams);
    const parsedKeys = Object.keys(parsed);
    const requestQueryKeys = Object.keys(requestQuery);
    let match = true;
    for (const currentKey of parsedKeys) {
        if (requestQueryKeys.includes(currentKey)) {
            const currentValue = parsed[currentKey];
            const valueInRequest = requestQuery[currentKey];
            if (currentValue.toString() !== valueInRequest.toString()) {
                match = false;
            }
        }
        else {
            match = false;
        }
    }
    return match;
};
/**
 * If all the parameters that are present in the mocked endpoint present in the request too we should use
 * the mocked endpoint even if the request has some additional parameters
 * @param projects all projects from config file, the current projected based on the request should be selected.
 * @param endpoints all endpoints from config file, the current endpoint based on the request should be selected.
 * @param apiRequest we're checking if can be mocked
 * @returns matching endpoints or null if no endpoints are available
 */
exports.getMockedEndpointForQuery = (projects, endpoints, apiRequest) => {
    const projectName = apiRequest.originalUrl.split('/')[1];
    const requestPath = exports.extractPathForURL(apiRequest.originalUrl);
    const requestMethod = apiRequest.method;
    const project = lodash_1.default.find(projects, proj => proj.name === projectName);
    const projectEndpoints = exports.endpointsInProject(endpoints, project);
    if (!projectEndpoints) {
        return [];
    }
    const matches = [];
    for (const currentEndpoint of projectEndpoints) {
        if (currentEndpoint.enable) {
            const currentPath = currentEndpoint.path;
            const currentMethod = currentEndpoint.method;
            // If path, method or body doesn't match go to next endpoint
            if (currentPath !== requestPath || currentMethod !== requestMethod) {
                continue;
            }
            if (exports.findQueryMatches(currentEndpoint.request.params, apiRequest.query)) {
                matches.push(currentEndpoint);
            }
        }
    }
    return matches;
};
//# sourceMappingURL=queryParamsMatcher.js.map