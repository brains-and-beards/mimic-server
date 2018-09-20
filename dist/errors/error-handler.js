"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ErrorHandler {
    static checkErrorAndStopProcess(error) {
        if (error.code && error.code === 'ENOENT' && error.path && error.path.indexOf('apimocker.json')) {
            console.error('Error - code 20 - config file is not present');
            process.exit(20);
        }
        if (error instanceof SyntaxError) {
            console.error('Error - code 21 - error during config file parsing');
            process.exit(21);
        }
        if (error.code && error.code === 'EADDRINUSE' && error.port) {
            console.error('Error - code 22 - Server address/port is already used by another process - port = ' + error.port);
            process.exit(22);
        }
        // unhandled error - show raw error message and exit
        console.error(error);
        process.exit();
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=error-handler.js.map