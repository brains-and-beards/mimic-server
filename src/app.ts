/* tslint:disable:no-console */
import express from 'express';
import HTTP from 'http';
import Proxy from 'proxy';

class App {
  port = process.env.PORT || 3000; // TODO: get port from the config file
  private express: express.Express;
  private config: IConfig;
  private httpServer?: HTTP.Server;
  private proxyServer?: any;

  constructor(config: IConfig) {
    this.config = config;
    this.express = express();
    this.mountRoutes();
  }

  isListening = (): boolean => {
    return this.httpServer ? this.httpServer.listening : false;
  };

  stop = (callback: ((error: Error) => void)) => {
    if (this.httpServer) {
      this.httpServer.close((error: Error) => {
        callback(error);
      });
    }
    // TODO: stop proxy server
  };

  start = (callback: ((error: Error) => void)) => {
    this.httpServer = this.express.listen(this.port, (error: Error) => {
      callback(error);
    });

    this.proxyServer = Proxy(HTTP.createServer());

    this.proxyServer.listen(3128, function() {
      console.log('HTTP(s) proxy server listening on port %d', this.address().port);
    });
    this.proxyServer.on('proxyRequest', function(req: any) {
      console.log('Handling a request before it happens, like a boss', req.url);
      req.url = 'http://localhost:/';
    });
  };

  private mountRoutes(): void {
    const router = express.Router();
    router.get('/', (req: any, res: any) => {
      res.json({
        message: 'Hello World!',
      });
    });
    this.express.use('/', router);
  }
}

export default App;
