"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHost = void 0;
// https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
const extractHostname = (url) => {
    let hostname;
    if (url.indexOf('//') > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }
    hostname = hostname.split(':')[0];
    hostname = hostname.split('?')[0];
    return hostname;
};
exports.parseHost = (url) => {
    return extractHostname(url);
};
//# sourceMappingURL=hostParser.js.map