"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQuery = (queryString) => {
    if (queryString.length > 0) {
        const query = {};
        const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
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
//# sourceMappingURL=query-parser.js.map