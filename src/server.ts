/* tslint:disable:no-console */
import commander from 'commander';
import fs from 'fs';
import path from 'path';
import app from './app';

commander.option('-c, --config <path>', 'Path to config file').parse(process.argv);

class Server {
  port = process.env.PORT || 3000;

  readFile = (configPath: string) => {
    console.log('Reading: ' + configPath);
    fs.readFile(configPath, { encoding: 'utf-8' }, (error, data) => {
      if (!error) {
        console.log('Received: ' + data);
        const json = JSON.parse(data);
        console.log('json test: ' + json.test);
      } else {
        console.error(error);
      }
    });
  };

  watchConfigForChanges = (configPath: string) => {
    fs.watchFile(configPath, () => {
      console.log(configPath + ' changed');
      this.readFile(configPath);
    });
  };

  run = () => {
    console.log('Starting run');
    let { config } = commander;
    if (config) {
      console.log('Reading config file from: ' + config);
    } else {
      config = './apimocker.json';
    }
    console.log(config);
    const filePath = path.join(__dirname, '..', config);
    this.readFile(filePath);
    this.watchConfigForChanges(filePath);

    app.listen(this.port, (err: any) => {
      if (err) {
        return console.log(err);
      }

      return console.log(`server is listening on ${this.port}`);
    });
  };
}

const server = new Server();
server.run();
