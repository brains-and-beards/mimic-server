class ErrorHandler {
  onError: (code?: number) => void;

  constructor(onError?: (code?: number) => void) {
    this.onError = onError || ((code?: number) => process.exit(code));
  }

  checkErrorAndStopProcess = (error: any) => {
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
}

export default ErrorHandler;
