"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQuery = void 0;
exports.parseQuery = (queryString) => {
    const massagedQueryString = queryString[0] === '?' ? queryString.substr(1) : queryString;
    if (massagedQueryString.length > 0) {
        const query = {};
        const pairs = massagedQueryString.split('&');
        for (const item of pairs) {
            const pair = item.split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return query;
    }
    else {
        return {};
    }
};
//# sourceMappingURL=queryParser.js.map