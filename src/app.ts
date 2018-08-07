/* tslint:disable:no-console */
import express from 'express';
import { Server } from 'http';

class App {
  port = process.env.PORT || 3000; // TODO: get port from the config file
  private express: express.Express;
  private config: IConfig;
  private httpServer?: Server;

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
  };

  start = (callback: ((error: Error) => void)) => {
    this.httpServer = this.express.listen(this.port, (error: Error) => {
      callback(error);
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
