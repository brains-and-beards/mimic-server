"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMockedRequest = exports.constructURL = exports.lengthForBuffer = exports.createBuffer = void 0;
const lodash_1 = __importDefault(require("lodash"));
const request_1 = __importDefault(require("request"));
const kContentLengthKey = 'content-length';
/**
 * Converts string body to request compatible Buffer format
 * @param body string which should be converted
 * @returns the Buffer required for body parameter in HTTP requests or undefined if the body is empty
 */
exports.createBuffer = (body) => {
    if (!body || lodash_1.default.isEmpty(body)) {
        return undefined;
    }
    return Buffer.from(JSON.stringify(body));
};
/**
 * Calculates the length for request's Buffer in bytes using gzip format
 * @param method method of the new requests
 * @param body parameter in string format
 * @returns the size of the Buffer or 0 if the Buffer is empty
 */
exports.lengthForBuffer = (method, body) => {
    if (method.toUpperCase() === 'GET' || method.toUpperCase() === 'DELETE' || lodash_1.default.isEmpty(body)) {
        return 0;
    }
    return Buffer.byteLength(JSON.stringify(body), 'gzip');
};
/**
 * Creates URL to mocked endpoint after checking iaf the query params are matching
 * @param apiRequest original request
 * @param mockedEndpoint the mocked endpoint to forward the new request to
 * @param port port number of our mock server
 * @param projectName name of the matching project
 * @returns the new URL which point to our mocked endpoint
 */
exports.constructURL = (apiRequest, mockedEndpoint, port, projectName) => {
    const protocol = apiRequest.protocol;
    const hostName = apiRequest.hostname;
    const path = mockedEndpoint.path;
    const params = mockedEndpoint.request.params || '';
    return `${protocol}://${hostName}:${port}/${projectName}${path}${params}`;
};
/**
 * Creates the actual request to our mocked endpoint
 * @param headers headers of the new requests
 * @param method method of the new requests
 * @param buffer http body converted to Buffer
 * @param uri the path to forward the request to
 * @returns the size of the Buffer
 */
const constructRequest = (headers, method, uri, buffer) => {
    return {
        headers,
        method,
        body: method === 'GET' ? null : buffer,
        uri,
    };
};
/**
 * Forwards the request to the selected mocked endpoint if query params are matching
 * @param apiRequest original request
 * @param response original response
 * @param projectName name of the matching project
 * @param mockedEndpoint the mocked endpoint to forward the new request to
 * @param port port number of our mock server
 * @returns the new request which points to the mocked endpoint
 */
exports.sendMockedRequest = (apiRequest, response, projectName, mockedEndpoint, port) => {
    const constructedURL = exports.constructURL(apiRequest, mockedEndpoint, port, projectName);
    const buffer = exports.createBuffer(mockedEndpoint.request.body);
    const bufferLength = exports.lengthForBuffer(apiRequest.method, mockedEndpoint.request.body);
    const headers = apiRequest.headers;
    headers[kContentLengthKey] = String(bufferLength);
    const constructedRequest = constructRequest(headers, apiRequest.method, constructedURL, buffer);
    request_1.default(constructedRequest).pipe(response);
};
//# sourceMappingURL=mockRequestAssembler.js.map