import express from 'express';

class App {
  public express: any;
  private config: IConfig;

  constructor(config: IConfig) {
    this.config = config;
    this.express = express();
    this.mountRoutes();
  }

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
