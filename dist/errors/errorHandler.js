"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
class ErrorHandler {
    constructor(onError) {
        this.checkErrorAndStopProcess = (error) => {
            let code;
            if (error.code && error.code === 'ENOENT' && error.path && error.path.indexOf('apimocker.json')) {
                console.error('Error - code 20 - config file is not present');
                code = 20;
            }
            if (error instanceof SyntaxError) {
                console.error('Error - code 21 - error during config file parsing');
                code = 21;
            }
            if (error.code && error.code === 'EADDRINUSE' && error.port) {
                console.error('Error - code 22 - Server address/port is already used by another process - port = ' + error.port);
                code = 22;
            }
            this.onError(code);
        };
        this.onError = onError || ((code) => process.exit(code));
    }
}
exports.default = ErrorHandler;
//# sourceMappingURL=errorHandler.js.map