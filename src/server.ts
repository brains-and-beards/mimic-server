/* tslint:disable:no-console */
import commander from 'commander';
import app from './app';

commander.option('-c, --config <path>', 'Path to config file').parse(process.argv);

let { config } = commander;
if (config) {
  console.log('Reading config file from: ' + config);
} else {
  config = './apimocker.json';
}
console.log(commander.config);

const port = process.env.PORT || 3000;

app.listen(port, (err: any) => {
  if (err) {
    return console.log(err);
  }

  return console.log(`server is listening on ${port}`);
});
