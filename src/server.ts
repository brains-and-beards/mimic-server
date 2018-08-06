#!/usr/bin/env node
/* tslint:disable:no-console */
import commander from 'commander';
import fs from 'fs';
import App from './app';

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

  parseConfig = (configData: any): IConfig => {
    const projects: ReadonlyArray<IProject> = this.parseProjects(configData.projects);
    return {
      projects,
    };
  };

  parseProjects = (projectsData: any): ReadonlyArray<IProject> => {
    return projectsData.map((projectData: any) => {});
  };

  run = () => {
    console.log('Starting run');
    let { configData } = commander;
    if (configData) {
      console.log('Reading config file from: ' + configData);
    } else {
      configData = './apimocker.json';
    }
    console.log(configData);
    this.readFile(configData);
    this.watchConfigForChanges(configData);

    const config: IConfig = configData;
    const app = new App(configData);
    app.express.listen(this.port, (err: any) => {
      if (err) {
        return console.log(err);
      }

      return console.log(`server is listening on ${this.port}`);
    });
  };
}

const server = new Server();
server.run();
