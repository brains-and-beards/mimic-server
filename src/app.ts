/* tslint:disable:no-console */
import express from 'express';
import { Server } from 'http';

class App {
  port = process.env.PORT || 3000; //TODO: get port from the config file
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

  // TODO: make it async and return the close feedback
  stop = () => {
    if (this.httpServer) {
      this.httpServer.close((error: Error) => {
        console.log(error);
        console.log('close');
      });
    }
  };

  // TODO: make it async and return the listen feedback
  start = () => {
    // Move below to the app file
    this.httpServer = this.express.listen(this.port, (err: any) => {
      if (err) {
        return console.error(err);
      }

      return console.log(`server is listening on ${this.port}`);
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
